/**
 * Model factory function tests
 *
 * Tests for createCommand, createSkill, createSubAgent, createHook, createRule
 * and related helper functions.
 */

import { describe, it, expect } from 'vitest'
import {
  createCommand,
  createSkill,
  createSubAgent,
  createHook,
  createRule,
  createAlwaysRule,
  createFileMatchRule,
  createAgentRequestedRule,
  createManualRule,
} from '../src/models/index.js'

describe('createCommand', () => {
  // Positive tests
  it('should create a valid command with required fields', () => {
    const cmd = createCommand({ name: 'test', content: 'Test content' })
    expect(cmd.name).toBe('test')
    expect(cmd.content).toBe('Test content')
  })

  it('should create a command with all optional fields', () => {
    const cmd = createCommand({
      name: 'review-code',
      content: 'Review this code',
      description: 'Code review checklist',
      allowedTools: ['Read', 'Grep'],
      argumentHint: '<file>',
      model: 'opus',
      disableModelInvocation: true,
    })
    expect(cmd.description).toBe('Code review checklist')
    expect(cmd.allowedTools).toEqual(['Read', 'Grep'])
    expect(cmd.argumentHint).toBe('<file>')
    expect(cmd.model).toBe('opus')
    expect(cmd.disableModelInvocation).toBe(true)
  })

  // Negative tests
  it('should throw when name is empty', () => {
    expect(() => createCommand({ name: '', content: 'Test' })).toThrow(
      'Invalid command: Commands must have a name field'
    )
  })

  it('should throw when name is whitespace only', () => {
    expect(() => createCommand({ name: '   ', content: 'Test' })).toThrow(
      'Invalid command'
    )
  })

  it('should throw when name is missing', () => {
    expect(() =>
      createCommand({ name: undefined as unknown as string, content: 'Test' })
    ).toThrow('Invalid command')
  })
})

describe('createSkill', () => {
  // Positive tests
  it('should create a valid skill with required fields', () => {
    const skill = createSkill({
      name: 'typescript-expert',
      description: 'TypeScript expertise',
      content: 'Skill content here',
    })
    expect(skill.name).toBe('typescript-expert')
    expect(skill.description).toBe('TypeScript expertise')
    expect(skill.content).toBe('Skill content here')
  })

  it('should create a skill with resources', () => {
    const skill = createSkill({
      name: 'coding',
      description: 'Coding skill',
      content: 'Content',
      allowedTools: ['Write'],
      resources: [
        { filename: 'helper.sh', content: '#!/bin/bash', type: 'script' },
      ],
    })
    expect(skill.allowedTools).toEqual(['Write'])
    expect(skill.resources).toHaveLength(1)
    expect(skill.resources?.[0]?.type).toBe('script')
  })

  // Negative tests
  it('should throw when name is empty', () => {
    expect(() =>
      createSkill({ name: '', description: 'Desc', content: 'Content' })
    ).toThrow('Invalid skill')
  })

  it('should throw when description is missing', () => {
    expect(() =>
      createSkill({
        name: 'test',
        description: '',
        content: 'Content',
      })
    ).toThrow('Invalid skill: Skills must have a description field')
  })

  it('should throw when both name and description are missing', () => {
    expect(() =>
      createSkill({ name: '', description: '', content: 'Content' })
    ).toThrow('Invalid skill')
  })

  it('should throw when description exceeds 1024 characters', () => {
    const longDescription = 'a'.repeat(1025)
    expect(() =>
      createSkill({ name: 'test', description: longDescription, content: 'Content' })
    ).toThrow('1024')
  })
})

