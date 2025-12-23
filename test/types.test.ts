import { describe, it, expect } from 'vitest'
import type { RuleMetadata, SkillMetadata, SubAgentMetadata, CommandMetadata, AnyAbstractionMetadata, AbstractionTypeInfo } from '../src/types.js'

describe('Type System Extensions', () => {
  it('should allow existing RuleMetadata usage (backward compatibility)', () => {
    const rule: RuleMetadata = {
      id: 'existing-rule',
      alwaysApply: true,
      priority: 'high',
      description: 'An existing rule'
    }
    
    expect(rule.id).toBe('existing-rule')
    expect(rule.alwaysApply).toBe(true)
  })

  it('should allow RuleMetadata with new abstraction fields', () => {
    const rule: RuleMetadata = {
      id: 'enhanced-rule',
      type: 'rule',
      expertise: ['typescript', 'testing'],
      dependencies: ['parser'],
      outputs: ['validated-code']
    }
    
    expect(rule.type).toBe('rule')
    expect(rule.expertise).toEqual(['typescript', 'testing'])
  })

  it('should support SkillMetadata interface', () => {
    const skill: SkillMetadata = {
      id: 'typescript-expert',
      type: 'skill',
      expertise: ['typescript', 'type-checking'],
      portability: 'cross-tool',
      autoInvoke: true,
      examples: ['Fix type errors', 'Add strict mode'],
      description: 'TypeScript expertise skill'
    }
    
    expect(skill.type).toBe('skill')
    expect(skill.expertise).toEqual(['typescript', 'type-checking'])
    expect(skill.portability).toBe('cross-tool')
    expect(skill.autoInvoke).toBe(true)
  })

  it('should support SubAgentMetadata interface', () => {
    const subAgent: SubAgentMetadata = {
      id: 'code-reviewer',
      type: 'subagent',
      model: 'claude-3-5-sonnet',
      tools: ['grep', 'read'],
      isolatedContext: true,
      systemPrompt: 'You are a code reviewer',
      maxTokens: 4000,
      expertise: ['code-quality', 'security']
    }
    
    expect(subAgent.type).toBe('subagent')
    expect(subAgent.isolatedContext).toBe(true)
    expect(subAgent.model).toBe('claude-3-5-sonnet')
    expect(subAgent.tools).toEqual(['grep', 'read'])
  })

  it('should support CommandMetadata interface', () => {
    const command: CommandMetadata = {
      id: 'format-code',
      type: 'command',
      trigger: '/format',
      userInvoked: true,
      arguments: [
        { name: 'file', type: 'file', required: true, description: 'File to format' },
        { name: 'style', type: 'string', required: false, description: 'Format style' }
      ],
      description: 'Format code files'
    }
    
    expect(command.type).toBe('command')
    expect(command.trigger).toBe('/format')
    expect(command.userInvoked).toBe(true)
    expect(command.arguments).toHaveLength(2)
  })

  it('should support AnyAbstractionMetadata union type', () => {
    const abstractions: AnyAbstractionMetadata[] = [
      { id: 'rule-1', alwaysApply: true } as RuleMetadata,
      { id: 'skill-1', type: 'skill', expertise: ['testing'] } as SkillMetadata,
      { id: 'subagent-1', type: 'subagent', isolatedContext: true } as SubAgentMetadata,
      { id: 'command-1', type: 'command', trigger: '/test', userInvoked: true } as CommandMetadata
    ]
    
    expect(abstractions).toHaveLength(4)
    expect(abstractions.every(a => a.id)).toBe(true)
  })

  it('should support AbstractionTypeInfo interface', () => {
    const typeInfo: AbstractionTypeInfo = {
      type: 'skill',
      confidence: 0.95,
      indicators: ['expertise field', 'autoInvoke flag', 'examples array']
    }
    
    expect(typeInfo.type).toBe('skill')
    expect(typeInfo.confidence).toBe(0.95)
    expect(typeInfo.indicators).toContain('expertise field')
  })
})