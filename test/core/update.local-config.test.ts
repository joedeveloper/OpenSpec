import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';

import { InitCommand } from '../../src/core/init.js';
import { UpdateCommand } from '../../src/core/update.js';
import { saveGlobalConfig } from '../../src/core/global-config.js';

describe('UpdateCommand local config integration', () => {
  let testDir: string;
  let configHomeDir: string;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `openspec-update-local-${randomUUID()}`);
    configHomeDir = path.join(os.tmpdir(), `openspec-config-home-${randomUUID()}`);
    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(configHomeDir, { recursive: true });

    originalEnv = { ...process.env };
    process.env.XDG_CONFIG_HOME = configHomeDir;
  });

  afterEach(async () => {
    process.env = originalEnv;
    await fs.rm(testDir, { recursive: true, force: true });
    await fs.rm(configHomeDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('uses local config workflows over global during update', async () => {
    saveGlobalConfig({ featureFlags: {}, profile: 'core', delivery: 'both' });

    const initCommand = new InitCommand({ tools: 'claude', force: true });
    await initCommand.execute(testDir);

    await fs.writeFile(
      path.join(testDir, 'openspec', 'config.json'),
      JSON.stringify({ profile: 'custom', workflows: ['propose', 'explore', 'apply', 'archive', 'continue', 'verify'] }, null, 2) + '\n',
      'utf-8'
    );

    const updateCommand = new UpdateCommand({ force: true });
    await updateCommand.execute(testDir);

    const verifySkill = path.join(testDir, '.claude', 'skills', 'openspec-verify-change', 'SKILL.md');
    const verifyCommand = path.join(testDir, '.claude', 'commands', 'opsx', 'verify.md');
    await expect(fs.stat(verifySkill)).resolves.toBeDefined();
    await expect(fs.stat(verifyCommand)).resolves.toBeDefined();
  });

  it('falls back to global config when no local config exists', async () => {
    saveGlobalConfig({ featureFlags: {}, profile: 'core', delivery: 'both' });

    const initCommand = new InitCommand({ tools: 'claude', force: true });
    await initCommand.execute(testDir);

    const updateCommand = new UpdateCommand({ force: true });
    await updateCommand.execute(testDir);

    const verifySkill = path.join(testDir, '.claude', 'skills', 'openspec-verify-change', 'SKILL.md');
    await expect(fs.stat(verifySkill)).rejects.toThrow();
  });

  it('warns and falls back to global config for malformed local config', async () => {
    saveGlobalConfig({ featureFlags: {}, profile: 'core', delivery: 'both' });

    const initCommand = new InitCommand({ tools: 'claude', force: true });
    await initCommand.execute(testDir);

    await fs.writeFile(path.join(testDir, 'openspec', 'config.json'), '{ malformed }', 'utf-8');

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const updateCommand = new UpdateCommand({ force: true });
    await updateCommand.execute(testDir);

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid JSON'));

    const verifySkill = path.join(testDir, '.claude', 'skills', 'openspec-verify-change', 'SKILL.md');
    await expect(fs.stat(verifySkill)).rejects.toThrow();
  });
});
