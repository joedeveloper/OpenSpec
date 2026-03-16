## MODIFIED Requirements

### Requirement: Update Behavior

The update command SHALL update OpenSpec instruction files to the latest templates using the effective workflow set resolved via layered config (global → local `openspec/config.json`).

#### Scenario: Running update command

- **WHEN** a user runs `openspec update`
- **THEN** replace `openspec/AGENTS.md` with the latest template
- **AND** if a root-level stub (`AGENTS.md`/`CLAUDE.md`) exists, refresh it so it points to `@/openspec/AGENTS.md`

#### Scenario: Update with local config.json overriding workflows

- **WHEN** a user runs `openspec update`
- **AND** `openspec/config.json` contains `{ "profile": "custom", "workflows": ["propose", "explore", "apply", "archive", "continue", "verify"] }`
- **AND** the global profile is core
- **THEN** the effective config SHALL use the local config.json values (profile: custom, workflows from local)
- **AND** skills and commands SHALL be generated for all 6 workflows
- **AND** workflows not in the effective set SHALL be removed (consistent with existing deselection cleanup)

#### Scenario: Update with local config.json overriding delivery only

- **WHEN** a user runs `openspec update`
- **AND** `openspec/config.json` contains `{ "delivery": "commands" }`
- **AND** the global config has `{ "profile": "core", "delivery": "both" }`
- **THEN** the effective delivery SHALL be "commands" (from local)
- **AND** the effective profile SHALL be "core" (from global, not overridden locally)
- **AND** only command files SHALL be generated (no skills)

#### Scenario: Update without local config.json

- **WHEN** a user runs `openspec update`
- **AND** `openspec/config.json` does not exist
- **THEN** the effective config SHALL be determined solely by the global config
- **AND** behavior SHALL be identical to current update behavior (no regression)

#### Scenario: Update with invalid local config.json

- **WHEN** a user runs `openspec update`
- **AND** `openspec/config.json` contains malformed JSON
- **THEN** the system SHALL log a warning about the parse error
- **AND** the effective config SHALL fall back to global config only
- **AND** the update SHALL proceed without failing
