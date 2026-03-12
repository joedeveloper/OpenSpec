## 1. Local Config Read/Write

- [ ] 1.1 Add `readLocalConfig(projectRoot: string): Partial<GlobalConfig> | null` to `src/core/global-config.ts` — reads `openspec/config.json`, parses JSON, returns null if not found, logs warning on parse errors
- [ ] 1.2 Add `saveLocalConfig(projectRoot: string, config: Partial<GlobalConfig>): void` to `src/core/global-config.ts` — writes JSON with 2-space indent and trailing newline, creates `openspec/` directory if needed
- [ ] 1.3 Add `getEffectiveConfig(projectRoot: string): GlobalConfig` to `src/core/global-config.ts` — calls `getGlobalConfig()`, then `readLocalConfig()`, returns shallow merge (`{ ...global, ...local }`) with local keys winning
- [ ] 1.4 Add unit tests for `readLocalConfig`: valid JSON, missing file, malformed JSON, empty object
- [ ] 1.5 Add unit tests for `getEffectiveConfig`: local overrides workflows, local overrides delivery, local overrides profile, no local config (fallback to global), partial local config (only some keys)

## 2. CLI Flag and Parsing

- [ ] 2.1 Add `--add-workflows <workflows>` option to the `init` command in `src/cli/index.ts` and pass it through to `InitCommand`
- [ ] 2.2 Add `addWorkflows` to `InitCommandOptions` type and store it in `InitCommand` constructor in `src/core/init.ts`
- [ ] 2.3 Implement `resolveAddWorkflows()` method in `InitCommand` — parse comma-separated IDs, validate each against `ALL_WORKFLOWS` by explicit lookup, deduplicate, return validated array or throw with clear error listing available IDs
- [ ] 2.4 Add unit tests for `resolveAddWorkflows()`: valid IDs, invalid IDs, empty string, duplicates within flag, mixed valid/invalid

## 3. Effective Workflow Merge and Generation

- [ ] 3.1 Add `mergeWorkflows(profileWorkflows: readonly string[], addWorkflows: string[]): string[]` helper in `src/core/profiles.ts` that deduplicates the union of both arrays
- [ ] 3.2 Update `generateSkillsAndCommands()` in `src/core/init.ts` to use `getEffectiveConfig(projectPath)` instead of `getGlobalConfig()`, then merge with `resolveAddWorkflows()` result via `mergeWorkflows()`
- [ ] 3.3 Add unit tests for `mergeWorkflows()`: no overlap, full overlap, partial overlap, empty addWorkflows

## 4. Local Config Persistence from Init

- [ ] 4.1 When `--add-workflows` is provided, compute the full effective workflow set, then call `saveLocalConfig()` with `{ profile: "custom", workflows: [...combined] }` — merge with existing local config if it already exists
- [ ] 4.2 Ensure local config.json is written even in non-interactive mode when `--add-workflows` is provided (no skip logic)
- [ ] 4.3 Add integration tests: new local config creation, merging into existing local config, overwriting previous workflows, non-interactive mode write, target path (`./dev_docs`)

## 5. Update Command Integration

- [ ] 5.1 Replace `getGlobalConfig()` with `getEffectiveConfig(resolvedProjectPath)` in `UpdateCommand.execute()` in `src/core/update.ts` for resolving profile, delivery, and workflows
- [ ] 5.2 Add integration tests: update with local config.json overriding workflows, update without local config (no regression), update with malformed local config (warning + fallback)

## 6. Cross-Platform and CI Verification

- [ ] 6.1 Ensure all new path operations in `readLocalConfig`, `saveLocalConfig`, and `getEffectiveConfig` use `path.join()` — no hardcoded separators
- [ ] 6.2 Use `path.join()` in test expected values for `openspec/config.json` paths
- [ ] 6.3 Verify Windows CI passes with local config.json read/write
