## ADDED Requirements

### Requirement: Add-workflows CLI flag

The `openspec init` command SHALL accept an `--add-workflows <workflows>` option that specifies additional workflow IDs to install on top of the active profile.

#### Scenario: Adding workflows to core profile

- **WHEN** user runs `openspec init --tools windsurf --add-workflows continue,verify`
- **THEN** the effective workflow set SHALL be the core profile workflows (propose, explore, apply, archive) plus continue and verify
- **AND** skills and commands SHALL be generated for all 6 workflows for the windsurf tool

#### Scenario: Adding workflows to custom profile

- **WHEN** user runs `openspec init --profile custom --add-workflows onboard`
- **THEN** the effective workflow set SHALL be the custom profile workflows from effective config plus onboard
- **AND** duplicates between the custom set and onboard SHALL be silently deduplicated

#### Scenario: Adding workflows that overlap with profile

- **WHEN** user runs `openspec init --add-workflows propose,verify`
- **AND** the active profile is core (which includes propose)
- **THEN** the effective workflow set SHALL be propose, explore, apply, archive, verify
- **AND** the duplicate propose SHALL be silently deduplicated without warning

#### Scenario: Adding workflows without --tools flag (interactive mode)

- **WHEN** user runs `openspec init --add-workflows continue` without `--tools`
- **THEN** the interactive tool selection prompt SHALL still be displayed
- **AND** the extra workflows SHALL be merged after tool selection completes

### Requirement: Add-workflows validation

The `--add-workflows` flag SHALL validate each provided workflow ID against the `ALL_WORKFLOWS` constant by explicit lookup.

#### Scenario: Invalid workflow ID

- **WHEN** user runs `openspec init --add-workflows invalid-workflow`
- **THEN** the command SHALL fail with exit code 1
- **AND** display an error message listing the invalid ID and all available workflow IDs from `ALL_WORKFLOWS`

#### Scenario: Empty value after flag

- **WHEN** user runs `openspec init --add-workflows ""`
- **THEN** the command SHALL fail with exit code 1
- **AND** display an error explaining that at least one workflow ID is required

#### Scenario: Duplicate IDs in flag value

- **WHEN** user runs `openspec init --add-workflows verify,verify,continue`
- **THEN** the effective additions SHALL be deduplicated to verify and continue
- **AND** no warning SHALL be displayed for duplicates within the flag

#### Scenario: Mixed valid and invalid IDs

- **WHEN** user runs `openspec init --add-workflows continue,bogus`
- **THEN** the command SHALL fail with exit code 1
- **AND** display an error identifying bogus as invalid and listing available workflow IDs

### Requirement: Add-workflows persistence to local config.json

When `--add-workflows` is provided, the command SHALL compute the full effective workflow set and persist it to `openspec/config.json` as a `workflows` array with `profile` set to `"custom"`.

#### Scenario: Persisting to new local config.json

- **WHEN** user runs `openspec init --tools windsurf --add-workflows continue,verify`
- **AND** `openspec/config.json` does not exist
- **THEN** the command SHALL create `openspec/config.json` containing `{ "profile": "custom", "workflows": ["propose", "explore", "apply", "archive", "continue", "verify"] }`

#### Scenario: Persisting to existing local config.json

- **WHEN** user runs `openspec init --tools windsurf --add-workflows verify`
- **AND** `openspec/config.json` already exists with `{ "delivery": "commands" }`
- **THEN** the command SHALL merge the new fields into the existing local config
- **AND** the resulting file SHALL contain `delivery`, `profile`, and `workflows` fields

#### Scenario: Overwriting previous workflows in local config

- **WHEN** user runs `openspec init --add-workflows sync`
- **AND** `openspec/config.json` already contains `{ "profile": "custom", "workflows": ["continue", "verify"] }`
- **THEN** the `profile` and `workflows` fields SHALL be replaced with the newly computed values
- **AND** the previous workflows array SHALL not be merged (the new computation is the source of truth)

#### Scenario: Non-interactive mode writes local config

- **WHEN** user runs `openspec init --tools windsurf --add-workflows verify` in non-interactive mode (e.g., CI)
- **THEN** the command SHALL write `openspec/config.json` regardless of interactive mode restrictions
- **AND** the file SHALL be created even without `--force`

#### Scenario: Persisting with target path

- **WHEN** user runs `openspec init --tools windsurf --add-workflows continue,verify ./dev_docs`
- **THEN** the command SHALL write `./dev_docs/openspec/config.json` with the computed workflow set
