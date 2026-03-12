## ADDED Requirements

### Requirement: Local config file support

The system SHALL support a project-local configuration file at `openspec/config.json` that uses the same schema as the global config file (`~/.config/openspec/config.json`).

#### Scenario: Local config file exists

- **WHEN** `openspec/config.json` exists with valid JSON content
- **THEN** system parses the file and returns a partial GlobalConfig object

#### Scenario: Local config file does not exist

- **WHEN** `openspec/config.json` does not exist
- **THEN** system returns null without error

#### Scenario: Local config file has invalid JSON

- **WHEN** `openspec/config.json` contains malformed JSON
- **THEN** system logs a warning and returns null
- **AND** commands continue using global config only

#### Scenario: Local config file path uses cross-platform joining

- **WHEN** reading or writing `openspec/config.json`
- **THEN** the system SHALL construct the path using `path.join(projectRoot, 'openspec', 'config.json')`
- **AND** SHALL NOT hardcode forward or backward slashes

### Requirement: Layered config resolution

The system SHALL resolve effective configuration by layering local config over global config using shallow merge (local keys override global keys).

#### Scenario: Both global and local config exist

- **WHEN** global config contains `{ "profile": "custom", "delivery": "both", "workflows": ["propose", "explore", "apply"] }`
- **AND** local config contains `{ "profile": "custom", "workflows": ["propose", "explore", "apply", "continue", "verify"] }`
- **THEN** the effective config SHALL be `{ "profile": "custom", "delivery": "both", "workflows": ["propose", "explore", "apply", "continue", "verify"] }`
- **AND** the `delivery` value SHALL come from global config (not present in local)
- **AND** the `workflows` value SHALL come from local config (overrides global)

#### Scenario: Only global config exists

- **WHEN** global config exists
- **AND** local config does not exist
- **THEN** the effective config SHALL equal the global config
- **AND** behavior SHALL be identical to current behavior (no regression)

#### Scenario: Local config overrides profile

- **WHEN** global config contains `{ "profile": "core" }`
- **AND** local config contains `{ "profile": "custom", "workflows": ["propose", "apply", "verify"] }`
- **THEN** the effective profile SHALL be "custom"
- **AND** the effective workflows SHALL be ["propose", "apply", "verify"]

#### Scenario: Local config overrides delivery

- **WHEN** global config contains `{ "delivery": "both" }`
- **AND** local config contains `{ "delivery": "commands" }`
- **THEN** the effective delivery SHALL be "commands"

#### Scenario: Shallow merge does not deep-merge arrays

- **WHEN** global config contains `{ "workflows": ["propose", "explore", "apply", "archive"] }`
- **AND** local config contains `{ "workflows": ["propose", "apply"] }`
- **THEN** the effective workflows SHALL be exactly ["propose", "apply"]
- **AND** the system SHALL NOT append or union the arrays

### Requirement: Write local config

The system SHALL provide a function to write local config to `openspec/config.json`.

#### Scenario: Writing local config to new file

- **WHEN** `saveLocalConfig(projectRoot, config)` is called
- **AND** `openspec/config.json` does not exist
- **THEN** the system SHALL create the file with JSON content (2-space indent, trailing newline)

#### Scenario: Writing local config to existing file

- **WHEN** `saveLocalConfig(projectRoot, config)` is called
- **AND** `openspec/config.json` already exists
- **THEN** the system SHALL overwrite the file with the new config

#### Scenario: Writing local config creates parent directory

- **WHEN** `saveLocalConfig(projectRoot, config)` is called
- **AND** the `openspec/` directory does not exist
- **THEN** the system SHALL create the directory before writing the file
