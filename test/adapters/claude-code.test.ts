/**
 * Claude Code adapter tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { claudeCodeAdapter } from '../../src/adapters/claude-code.js'

describe('claudeCodeAdapter', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'claude-code-adapter-test-'))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  describe('capabilities', () => {
    it('should have all capabilities enabled', () => {
      expect(claudeCodeAdapter.capabilities.commands).toBe(true)
      expect(claudeCodeAdapter.capabilities.skills).toBe(true)
      expect(claudeCodeAdapter.capabilities.subagents).toBe(true)
      expect(claudeCodeAdapter.capabilities.hooks).toBe(true)
      expect(claudeCodeAdapter.capabilities.rules).toBe(true)
    })
  })

  describe('detect', () => {
    it('should return false for empty directory', () => {
      const result = claudeCodeAdapter.detect(tempDir)
      expect(result.exists).toBe(false)
      expect(result.paths).toHaveLength(0)
    })

    it('should detect CLAUDE.md', () => {
      writeFileSync(join(tempDir, 'CLAUDE.md'), '# Claude rules')
      const result = claudeCodeAdapter.detect(tempDir)
      expect(result.exists).toBe(true)
      expect(result.paths).toContain('CLAUDE.md')
    })

    it('should detect .claude/commands directory', () => {
      mkdirSync(join(tempDir, '.claude', 'commands'), { recursive: true })
      const result = claudeCodeAdapter.detect(tempDir)
      expect(result.exists).toBe(true)
      expect(result.paths).toContain('.claude/commands/')
    })

    it('should detect .claude/skills directory', () => {
      mkdirSync(join(tempDir, '.claude', 'skills'), { recursive: true })
      const result = claudeCodeAdapter.detect(tempDir)
      expect(result.paths).toContain('.claude/skills/')
    })

    it('should detect .claude/agents directory', () => {
      mkdirSync(join(tempDir, '.claude', 'agents'), { recursive: true })
      const result = claudeCodeAdapter.detect(tempDir)
      expect(result.paths).toContain('.claude/agents/')
    })

    it('should detect .claude/rules directory', () => {
      mkdirSync(join(tempDir, '.claude', 'rules'), { recursive: true })
      const result = claudeCodeAdapter.detect(tempDir)
      expect(result.paths).toContain('.claude/rules/')
    })
  })

  describe('readCommands', () => {
    it('should return empty array when no commands directory', () => {
      const commands = claudeCodeAdapter.readCommands!(tempDir)
      expect(commands).toHaveLength(0)
    })

    it('should read command from markdown file', () => {
      const commandsDir = join(tempDir, '.claude', 'commands')
      mkdirSync(commandsDir, { recursive: true })
      writeFileSync(join(commandsDir, 'review.md'), 'Review this code')

      const commands = claudeCodeAdapter.readCommands!(tempDir)
      expect(commands).toHaveLength(1)
      expect(commands[0]?.name).toBe('review')
      expect(commands[0]?.content).toBe('Review this code')
    })

    it('should read command with frontmatter', () => {
      const commandsDir = join(tempDir, '.claude', 'commands')
      mkdirSync(commandsDir, { recursive: true })
      writeFileSync(
        join(commandsDir, 'format.md'),
        `---
description: Format code
allowed-tools:
  - Write
  - Edit
argument-hint: <file>
model: opus
---

Format the code properly`
      )

      const commands = claudeCodeAdapter.readCommands!(tempDir)
      expect(commands).toHaveLength(1)
      expect(commands[0]?.description).toBe('Format code')
      expect(commands[0]?.allowedTools).toEqual(['Write', 'Edit'])
      expect(commands[0]?.argumentHint).toBe('<file>')
      expect(commands[0]?.model).toBe('opus')
    })
  })

  describe('writeCommand', () => {
    it('should write command to file', () => {
      claudeCodeAdapter.writeCommand!(
        { name: 'test', content: 'Test command' },
        tempDir
      )

      const filePath = join(tempDir, '.claude', 'commands', 'test.md')
      expect(existsSync(filePath)).toBe(true)
      const content = readFileSync(filePath, 'utf-8')
      expect(content).toContain('Test command')
    })

    it('should write command with frontmatter', () => {
      claudeCodeAdapter.writeCommand!(
        {
          name: 'review',
          content: 'Review code',
          description: 'Code review',
          allowedTools: ['Read', 'Grep'],
        },
        tempDir
      )

      const content = readFileSync(
        join(tempDir, '.claude', 'commands', 'review.md'),
        'utf-8'
      )
      expect(content).toContain('description: Code review')
      expect(content).toContain('allowed-tools:')
    })
  })

  describe('readRules', () => {
    it('should return empty array when no rules', () => {
      const rules = claudeCodeAdapter.readRules(tempDir)
      expect(rules).toHaveLength(0)
    })

    it('should read CLAUDE.md as always-apply rule', () => {
      writeFileSync(join(tempDir, 'CLAUDE.md'), '# Project rules')

      const rules = claudeCodeAdapter.readRules(tempDir)
      expect(rules).toHaveLength(1)
      expect(rules[0]?.name).toBe('claude-md')
      expect(rules[0]?.content).toBe('# Project rules')
      expect(rules[0]?.inclusion.mode).toBe('always')
    })

    it('should read rules from .claude/rules directory', () => {
      const rulesDir = join(tempDir, '.claude', 'rules')
      mkdirSync(rulesDir, { recursive: true })
      writeFileSync(join(rulesDir, 'typescript.md'), 'TypeScript rules')

      const rules = claudeCodeAdapter.readRules(tempDir)
      expect(rules).toHaveLength(1)
      expect(rules[0]?.name).toBe('typescript')
    })

    it('should read rule with globs as fileMatch', () => {
      const rulesDir = join(tempDir, '.claude', 'rules')
      mkdirSync(rulesDir, { recursive: true })
      writeFileSync(
        join(rulesDir, 'ts-rules.md'),
        `---
globs:
  - "*.ts"
  - "*.tsx"
---

TypeScript specific rules`
      )

      const rules = claudeCodeAdapter.readRules(tempDir)
      expect(rules).toHaveLength(1)
      expect(rules[0]?.inclusion.mode).toBe('fileMatch')
      if (rules[0]?.inclusion.mode === 'fileMatch') {
        expect(rules[0].inclusion.patterns).toContain('*.ts')
        expect(rules[0].inclusion.patterns).toContain('*.tsx')
      }
    })
  })

  describe('writeRule', () => {
    it('should write CLAUDE.md for claude-md rule', () => {
      claudeCodeAdapter.writeRule(
        {
          name: 'claude-md',
          content: '# Rules',
          inclusion: { mode: 'always' },
        },
        tempDir
      )

      expect(existsSync(join(tempDir, 'CLAUDE.md'))).toBe(true)
      expect(readFileSync(join(tempDir, 'CLAUDE.md'), 'utf-8')).toBe('# Rules')
    })

    it('should write rule to .claude/rules for other rules', () => {
      claudeCodeAdapter.writeRule(
        {
          name: 'typescript',
          content: 'TS rules',
          inclusion: { mode: 'always' },
        },
        tempDir
      )

      const filePath = join(tempDir, '.claude', 'rules', 'typescript.md')
      expect(existsSync(filePath)).toBe(true)
    })

    it('should include globs in frontmatter for fileMatch rules', () => {
      claudeCodeAdapter.writeRule(
        {
          name: 'ts-rules',
          content: 'TS content',
          inclusion: { mode: 'fileMatch', patterns: ['*.ts'] },
        },
        tempDir
      )

      const content = readFileSync(
        join(tempDir, '.claude', 'rules', 'ts-rules.md'),
        'utf-8'
      )
      expect(content).toContain('globs:')
      expect(content).toContain('*.ts')
    })
  })

  describe('readSkills', () => {
    it('should return empty array when no skills directory', () => {
      const skills = claudeCodeAdapter.readSkills!(tempDir)
      expect(skills).toHaveLength(0)
    })

    it('should read skill from SKILL.md', () => {
      const skillDir = join(tempDir, '.claude', 'skills', 'typescript')
      mkdirSync(skillDir, { recursive: true })
      writeFileSync(
        join(skillDir, 'SKILL.md'),
        `---
description: TypeScript expertise
---

TypeScript skill content`
      )

      const skills = claudeCodeAdapter.readSkills!(tempDir)
      expect(skills).toHaveLength(1)
      expect(skills[0]?.name).toBe('typescript')
      expect(skills[0]?.description).toBe('TypeScript expertise')
      expect(skills[0]?.content).toBe('TypeScript skill content')
    })

    it('should read skill resources', () => {
      const skillDir = join(tempDir, '.claude', 'skills', 'coding')
      mkdirSync(skillDir, { recursive: true })
      writeFileSync(
        join(skillDir, 'SKILL.md'),
        `---
description: Coding skill
---
Skill content`
      )
      writeFileSync(join(skillDir, 'helper.sh'), '#!/bin/bash\necho "hello"')

      const skills = claudeCodeAdapter.readSkills!(tempDir)
      expect(skills).toHaveLength(1)
      expect(skills[0]?.resources).toHaveLength(1)
      expect(skills[0]?.resources?.[0]?.filename).toBe('helper.sh')
      // Resource type defaults to 'documentation' - consumers can infer type from extension if needed
      expect(skills[0]?.resources?.[0]?.type).toBe('documentation')
    })
  })

  describe('writeSkill', () => {
    it('should write skill to directory', () => {
      claudeCodeAdapter.writeSkill!(
        {
          name: 'typescript',
          description: 'TS expertise',
          content: 'Skill content',
        },
        tempDir
      )

      const skillMd = join(tempDir, '.claude', 'skills', 'typescript', 'SKILL.md')
      expect(existsSync(skillMd)).toBe(true)
      const content = readFileSync(skillMd, 'utf-8')
      expect(content).toContain('description: TS expertise')
      expect(content).toContain('Skill content')
    })

    it('should write skill with resources', () => {
      claudeCodeAdapter.writeSkill!(
        {
          name: 'coding',
          description: 'Coding',
          content: 'Content',
          resources: [
            { filename: 'helper.sh', content: '#!/bin/bash', type: 'script' },
          ],
        },
        tempDir
      )

      const helperPath = join(tempDir, '.claude', 'skills', 'coding', 'helper.sh')
      expect(existsSync(helperPath)).toBe(true)
      expect(readFileSync(helperPath, 'utf-8')).toBe('#!/bin/bash')
    })
  })

  describe('readSubAgents', () => {
    it('should return empty array when no agents directory', () => {
      const agents = claudeCodeAdapter.readSubAgents!(tempDir)
      expect(agents).toHaveLength(0)
    })

    it('should read subagent from markdown file', () => {
      const agentsDir = join(tempDir, '.claude', 'agents')
      mkdirSync(agentsDir, { recursive: true })
      writeFileSync(
        join(agentsDir, 'reviewer.md'),
        `---
description: Code reviewer agent
tools:
  - Read
  - Grep
model: sonnet
---

You are a code reviewer.`
      )

      const agents = claudeCodeAdapter.readSubAgents!(tempDir)
      expect(agents).toHaveLength(1)
      expect(agents[0]?.name).toBe('reviewer')
      expect(agents[0]?.description).toBe('Code reviewer agent')
      expect(agents[0]?.systemPrompt).toBe('You are a code reviewer.')
      expect(agents[0]?.tools).toEqual(['Read', 'Grep'])
      expect(agents[0]?.model).toBe('sonnet')
    })
  })

  describe('writeSubAgent', () => {
    it('should write subagent to file', () => {
      claudeCodeAdapter.writeSubAgent!(
        {
          name: 'reviewer',
          description: 'Reviews code',
          systemPrompt: 'You are a reviewer',
        },
        tempDir
      )

      const filePath = join(tempDir, '.claude', 'agents', 'reviewer.md')
      expect(existsSync(filePath)).toBe(true)
      const content = readFileSync(filePath, 'utf-8')
      expect(content).toContain('description: Reviews code')
      expect(content).toContain('You are a reviewer')
    })

    it('should write subagent with all fields', () => {
      claudeCodeAdapter.writeSubAgent!(
        {
          name: 'expert',
          description: 'Expert agent',
          systemPrompt: 'You are an expert',
          tools: ['Read', 'Write'],
          model: 'opus',
          permissionMode: 'acceptEdits',
          skills: ['typescript'],
        },
        tempDir
      )

      const content = readFileSync(
        join(tempDir, '.claude', 'agents', 'expert.md'),
        'utf-8'
      )
      expect(content).toContain('tools:')
      expect(content).toContain('model: opus')
      expect(content).toContain('permissionMode: acceptEdits')
      expect(content).toContain('skills:')
    })
  })

  describe('round-trip', () => {
    it('should round-trip commands correctly', () => {
      const original = {
        name: 'test-cmd',
        content: 'Test command content',
        description: 'A test command',
        allowedTools: ['Read', 'Write'],
      }

      claudeCodeAdapter.writeCommand!(original, tempDir)
      const commands = claudeCodeAdapter.readCommands!(tempDir)

      expect(commands).toHaveLength(1)
      expect(commands[0]?.name).toBe(original.name)
      expect(commands[0]?.content).toBe(original.content)
      expect(commands[0]?.description).toBe(original.description)
      expect(commands[0]?.allowedTools).toEqual(original.allowedTools)
    })

    it('should round-trip rules correctly', () => {
      const original = {
        name: 'test-rule',
        content: 'Rule content',
        description: 'A test rule',
        inclusion: { mode: 'fileMatch' as const, patterns: ['*.ts', '*.tsx'] },
      }

      claudeCodeAdapter.writeRule(original, tempDir)
      const rules = claudeCodeAdapter.readRules(tempDir)

      const rule = rules.find((r) => r.name === 'test-rule')
      expect(rule).toBeDefined()
      expect(rule?.content).toBe(original.content)
      expect(rule?.inclusion.mode).toBe('fileMatch')
      if (rule?.inclusion.mode === 'fileMatch') {
        expect(rule.inclusion.patterns).toEqual(['*.ts', '*.tsx'])
      }
    })
  })
})
