/**
 * Adapter registry tests
 *
 * Tests for getAdapter, getAdaptersWithCapability, getToolNames, detectTools
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import {
  adapters,
  getAdapter,
  getAdaptersWithCapability,
  getToolNames,
  detectTools,
} from '../../src/adapters/index.js'

describe('adapters registry', () => {
  it('should contain all expected adapters', () => {
    const expectedAdapters = [
      'claude-code',
      'cursor',
      'windsurf',
      'kiro',
      'copilot',
      'zed',
      'cline',
      'aider',
      'codex',
      'opencode',
      'gemini',
      'qodo',
      'amazon-q',
      'roo',
      'junie',
    ]

    for (const name of expectedAdapters) {
      expect(adapters[name as keyof typeof adapters]).toBeDefined()
    }
  })

  it('should have correct name property on each adapter', () => {
    for (const [name, adapter] of Object.entries(adapters)) {
      expect(adapter.name).toBe(name)
    }
  })
})

describe('getAdapter', () => {
  it('should return adapter for valid tool name', () => {
    const adapter = getAdapter('claude-code')
    expect(adapter).toBeDefined()
    expect(adapter.name).toBe('claude-code')
  })

  it('should return adapter for cursor', () => {
    const adapter = getAdapter('cursor')
    expect(adapter.name).toBe('cursor')
  })

  it('should throw for unknown tool name', () => {
    expect(() => getAdapter('unknown-tool' as 'cursor')).toThrow('Unknown tool: unknown-tool')
  })
})

describe('getAdaptersWithCapability', () => {
  it('should return adapters with commands capability', () => {
    const adaptersWithCommands = getAdaptersWithCapability('commands')
    expect(adaptersWithCommands.length).toBeGreaterThan(0)

    // Claude Code and Cursor should have commands
    const names = adaptersWithCommands.map((a) => a.name)
    expect(names).toContain('claude-code')
    expect(names).toContain('cursor')
  })

  it('should return adapters with skills capability', () => {
    const adaptersWithSkills = getAdaptersWithCapability('skills')

    // Claude Code and Kiro have skills
    const names = adaptersWithSkills.map((a) => a.name)
    expect(names).toContain('claude-code')
    expect(names).toContain('kiro')
  })

  it('should return adapters with subagents capability', () => {
    const adaptersWithSubagents = getAdaptersWithCapability('subagents')

    // Only Claude Code has subagents
    const names = adaptersWithSubagents.map((a) => a.name)
    expect(names).toContain('claude-code')
  })

  it('should return adapters with hooks capability', () => {
    const adaptersWithHooks = getAdaptersWithCapability('hooks')

    // Claude Code, Cursor, and Kiro have hooks
    const names = adaptersWithHooks.map((a) => a.name)
    expect(names).toContain('claude-code')
    expect(names).toContain('cursor')
    expect(names).toContain('kiro')
  })

  it('should return adapters with rules capability', () => {
    const adaptersWithRules = getAdaptersWithCapability('rules')

    // All adapters should have rules
    expect(adaptersWithRules.length).toBe(Object.keys(adapters).length)
  })

  it('should verify capability flag matches methods', () => {
    for (const adapter of Object.values(adapters)) {
      if (adapter.capabilities.commands) {
        expect(adapter.readCommands).toBeDefined()
        expect(adapter.writeCommand).toBeDefined()
      }
      if (adapter.capabilities.skills) {
        expect(adapter.readSkills).toBeDefined()
        expect(adapter.writeSkill).toBeDefined()
      }
      if (adapter.capabilities.subagents) {
        expect(adapter.readSubAgents).toBeDefined()
        expect(adapter.writeSubAgent).toBeDefined()
      }
      if (adapter.capabilities.hooks) {
        expect(adapter.readHooks).toBeDefined()
        expect(adapter.writeHook).toBeDefined()
      }
      // All adapters should have rules
      expect(adapter.readRules).toBeDefined()
      expect(adapter.writeRule).toBeDefined()
    }
  })
})

describe('getToolNames', () => {
  it('should return all tool names', () => {
    const names = getToolNames()
    expect(names).toContain('claude-code')
    expect(names).toContain('cursor')
    expect(names).toContain('windsurf')
    expect(names).toContain('kiro')
    expect(names).toContain('copilot')
    expect(names.length).toBe(Object.keys(adapters).length)
  })
})

describe('detectTools', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'detect-tools-test-'))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('should return empty map for empty directory', () => {
    const results = detectTools(tempDir)
    expect(results.size).toBe(0)
  })

  it('should detect CLAUDE.md', () => {
    writeFileSync(join(tempDir, 'CLAUDE.md'), '# Claude rules')
    const results = detectTools(tempDir)
    expect(results.has('claude-code')).toBe(true)
    const claudeResult = results.get('claude-code')
    expect(claudeResult?.exists).toBe(true)
    expect(claudeResult?.paths).toContain('CLAUDE.md')
  })

  it('should detect .cursorrules', () => {
    writeFileSync(join(tempDir, '.cursorrules'), 'Cursor rules')
    const results = detectTools(tempDir)
    expect(results.has('cursor')).toBe(true)
  })

  it('should detect .cursor/rules directory', () => {
    mkdirSync(join(tempDir, '.cursor', 'rules'), { recursive: true })
    writeFileSync(join(tempDir, '.cursor', 'rules', 'test.md'), 'Test rule')
    const results = detectTools(tempDir)
    expect(results.has('cursor')).toBe(true)
  })

  it('should detect .windsurfrules', () => {
    writeFileSync(join(tempDir, '.windsurfrules'), 'Windsurf rules')
    const results = detectTools(tempDir)
    expect(results.has('windsurf')).toBe(true)
  })

  it('should detect AGENTS.md (for kiro)', () => {
    writeFileSync(join(tempDir, 'AGENTS.md'), '# Agents')
    const results = detectTools(tempDir)
    expect(results.has('kiro')).toBe(true)
  })

  it('should detect multiple tools in same project', () => {
    writeFileSync(join(tempDir, 'CLAUDE.md'), '# Claude')
    writeFileSync(join(tempDir, '.cursorrules'), 'Cursor')
    writeFileSync(join(tempDir, '.windsurfrules'), 'Windsurf')

    const results = detectTools(tempDir)
    expect(results.has('claude-code')).toBe(true)
    expect(results.has('cursor')).toBe(true)
    expect(results.has('windsurf')).toBe(true)
  })

  it('should detect copilot instructions', () => {
    mkdirSync(join(tempDir, '.github'), { recursive: true })
    writeFileSync(join(tempDir, '.github', 'copilot-instructions.md'), 'Instructions')
    const results = detectTools(tempDir)
    expect(results.has('copilot')).toBe(true)
  })

  it('should detect .amazonq/rules directory', () => {
    mkdirSync(join(tempDir, '.amazonq', 'rules'), { recursive: true })
    writeFileSync(join(tempDir, '.amazonq', 'rules', 'test.md'), 'Test')
    const results = detectTools(tempDir)
    expect(results.has('amazon-q')).toBe(true)
  })

  it('should detect .roo/rules directory', () => {
    mkdirSync(join(tempDir, '.roo', 'rules'), { recursive: true })
    writeFileSync(join(tempDir, '.roo', 'rules', 'test.md'), 'Test')
    const results = detectTools(tempDir)
    expect(results.has('roo')).toBe(true)
  })
})