describe('createSubAgent', () => {
  // Positive tests
  it('should create a valid subagent with required fields', () => {
    const agent = createSubAgent({
      name: 'code-reviewer',
      description: 'Reviews code for issues',
      systemPrompt: 'You are a code reviewer',
    })
    expect(agent.name).toBe('code-reviewer')
    expect(agent.description).toBe('Reviews code for issues')
    expect(agent.systemPrompt).toBe('You are a code reviewer')
  })

  it('should create a subagent with all optional fields', () => {
    const agent = createSubAgent({
      name: 'reviewer',
      description: 'Reviewer',
      systemPrompt: 'Review code',
      tools: ['Read', 'Grep'],
      model: 'sonnet',
      permissionMode: 'acceptEdits',
      skills: ['typescript-expert'],
    })
    expect(agent.tools).toEqual(['Read', 'Grep'])
    expect(agent.model).toBe('sonnet')
    expect(agent.permissionMode).toBe('acceptEdits')
    expect(agent.skills).toEqual(['typescript-expert'])
  })

  // Negative tests
  it('should throw when name is empty', () => {
    expect(() =>
      createSubAgent({
        name: '',
        description: 'Desc',
        systemPrompt: 'Prompt',
      })
    ).toThrow('Invalid subagent')
  })

  it('should throw when description is missing', () => {
    expect(() =>
      createSubAgent({
        name: 'test',
        description: '',
        systemPrompt: 'Prompt',
      })
    ).toThrow('Invalid subagent: SubAgents must have a description field')
  })

  it('should throw when name exceeds 64 characters', () => {
    const longName = 'a'.repeat(65)
    expect(() =>
      createSubAgent({
        name: longName,
        description: 'Description',
        systemPrompt: 'Prompt',
      })
    ).toThrow('64')
  })
})

describe('createHook', () => {
  // Positive tests - Claude Code events
  it('should create a valid hook with Claude Code event', () => {
    const hook = createHook({
      event: 'PreToolUse',
      command: 'echo "before tool"',
    })
    expect(hook.event).toBe('PreToolUse')
    expect(hook.command).toBe('echo "before tool"')
  })

  it('should create a hook with all optional fields', () => {
    const hook = createHook({
      event: 'PostToolUse',
      command: 'notify.sh',
      matcher: 'Write|Edit',
      timeout: 30,
    })
    expect(hook.matcher).toBe('Write|Edit')
    expect(hook.timeout).toBe(30)
  })

  // Positive tests - Cursor events
  it('should create a valid hook with Cursor event', () => {
    const hook = createHook({
      event: 'beforeShellExecution',
      command: 'lint.sh',
    })
    expect(hook.event).toBe('beforeShellExecution')
  })

  // Test all valid Claude Code events
  const claudeCodeEvents = [
    'PreToolUse',
    'PostToolUse',
    'PermissionRequest',
    'UserPromptSubmit',
    'Notification',
    'Stop',
    'SubagentStop',
    'PreCompact',
    'SessionStart',
    'SessionEnd',
  ] as const

  for (const event of claudeCodeEvents) {
    it(`should accept Claude Code event: ${event}`, () => {
      const hook = createHook({ event, command: 'test.sh' })
      expect(hook.event).toBe(event)
    })
  }

  // Test all valid Cursor events
  const cursorEvents = [
    'beforeShellExecution',
    'afterShellExecution',
    'beforeMCPExecution',
    'afterMCPExecution',
    'beforeReadFile',
    'afterFileEdit',
    'beforeSubmitPrompt',
    'stop',
    'afterAgentResponse',
  ] as const

  for (const event of cursorEvents) {
    it(`should accept Cursor event: ${event}`, () => {
      const hook = createHook({ event, command: 'test.sh' })
      expect(hook.event).toBe(event)
    })
  }

  // Negative tests
  it('should throw when event is empty', () => {
    expect(() =>
      createHook({
        event: '' as 'PreToolUse',
        command: 'test.sh',
      })
    ).toThrow('Invalid hook')
  })

  it('should throw when command is empty', () => {
    expect(() =>
      createHook({
        event: 'PreToolUse',
        command: '',
      })
    ).toThrow('Invalid hook: Hooks must have a command field')
  })

  it('should throw for invalid event type', () => {
    expect(() =>
      createHook({
        event: 'InvalidEvent' as 'PreToolUse',
        command: 'test.sh',
      })
    ).toThrow('Invalid hook event type: InvalidEvent')
  })
})

