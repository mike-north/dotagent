/**
 * Validator function tests
 *
 * Tests for validateCommand, validateSkill, validateSubAgent, validateHook, validateRule
 * and utility functions.
 */

import { describe, it, expect } from 'vitest'
import {
  validateCommand,
  validateSkill,
  validateSubAgent,
  validateHook,
  validateRule,
  combineValidationResults,
  formatValidationResult,
  VALIDATION_CODES,
  LIMITS,
} from '../src/validators.js'

describe('validateCommand', () => {
  // Positive tests
  it('should return valid for valid command', () => {
    const result = validateCommand({ name: 'test-command' })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should return valid for command with spaces in name', () => {
    const result = validateCommand({ name: 'my command' })
    expect(result.valid).toBe(true)
  })

  // Negative tests
  it('should return error when name is empty', () => {
    const result = validateCommand({ name: '' })
    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]?.code).toBe(VALIDATION_CODES.COMMAND_MISSING_NAME)
  })

  it('should return error when name is whitespace only', () => {
    const result = validateCommand({ name: '   ' })
    expect(result.valid).toBe(false)
    expect(result.errors[0]?.field).toBe('name')
  })

  it('should return error when name is undefined', () => {
    const result = validateCommand({ name: undefined })
    expect(result.valid).toBe(false)
  })

  it('should return error when name is not a string', () => {
    const result = validateCommand({ name: 123 as unknown as string })
    expect(result.valid).toBe(false)
  })

  it('should return error when input is empty object', () => {
    const result = validateCommand({})
    expect(result.valid).toBe(false)
  })
})

describe('validateSkill', () => {
  // Positive tests
  it('should return valid for valid skill', () => {
    const result = validateSkill({
      name: 'typescript',
      description: 'TypeScript expertise',
    })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  // Negative tests
  it('should return error when name is missing', () => {
    const result = validateSkill({ description: 'Desc' })
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.code === VALIDATION_CODES.SKILL_MISSING_NAME)).toBe(true)
  })

  it('should return error when description is missing', () => {
    const result = validateSkill({ name: 'test' })
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.code === VALIDATION_CODES.SKILL_MISSING_DESCRIPTION)).toBe(true)
  })

  it('should return multiple errors when both name and description are missing', () => {
    const result = validateSkill({})
    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(2)
  })

  it('should return error when name is empty', () => {
    const result = validateSkill({ name: '', description: 'Desc' })
    expect(result.valid).toBe(false)
  })

  it('should return error when description is whitespace only', () => {
    const result = validateSkill({ name: 'test', description: '   ' })
    expect(result.valid).toBe(false)
  })

  it('should return error when description exceeds max length', () => {
    const longDescription = 'a'.repeat(LIMITS.SKILL_DESCRIPTION_MAX + 1)
    const result = validateSkill({ name: 'test', description: longDescription })
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.code === VALIDATION_CODES.SKILL_DESCRIPTION_TOO_LONG)).toBe(true)
    expect(result.errors[0]?.message).toContain(`${LIMITS.SKILL_DESCRIPTION_MAX}`)
  })

  it('should accept description at max length', () => {
    const maxDescription = 'a'.repeat(LIMITS.SKILL_DESCRIPTION_MAX)
    const result = validateSkill({ name: 'test', description: maxDescription })
    expect(result.valid).toBe(true)
  })
})

describe('validateSubAgent', () => {
  // Positive tests
  it('should return valid for valid subagent', () => {
    const result = validateSubAgent({
      name: 'code-reviewer',
      description: 'Reviews code',
    })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  // Negative tests
  it('should return error when name is missing', () => {
    const result = validateSubAgent({ description: 'Desc' })
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.code === VALIDATION_CODES.SUBAGENT_MISSING_NAME)).toBe(true)
  })

  it('should return error when description is missing', () => {
    const result = validateSubAgent({ name: 'test' })
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.code === VALIDATION_CODES.SUBAGENT_MISSING_DESCRIPTION)).toBe(true)
  })

  it('should return multiple errors when both are missing', () => {
    const result = validateSubAgent({})
    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(2)
  })

  it('should return error when name exceeds max length', () => {
    const longName = 'a'.repeat(LIMITS.SUBAGENT_NAME_MAX + 1)
    const result = validateSubAgent({ name: longName, description: 'Description' })
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.code === VALIDATION_CODES.SUBAGENT_NAME_TOO_LONG)).toBe(true)
  })

  it('should accept name at max length', () => {
    const maxName = 'a'.repeat(LIMITS.SUBAGENT_NAME_MAX)
    const result = validateSubAgent({ name: maxName, description: 'Description' })
    expect(result.valid).toBe(true)
  })
})

