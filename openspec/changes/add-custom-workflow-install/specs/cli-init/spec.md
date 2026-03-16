## MODIFIED Requirements

### Requirement: Non-Interactive Mode

The command SHALL support non-interactive operation through command-line options, including the new `--add-workflows` flag.

#### Scenario: Select all tools non-interactively

- **WHEN** run with `--tools all`
- **THEN** automatically select every available AI tool without prompting
- **AND** proceed with skill and command generation

#### Scenario: Select specific tools non-interactively

- **WHEN** run with `--tools claude,cursor`
- **THEN** parse the comma-separated tool IDs
- **AND** generate skills and commands for specified tools only

#### Scenario: Skip tool configuration non-interactively

- **WHEN** run with `--tools none`
- **THEN** create only the openspec directory structure
- **AND** skip skill and command generation
- **AND** create config only when config creation conditions are met

#### Scenario: Invalid tool specification

- **WHEN** run with `--tools invalid-tool`
- **THEN** fail with exit code 1
- **AND** display an error listing available values (`all`, `none`, and supported tool IDs)

#### Scenario: Reserved value combined with tool IDs

- **WHEN** run with `--tools all,claude` or `--tools none,cursor`
- **THEN** fail with exit code 1
- **AND** display an error explaining reserved values cannot be combined with specific tool IDs

#### Scenario: Missing --tools in non-interactive mode

- **GIVEN** prompts are unavailable in non-interactive execution
- **WHEN** user runs `openspec init` without `--tools`
- **THEN** fail with exit code 1
- **AND** instruct to use `--tools all`, `--tools none`, or explicit tool IDs

#### Scenario: Using --add-workflows with --tools

- **WHEN** run with `--tools windsurf --add-workflows continue,verify`
- **THEN** resolve the effective workflow set via layered config (global → local), merge with the add-workflows values, and deduplicate
- **AND** generate skills and commands for the windsurf tool using the effective workflow set
- **AND** write the combined workflow set to `openspec/config.json` with `"profile": "custom"`

### Requirement: Skill Generation

The command SHALL generate Agent Skills for selected AI tools based on the effective workflow set (resolved from layered config, merged with any `--add-workflows`).

#### Scenario: Generating skills for a tool

- **WHEN** a tool is selected during initialization
- **THEN** create skill directories under `.<tool>/skills/` for each workflow in the effective set
- **AND** each SKILL.md SHALL contain YAML frontmatter with name and description
- **AND** each SKILL.md SHALL contain the skill instructions

#### Scenario: Generating skills with add-workflows

- **WHEN** a tool is selected and `--add-workflows continue,verify` is provided with core profile
- **THEN** create 6 skill directories (4 core + continue + verify) under `.<tool>/skills/`
- **AND** the skill directories SHALL include `openspec-continue-change/SKILL.md` and `openspec-verify-change/SKILL.md` in addition to the 4 core skill directories

### Requirement: Slash Command Generation

The command SHALL generate opsx slash commands for selected AI tools based on the effective workflow set.

#### Scenario: Generating slash commands for a tool

- **WHEN** a tool is selected during initialization
- **THEN** create slash command files using the tool's command adapter for each workflow in the effective set
- **AND** use tool-specific path conventions
- **AND** include tool-specific frontmatter format

#### Scenario: Generating slash commands with add-workflows

- **WHEN** a tool is selected and `--add-workflows continue,verify` is provided with core profile
- **THEN** create 6 slash command files (4 core + continue + verify)
- **AND** the commands SHALL include `/opsx:continue` and `/opsx:verify` in addition to the 4 core commands