describe('createRule', () => {
  // Positive tests
  it('should create a valid rule with always inclusion', () => {
    const rule = createRule({
      name: 'coding-style',
      content: 'Use consistent style',
      inclusion: { mode: 'always' },
    })
    expect(rule.name).toBe('coding-style')
    expect(rule.content).toBe('Use consistent style')
    expect(rule.inclusion.mode).toBe('always')
  })

  it('should create a rule with fileMatch inclusion', () => {
    const rule = createRule({
      name: 'typescript-rules',
      content: 'TypeScript specific rules',
      inclusion: { mode: 'fileMatch', patterns: ['*.ts', '*.tsx'] },
    })
    expect(rule.inclusion.mode).toBe('fileMatch')
    if (rule.inclusion.mode === 'fileMatch') {
      expect(rule.inclusion.patterns).toEqual(['*.ts', '*.tsx'])
    }
  })

  it('should create a rule with agentRequested inclusion', () => {
    const rule = createRule({
      name: 'testing-rules',
      content: 'Testing guidelines',
      description: 'Rules for writing tests',
      inclusion: { mode: 'agentRequested' },
    })
    expect(rule.inclusion.mode).toBe('agentRequested')
    expect(rule.description).toBe('Rules for writing tests')
  })

  it('should create a rule with manual inclusion', () => {
    const rule = createRule({
      name: 'debug-mode',
      content: 'Debugging instructions',
      inclusion: { mode: 'manual' },
    })
    expect(rule.inclusion.mode).toBe('manual')
  })

  // Negative tests
  it('should throw when name is empty', () => {
    expect(() =>
      createRule({
        name: '',
        content: 'Content',
        inclusion: { mode: 'always' },
      })
    ).toThrow('Invalid rule')
  })

  it('should throw when content is empty', () => {
    expect(() =>
      createRule({
        name: 'test',
        content: '',
        inclusion: { mode: 'always' },
      })
    ).toThrow('Invalid rule: Rules must have content')
  })

  it('should throw when agentRequested rule lacks description', () => {
    expect(() =>
      createRule({
        name: 'test',
        content: 'Content',
        inclusion: { mode: 'agentRequested' },
      })
    ).toThrow('Rules with agentRequested inclusion mode must have a description')
  })
})

describe('createAlwaysRule', () => {
  it('should create an always rule', () => {
    const rule = createAlwaysRule('global', 'Global rules')
    expect(rule.name).toBe('global')
    expect(rule.content).toBe('Global rules')
    expect(rule.inclusion.mode).toBe('always')
  })

  it('should create an always rule with description', () => {
    const rule = createAlwaysRule('global', 'Content', 'Description')
    expect(rule.description).toBe('Description')
  })
})

describe('createFileMatchRule', () => {
  it('should create a fileMatch rule', () => {
    const rule = createFileMatchRule('ts-rules', 'TS content', ['*.ts'])
    expect(rule.name).toBe('ts-rules')
    expect(rule.inclusion.mode).toBe('fileMatch')
    if (rule.inclusion.mode === 'fileMatch') {
      expect(rule.inclusion.patterns).toEqual(['*.ts'])
    }
  })

  it('should create a fileMatch rule with multiple patterns', () => {
    const rule = createFileMatchRule('js-ts', 'Content', ['*.js', '*.ts', '*.tsx'])
    if (rule.inclusion.mode === 'fileMatch') {
      expect(rule.inclusion.patterns).toHaveLength(3)
    }
  })
})

describe('createAgentRequestedRule', () => {
  it('should create an agentRequested rule with required description', () => {
    const rule = createAgentRequestedRule(
      'testing',
      'Testing guidelines',
      'Use when writing tests'
    )
    expect(rule.name).toBe('testing')
    expect(rule.description).toBe('Use when writing tests')
    expect(rule.inclusion.mode).toBe('agentRequested')
  })
})

describe('createManualRule', () => {
  it('should create a manual rule', () => {
    const rule = createManualRule('debug', 'Debug instructions')
    expect(rule.name).toBe('debug')
    expect(rule.inclusion.mode).toBe('manual')
  })

  it('should create a manual rule with description', () => {
    const rule = createManualRule('debug', 'Content', 'For debugging')
    expect(rule.description).toBe('For debugging')
  })
})