describe('validateHook', () => {
  // Positive tests - Claude Code events
  it('should return valid for valid hook with Claude Code event', () => {
    const result = validateHook({ event: 'PreToolUse', command: 'echo test' })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  // Positive tests - Cursor events
  it('should return valid for valid hook with Cursor event', () => {
    const result = validateHook({
      event: 'beforeShellExecution',
      command: 'lint.sh',
    })
    expect(result.valid).toBe(true)
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
  ]

  for (const event of claudeCodeEvents) {
    it(`should accept Claude Code event: ${event}`, () => {
      const result = validateHook({ event, command: 'test.sh' })
      expect(result.valid).toBe(true)
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
  ]

  for (const event of cursorEvents) {
    it(`should accept Cursor event: ${event}`, () => {
      const result = validateHook({ event, command: 'test.sh' })
      expect(result.valid).toBe(true)
    })
  }

  // Negative tests
  it('should return error when event is missing', () => {
    const result = validateHook({ command: 'test.sh' })
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.code === VALIDATION_CODES.HOOK_MISSING_EVENT)).toBe(true)
  })

  it('should return error when command is missing', () => {
    const result = validateHook({ event: 'PreToolUse' })
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.code === VALIDATION_CODES.HOOK_MISSING_COMMAND)).toBe(true)
  })

  it('should return error for invalid event type', () => {
    const result = validateHook({ event: 'InvalidEvent', command: 'test.sh' })
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.code === VALIDATION_CODES.HOOK_INVALID_EVENT)).toBe(true)
    expect(result.errors[0]?.message).toContain('InvalidEvent')
  })

  it('should return error when command is empty', () => {
    const result = validateHook({ event: 'PreToolUse', command: '' })
    expect(result.valid).toBe(false)
  })

  it('should return error when command is whitespace only', () => {
    const result = validateHook({ event: 'PreToolUse', command: '   ' })
    expect(result.valid).toBe(false)
  })

  it('should return multiple errors when both event and command are missing', () => {
    const result = validateHook({})
    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(2)
  })
})

describe('validateRule', () => {
  // Positive tests
  it('should return valid for valid rule', () => {
    const result = validateRule({ name: 'coding-style', content: 'Use consistent style' })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  // Negative tests
  it('should return error when name is missing', () => {
    const result = validateRule({ content: 'Content' })
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.code === VALIDATION_CODES.RULE_MISSING_NAME)).toBe(true)
  })

  it('should return error when content is missing', () => {
    const result = validateRule({ name: 'test' })
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.code === VALIDATION_CODES.RULE_MISSING_CONTENT)).toBe(true)
  })

  it('should return error when name is empty', () => {
    const result = validateRule({ name: '', content: 'Content' })
    expect(result.valid).toBe(false)
  })

  it('should return error when content is whitespace only', () => {
    const result = validateRule({ name: 'test', content: '   ' })
    expect(result.valid).toBe(false)
  })

  it('should return multiple errors when both are missing', () => {
    const result = validateRule({})
    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(2)
  })
})

describe('combineValidationResults', () => {
  it('should return valid when all results are valid', () => {
    const results = [
      { valid: true, errors: [], warnings: [] },
      { valid: true, errors: [], warnings: [] },
    ]
    const combined = combineValidationResults(results)
    expect(combined.valid).toBe(true)
    expect(combined.errors).toHaveLength(0)
  })

  it('should return invalid when any result is invalid', () => {
    const results = [
      { valid: true, errors: [], warnings: [] },
      {
        valid: false,
        errors: [{ code: 'TEST', message: 'Test error' }],
        warnings: [],
      },
    ]
    const combined = combineValidationResults(results)
    expect(combined.valid).toBe(false)
    expect(combined.errors).toHaveLength(1)
  })

  it('should combine all errors from multiple results', () => {
    const results = [
      {
        valid: false,
        errors: [{ code: 'ERR1', message: 'Error 1' }],
        warnings: [],
      },
      {
        valid: false,
        errors: [
          { code: 'ERR2', message: 'Error 2' },
          { code: 'ERR3', message: 'Error 3' },
        ],
        warnings: [],
      },
    ]
    const combined = combineValidationResults(results)
    expect(combined.errors).toHaveLength(3)
  })

  it('should combine all warnings from multiple results', () => {
    const results = [
      {
        valid: true,
        errors: [],
        warnings: [{ code: 'WARN1', message: 'Warning 1' }],
      },
      {
        valid: true,
        errors: [],
        warnings: [{ code: 'WARN2', message: 'Warning 2' }],
      },
    ]
    const combined = combineValidationResults(results)
    expect(combined.valid).toBe(true)
    expect(combined.warnings).toHaveLength(2)
  })

  it('should handle empty array', () => {
    const combined = combineValidationResults([])
    expect(combined.valid).toBe(true)
    expect(combined.errors).toHaveLength(0)
  })
})

describe('formatValidationResult', () => {
  it('should format valid result', () => {
    const result = { valid: true, errors: [], warnings: [] }
    const formatted = formatValidationResult(result)
    expect(formatted).toContain('Validation passed')
  })

  it('should format invalid result', () => {
    const result = {
      valid: false,
      errors: [{ code: 'TEST', message: 'Test error' }],
      warnings: [],
    }
    const formatted = formatValidationResult(result)
    expect(formatted).toContain('Validation failed')
    expect(formatted).toContain('Test error')
  })

  it('should include field info in error', () => {
    const result = {
      valid: false,
      errors: [{ code: 'TEST', message: 'Missing field', field: 'name' }],
      warnings: [],
    }
    const formatted = formatValidationResult(result)
    expect(formatted).toContain('(name)')
  })

  it('should format warnings', () => {
    const result = {
      valid: true,
      errors: [],
      warnings: [{ code: 'WARN', message: 'This is a warning' }],
    }
    const formatted = formatValidationResult(result)
    expect(formatted).toContain('Warnings:')
    expect(formatted).toContain('This is a warning')
  })

  it('should include field info in warning', () => {
    const result = {
      valid: true,
      errors: [],
      warnings: [{ code: 'WARN', message: 'Warning', field: 'description' }],
    }
    const formatted = formatValidationResult(result)
    expect(formatted).toContain('(description)')
  })
})
