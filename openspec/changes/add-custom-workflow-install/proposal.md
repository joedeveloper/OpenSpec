## Why

Teams working on complex spec/codebase combinations need more workflows than the core profile provides, but the current profile system only offers two choices: `core` (4 fixed workflows) or `custom` (whatever is in the global config at `~/.config/openspec/config.json`). There is no way to say "core plus these extras" at init time, and no per-project override.

This creates friction for teams that want a repo-level baseline — e.g., always including `continue` (for multi-session safety with context rot) and `verify` (to enforce verification during speccing and implementation) — without switching to a fully custom global profile that bleeds across unrelated projects.

When developers work across multiple projects by different open-source maintainers, all using OpenSpec, the global-only config becomes a problem: changing your global profile for one project silently affects every other project.

## What Changes

### 1. Layered Config (local `openspec/config.json` overrides global)

Introduce a project-local `openspec/config.json` that uses the same schema as the global `~/.config/openspec/config.json`. Resolution is layered: global config is read first, then local config overwrites any keys it defines (shallow merge).

This is the standard pattern used by git, eslint, prettier, etc.

```
# Global (~/.config/openspec/config.json) — personal defaults
{ "profile": "custom", "delivery": "both", "workflows": ["propose", "explore", "apply", "archive", "sync"] }

# Local (openspec/config.json) — project override, committed to repo
{ "profile": "custom", "workflows": ["propose", "explore", "apply", "archive", "continue", "verify"] }

# Effective for this project: local wins for keys it defines, global fills the rest
{ "profile": "custom", "delivery": "both", "workflows": ["propose", "explore", "apply", "archive", "continue", "verify"] }
```

### 2. New `--add-workflows` flag on `openspec init`

Accepts a comma-separated list of workflow IDs to install on top of the resolved profile:
```
openspec init --tools windsurf --add-workflows continue,verify ./dev_docs
```

This resolves the effective workflow set (profile workflows + extras), deduplicates, and writes the result to `./dev_docs/openspec/config.json` as:
```json
{
  "profile": "custom",
  "workflows": ["propose", "explore", "apply", "archive", "continue", "verify"]
}
```

- **Validation**: Each workflow ID is validated against `ALL_WORKFLOWS`. Invalid IDs produce a clear error listing available workflows.
- **Composable with `--profile`**: `--add-workflows` extends whatever profile is active.

### 3. All commands use layered config

Both `openspec init` and `openspec update` resolve effective config via layered resolution (global → local) instead of global-only. This means a project with a local config.json will use its workflow set regardless of what the developer's global config says.

## Capabilities

### New Capabilities

- `local-config`: Project-local `openspec/config.json` with layered resolution over global config. Same schema, shallow merge semantics.
- `add-workflows-flag`: CLI flag `--add-workflows` on `openspec init` that computes the combined workflow set and persists it to local `openspec/config.json`.

### Modified Capabilities

- `cli-init`: Accepts `--add-workflows` flag, resolves effective workflows, writes local `openspec/config.json`.
- `cli-update`: Resolves effective config via layered resolution (global → local) for workflow generation.

## Impact

- **`src/core/global-config.ts`**: Add `getEffectiveConfig(projectRoot)` that layers local over global, and `saveLocalConfig(projectRoot, config)` for writing local config.json.
- **`src/cli/index.ts`**: Add `--add-workflows <workflows>` option to the `init` command definition.
- **`src/core/init.ts`**: Accept, parse, validate `--add-workflows`; compute effective workflow set; write local `openspec/config.json`.
- **`src/core/update.ts`**: Replace `getGlobalConfig()` with `getEffectiveConfig(projectRoot)` for workflow resolution.
- **`src/core/profiles.ts`**: Add `mergeWorkflows()` helper for deduplicating profile + extra workflows.
- **Tests**: Unit tests for layered config resolution, flag parsing, validation, deduplication, persistence, and update integration.
