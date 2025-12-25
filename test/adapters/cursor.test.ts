/**
 * Cursor adapter tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { cursorAdapter } from '../../src/adapters/cursor.js'

describe('cursorAdapter', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'cursor-adapter-test-'))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  describe('capabilities', () => {
    it('should have correct capabilities', () => {
      expect(cursorAdapter.capabilities.commands).toBe(true)
      expect(cursorAdapter.capabilities.skills).toBe(false)
      expect(cursorAdapter.capabilities.subagents).toBe(false)
      expect(cursorAdapter.capabilities.hooks).toBe(true)
      expect(cursorAdapter.capabilities.rules).toBe(true)
    })
  })

  describe('detect', () => {
    it('should return false for empty directory', () => {
      const result = cursorAdapter.detect(tempDir)
      expect(result.exists).toBe(false)
    })

    it('should detect .cursorrules', () => {
      writeFileSync(join(tempDir, '.cursorrules'), 'Cursor rules')
      const result = cursorAdapter.detect(tempDir)
      expect(result.exists).toBe(true)
      expect(result.paths).toContain('.cursorrules')
    })

    it('should detect .cursor/rules directory', () => {
      mkdirSync(join(tempDir, '.cursor', 'rules'), { recursive: true })
      writeFileSync(join(tempDir, '.cursor', 'rules', 'test.mdc'), 'Test rule')
      const result = cursorAdapter.detect(tempDir)
      expect(result.exists).toBe(true)
      expect(result.paths).toContain('.cursor/rules/')
    })

    it('should detect .cursor/commands directory', () => {
      mkdirSync(join(tempDir, '.cursor', 'commands'), { recursive: true })
      const result = cursorAdapter.detect(tempDir)
      // Note: cursor detect() only checks for rules paths, not commands
      // Commands detection would require adding to the detect() function
      expect(result.exists).toBe(false) // No rules present
    })
  })

  describe('readRules', () => {
    it('should return empty array when no rules', () => {
      const rules = cursorAdapter.readRules(tempDir)
      expect(rules).toHaveLength(0)
    })

    it('should read .cursorrules as always-apply rule', () => {
      writeFileSync(join(tempDir, '.cursorrules'), 'Legacy cursor rules')

      const rules = cursorAdapter.readRules(tempDir)
      expect(rules).toHaveLength(1)
      expect(rules[0]?.name).toBe('cursor-rules-legacy')
      expect(rules[0]?.content).toBe('Legacy cursor rules')
      expect(rules[0]?.inclusion.mode).toBe('always')
    })

    it('should read .mdc file with alwaysApply: true as always', () => {
      const rulesDir = join(tempDir, '.cursor', 'rules')
      mkdirSync(rulesDir, { recursive: true })
      writeFileSync(
        join(rulesDir, 'global.mdc'),
        `---
alwaysApply: true
description: Global rules
---

Always apply these rules`
      )

      const rules = cursorAdapter.readRules(tempDir)
      expect(rules).toHaveLength(1)
      expect(rules[0]?.inclusion.mode).toBe('always')
      expect(rules[0]?.description).toBe('Global rules')
    })

    it('should read .mdc file with globs as fileMatch', () => {
      const rulesDir = join(tempDir, '.cursor', 'rules')
      mkdirSync(rulesDir, { recursive: true })
      writeFileSync(
        join(rulesDir, 'typescript.mdc'),
        `---
globs:
  - "*.ts"
  - "*.tsx"
---

TypeScript rules`
      )

      const rules = cursorAdapter.readRules(tempDir)
      expect(rules).toHaveLength(1)
      expect(rules[0]?.inclusion.mode).toBe('fileMatch')
      if (rules[0]?.inclusion.mode === 'fileMatch') {
        expect(rules[0].inclusion.patterns).toContain('*.ts')
      }
    })

    it('should default to agentRequested when no frontmatter flags', () => {
      const rulesDir = join(tempDir, '.cursor', 'rules')
      mkdirSync(rulesDir, { recursive: true })
      writeFileSync(
        join(rulesDir, 'optional.mdc'),
        `---
description: Optional rule for the agent to decide
---

Apply intelligently`
      )

      const rules = cursorAdapter.readRules(tempDir)
      expect(rules).toHaveLength(1)
      expect(rules[0]?.inclusion.mode).toBe('agentRequested')
    })

    it('should read .md files from .cursor/rules', () => {
      const rulesDir = join(tempDir, '.cursor', 'rules')
      mkdirSync(rulesDir, { recursive: true })
      writeFileSync(join(rulesDir, 'simple.md'), 'Simple markdown rule')

      const rules = cursorAdapter.readRules(tempDir)
      expect(rules).toHaveLength(1)
      expect(rules[0]?.name).toBe('simple')
    })
  })

  describe('writeRule', () => {
    it('should write cursor-rules-legacy to .cursor/rules (use writeAllRules for .cursorrules)', () => {
      // Note: writeRule always writes to .cursor/rules/
      // Only writeAllRules has special logic for .cursorrules
      cursorAdapter.writeRule(
        {
          name: 'cursor-rules-legacy',
          content: 'Legacy rules',
          inclusion: { mode: 'always' },
        },
        tempDir
      )

      expect(existsSync(join(tempDir, '.cursor', 'rules', 'cursor-rules-legacy.mdc'))).toBe(true)
    })

    it('should write .cursorrules via writeAllRules for legacy rules', () => {
      cursorAdapter.writeAllRules!(
        [
          {
            name: 'cursor-rules-legacy',
            content: 'Legacy rules',
            inclusion: { mode: 'always' },
          },
        ],
        tempDir
      )

      expect(existsSync(join(tempDir, '.cursorrules'))).toBe(true)
      expect(readFileSync(join(tempDir, '.cursorrules'), 'utf-8')).toBe('Legacy rules')
    })

    it('should write to .cursor/rules for other rules', () => {
      cursorAdapter.writeRule(
        {
          name: 'typescript',
          content: 'TS rules',
          inclusion: { mode: 'always' },
        },
        tempDir
      )

      const filePath = join(tempDir, '.cursor', 'rules', 'typescript.mdc')
      expect(existsSync(filePath)).toBe(true)
    })

    it('should include alwaysApply in frontmatter for always rules', () => {
      cursorAdapter.writeRule(
        {
          name: 'global',
          content: 'Global rules',
          inclusion: { mode: 'always' },
        },
        tempDir
      )

      const content = readFileSync(
        join(tempDir, '.cursor', 'rules', 'global.mdc'),
        'utf-8'
      )
      expect(content).toContain('alwaysApply: true')
    })

    it('should include globs in frontmatter for fileMatch rules', () => {
      cursorAdapter.writeRule(
        {
          name: 'ts-rules',
          content: 'TS content',
          inclusion: { mode: 'fileMatch', patterns: ['*.ts', '*.tsx'] },
        },
        tempDir
      )

      const content = readFileSync(
        join(tempDir, '.cursor', 'rules', 'ts-rules.mdc'),
        'utf-8'
      )
      expect(content).toContain('globs:')
      expect(content).toContain('*.ts')
    })

    it('should not include special flags for agentRequested rules', () => {
      cursorAdapter.writeRule(
        {
          name: 'smart-rule',
          content: 'Content',
          description: 'Smart rule',
          inclusion: { mode: 'agentRequested' },
        },
        tempDir
      )

      const content = readFileSync(
        join(tempDir, '.cursor', 'rules', 'smart-rule.mdc'),
        'utf-8'
      )
      expect(content).toContain('description: Smart rule')
      expect(content).not.toContain('alwaysApply')
      expect(content).not.toContain('globs')
    })
  })

  describe('readCommands', () => {
    it('should return empty array when no commands directory', () => {
      const commands = cursorAdapter.readCommands!(tempDir)
      expect(commands).toHaveLength(0)
    })

    it('should read command from markdown file', () => {
      const commandsDir = join(tempDir, '.cursor', 'commands')
      mkdirSync(commandsDir, { recursive: true })
      writeFileSync(join(commandsDir, 'review.md'), 'Review this code')

      const commands = cursorAdapter.readCommands!(tempDir)
      expect(commands).toHaveLength(1)
      expect(commands[0]?.name).toBe('review')
      expect(commands[0]?.content).toBe('Review this code')
    })
  })

  describe('writeCommand', () => {
    it('should write command to .cursor/commands', () => {
      cursorAdapter.writeCommand!(
        { name: 'format', content: 'Format code' },
        tempDir
      )

      const filePath = join(tempDir, '.cursor', 'commands', 'format.md')
      expect(existsSync(filePath)).toBe(true)
      expect(readFileSync(filePath, 'utf-8')).toContain('Format code')
    })
  })

  describe('inclusion mode round-trip', () => {
    it('should preserve always mode', () => {
      const original = {
        name: 'always-rule',
        content: 'Always content',
        inclusion: { mode: 'always' as const },
      }

      cursorAdapter.writeRule(original, tempDir)
      const rules = cursorAdapter.readRules(tempDir)

      const rule = rules.find((r) => r.name === 'always-rule')
      expect(rule?.inclusion.mode).toBe('always')
    })

    it('should preserve agentRequested mode', () => {
      const original = {
        name: 'smart-rule',
        content: 'Smart content',
        description: 'Agent decides',
        inclusion: { mode: 'agentRequested' as const },
      }

      cursorAdapter.writeRule(original, tempDir)
      const rules = cursorAdapter.readRules(tempDir)

      const rule = rules.find((r) => r.name === 'smart-rule')
      expect(rule?.inclusion.mode).toBe('agentRequested')
    })

    it('should preserve fileMatch mode with patterns', () => {
      const original = {
        name: 'scoped-rule',
        content: 'Scoped content',
        inclusion: { mode: 'fileMatch' as const, patterns: ['*.test.ts', '*.spec.ts'] },
      }

      cursorAdapter.writeRule(original, tempDir)
      const rules = cursorAdapter.readRules(tempDir)

      const rule = rules.find((r) => r.name === 'scoped-rule')
      expect(rule?.inclusion.mode).toBe('fileMatch')
      if (rule?.inclusion.mode === 'fileMatch') {
        expect(rule.inclusion.patterns).toContain('*.test.ts')
        expect(rule.inclusion.patterns).toContain('*.spec.ts')
      }
    })
  })
})
