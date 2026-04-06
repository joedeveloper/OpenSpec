## Context

OpenSpec's configuration currently lives in a single global file (`~/.config/openspec/config.json`) containing `profile`, `delivery`, and `workflows`. The project-level config (`openspec/config.yaml`) stores only schema, context, and rules — nothing about workflow selection.

This means all projects on a developer's machine share the same workflow configuration. When working across multiple projects with different needs (e.g., a complex project needing `continue` + `verify`, vs a simple one using core only), developers must manually toggle their global config or accept a one-size-fits-all setup.

The existing config infrastructure:
- **Global config** (`~/.config/openspec/config.json`): `getGlobalConfig()` reads it, `saveGlobalConfig()` writes it, shallow merge with defaults
- **Project config** (`openspec/config.yaml`): `readProjectConfig()` reads it, separate Zod schema (`ProjectConfigSchema`), stores schema/context/rules
- **Profile resolution**: `getProfileWorkflows(profile, customWorkflows)` returns the workflow set

## Goals / Non-Goals

**Goals:**

- Introduce a local `openspec/config.json` that layers over global config.json (same schema, shallow merge)
- Add `--add-workflows <ids>` flag to `openspec init` that computes and persists the combined workflow set to local config.json
- Make `openspec init` and `openspec update` resolve effective config via layered resolution
- Keep the existing `openspec/config.yaml` untouched (it handles schema/context/rules, a separate concern)

**Non-Goals:**

- Merging config.yaml and config.json into one file (they serve different purposes)
- Deep merge semantics (shallow key-level override is simpler and more predictable)
- `openspec config` CLI writing to local config (global-only for now; local is written by init or manual edit)
- Deprecating or changing global config behavior

## Decisions

### 1. Two config files in `openspec/`, separate concerns

| File | Format | Purpose | Written by |
|------|--------|---------|------------|
| `openspec/config.yaml` | YAML | Schema, context, rules (artifact workflow) | `openspec init`, manual |
| `openspec/config.json` | JSON | Profile, delivery, workflows (tool selection) | `openspec init --add-workflows`, manual |

**Why not merge into config.yaml?** The global config is JSON. Keeping local config as JSON means identical schema, identical parsing, and trivial shallow merge. Mixing YAML fields with JSON-schema fields would create confusion.

**Why not config.json for everything?** The existing config.yaml is established and handles a different concern (schema resolution, context injection, rules). Changing it would be a breaking change for no benefit.

### 2. Layered resolution: `getEffectiveConfig(projectRoot)`

New function in `global-config.ts`:

```
function getEffectiveConfig(projectRoot: string): GlobalConfig {
  const global = getGlobalConfig();           // existing
  const local = readLocalConfig(projectRoot); // new
  if (!local) return global;
  return { ...global, ...local };             // shallow merge, local wins
}
```

Shallow merge means: if local config.json has `"workflows"`, it completely replaces the global `workflows` array. No array merging. This is predictable and matches how tools like `.npmrc`, `tsconfig.json` (with `extends`), and git config work.

**Why shallow, not deep?** Deep merge of arrays (e.g., appending workflows) is ambiguous — does the user want to add or replace? Shallow replacement is unambiguous: what's in local is what you get for that key.

### 3. `--add-workflows` computes and persists the full set

When the user runs:
```
openspec init --tools windsurf --add-workflows continue,verify
```

The init command:
1. Resolves profile workflows from effective config (e.g., core → [propose, explore, apply, archive])
2. Merges with `--add-workflows` values → [propose, explore, apply, archive, continue, verify]
3. Deduplicates
4. Writes `openspec/config.json` with `{ "profile": "custom", "workflows": [<combined>] }`
5. Uses the combined set for skill/command generation

The persisted config uses `"profile": "custom"` because the workflow set is now explicitly defined — it no longer matches any named profile.

### 4. Flag parsing and validation

- Comma-separated list, same parsing style as `--tools`
- Each ID validated against `ALL_WORKFLOWS` by explicit lookup
- Invalid IDs produce an error listing all available workflow IDs
- Empty string after flag is an error
- Duplicates within the flag are silently deduplicated
- Duplicates with the profile set are silently deduplicated

### 5. `readLocalConfig()` and `saveLocalConfig()`

New functions in `global-config.ts`:

```typescript
function readLocalConfig(projectRoot: string): Partial<GlobalConfig> | null
function saveLocalConfig(projectRoot: string, config: Partial<GlobalConfig>): void
```

- `readLocalConfig` reads `openspec/config.json`, parses JSON, returns null if not found
- `saveLocalConfig` writes JSON with 2-space indent, creates file if needed
- Both use `path.join()` for cross-platform paths
- Parse errors log a warning and return null (resilient, same pattern as global config)

### 6. Update command integration

`UpdateCommand.execute()` currently calls `getGlobalConfig()` to resolve profile/delivery/workflows. After this change, it calls `getEffectiveConfig(projectRoot)` instead. This is a single call-site change — the rest of the update logic works unchanged because it already operates on the resolved config.

### 7. Init command: when to write local config.json

- **`--add-workflows` provided**: Always write local config.json with the computed workflow set
- **`--add-workflows` not provided**: Do not create local config.json (preserve current behavior, global config is sufficient)
- **Local config.json already exists**: Read-modify-write (merge new fields with existing local config)

## Risks / Trade-offs

- **Two JSON configs** → Developers see `~/.config/openspec/config.json` (global) and `openspec/config.json` (local). This follows standard conventions but could cause initial confusion. Mitigation: clear documentation and `openspec config` output showing effective values.

- **Shallow merge loses global array entries** → If global has `workflows: [a, b, c]` and local has `workflows: [a, b]`, the effective set is `[a, b]`. This is intentional — local is the override — but could surprise users who expect additive behavior. Mitigation: `--add-workflows` does the additive computation at init time and persists the full result.

- **No `openspec config` support for local config** → The `openspec config` CLI currently reads/writes global config only. Adding local config write support is out of scope. Users can edit `openspec/config.json` manually or re-run init with `--add-workflows`.

- **No removal path** → There's no `--remove-workflows` flag. Users can manually edit `openspec/config.json` to adjust. Acceptable for v1.
