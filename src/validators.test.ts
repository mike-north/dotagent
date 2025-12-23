import { describe, it, expect } from 'vitest'
import {
  validateSkill,
  validateSubAgent,
  validateCommand,
  validateRule,
  validateAnyAbstraction,
  validateAbstractionGroup,
  combineValidationResults,
  formatValidationResult,
  VALIDATION_CODES
} from './validators.js'
import {
  SkillMetadata,
  SubAgentMetadata,
  CommandMetadata,
  RuleMetadata
} from './types.js'

describe('validators', () => {
  describe('validateSkill', () => {
    describe('positive cases', () => {
      it('should validate a well-formed skill', () => {
        const metadata: SkillMetadata = {
          id: 'typescript-best-practices',
          type: 'skill',
          expertise: ['typescript', 'testing', 'code-quality'],
          portability: 'cross-tool',
          examples: ['interface definitions', 'type guards'],
          description: 'TypeScript best practices and patterns'
        }
        
        const content = `
          How to write effective TypeScript:
          
          Best practice: Always use strict mode for better type safety.
          Example: Define interfaces for complex data structures.
          
          Remember to validate inputs with type guards.
          Consider using utility types for better code reuse.
          
          Technique: Use const assertions for immutable data.
        `

        const result = validateSkill(metadata, content)

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
        expect(result.warnings).toHaveLength(0)
        expect(result.suggestions.length).toBeGreaterThanOrEqual(0) // May have suggestions
      })

      it('should validate minimal valid skill', () => {
        const metadata: SkillMetadata = {
          id: 'basic-skill',
          type: 'skill',
          expertise: ['basic-knowledge']
        }
        
        const content = 'How to do something effectively with best practice techniques.'

        const result = validateSkill(metadata, content)

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })
    })

    describe('negative cases - required fields', () => {
      it('should fail when expertise is missing', () => {
        const metadata = {
          id: 'skill-no-expertise',
          type: 'skill'
        } as SkillMetadata
        
        const content = 'Some skill content'

        const result = validateSkill(metadata, content)

        expect(result.valid).toBe(false)
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            code: VALIDATION_CODES.SKILL_MISSING_EXPERTISE,
            field: 'expertise'
          })
        )
      })

      it('should fail when expertise is empty array', () => {
        const metadata: SkillMetadata = {
          id: 'skill-empty-expertise',
          type: 'skill',
          expertise: []
        }
        
        const content = 'Some skill content'

        const result = validateSkill(metadata, content)

        expect(result.valid).toBe(false)
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            code: VALIDATION_CODES.SKILL_EMPTY_EXPERTISE,
            field: 'expertise'
          })
        )
      })

      it('should fail when expertise is not an array', () => {
        const metadata = {
          id: 'skill-invalid-expertise',
          type: 'skill',
          expertise: 'not-an-array'
        } as any
        
        const content = 'Some skill content'

        const result = validateSkill(metadata, content)

        expect(result.valid).toBe(false)
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            code: VALIDATION_CODES.SKILL_EMPTY_EXPERTISE
          })
        )
      })
    })

    describe('negative cases - field validation', () => {
      it('should fail with invalid portability value', () => {
        const metadata: SkillMetadata = {
          id: 'skill-invalid-portability',
          type: 'skill',
          expertise: ['testing'],
          portability: 'invalid-value' as any
        }
        
        const content = 'How to test effectively'

        const result = validateSkill(metadata, content)

        expect(result.valid).toBe(false)
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            code: VALIDATION_CODES.SKILL_INVALID_PORTABILITY,
            field: 'portability'
          })
        )
      })
    })

    describe('negative cases - anti-patterns', () => {
      it('should fail when using isolation patterns', () => {
        const metadata: SkillMetadata = {
          id: 'skill-with-isolation',
          type: 'skill',
          expertise: ['delegation']
        }
        
        const content = `
          How to delegate to specialized agents:
          
          When dealing with complex tasks, delegate to a separate context.
          Hand off processing to isolated subprocess for better performance.
        `

        const result = validateSkill(metadata, content)

        expect(result.valid).toBe(false)
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            code: VALIDATION_CODES.SKILL_ISOLATION_PATTERN
          })
        )
      })

      it('should fail when using trigger patterns', () => {
        const metadata: SkillMetadata = {
          id: 'skill-with-triggers',
          type: 'skill',
          expertise: ['commands']
        }
        
        const content = `
          How to set up commands:
          
          When user types /build, trigger the build process.
          Command: /test runs the test suite.
        `

        const result = validateSkill(metadata, content)

        expect(result.valid).toBe(false)
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            code: VALIDATION_CODES.SKILL_TRIGGER_PATTERN
          })
        )
      })
    })

    describe('warning cases', () => {
      it('should warn when missing knowledge patterns', () => {
        const metadata: SkillMetadata = {
          id: 'skill-no-patterns',
          type: 'skill',
          expertise: ['general']
        }
        
        const content = 'This is just some general information without clear guidance.'

        const result = validateSkill(metadata, content)

        expect(result.valid).toBe(true) // Warnings don't fail validation
        expect(result.warnings).toContainEqual(
          expect.objectContaining({
            code: VALIDATION_CODES.SKILL_MISSING_KNOWLEDGE
          })
        )
      })
    })

    describe('suggestions', () => {
      it('should suggest categorizing single expertise', () => {
        const metadata: SkillMetadata = {
          id: 'skill-single-expertise',
          type: 'skill',
          expertise: ['programming']
        }
        
        const content = 'How to program effectively with best practices.'

        const result = validateSkill(metadata, content)

        expect(result.suggestions).toContainEqual(
          expect.objectContaining({
            code: 'SKILL_CATEGORIZE_EXPERTISE',
            field: 'expertise',
            actionable: true
          })
        )
      })

      it('should suggest adding examples', () => {
        const metadata: SkillMetadata = {
          id: 'skill-no-examples',
          type: 'skill',
          expertise: ['testing']
        }
        
        const content = 'How to test code effectively.'

        const result = validateSkill(metadata, content)

        expect(result.suggestions).toContainEqual(
          expect.objectContaining({
            code: 'SKILL_ADD_EXAMPLES',
            field: 'examples',
            actionable: true
          })
        )
      })

      it('should suggest specifying portability', () => {
        const metadata: SkillMetadata = {
          id: 'skill-no-portability',
          type: 'skill',
          expertise: ['testing']
        }
        
        const content = 'How to test effectively.'

        const result = validateSkill(metadata, content)

        expect(result.suggestions).toContainEqual(
          expect.objectContaining({
            code: 'SKILL_SPECIFY_PORTABILITY',
            field: 'portability',
            actionable: true
          })
        )
      })
    })

    describe('edge cases', () => {
      it('should handle empty content gracefully', () => {
        const metadata: SkillMetadata = {
          id: 'skill-empty-content',
          type: 'skill',
          expertise: ['general']
        }
        
        const content = ''

        const result = validateSkill(metadata, content)

        expect(result.warnings).toContainEqual(
          expect.objectContaining({
            code: VALIDATION_CODES.SKILL_MISSING_KNOWLEDGE
          })
        )
      })

      it('should handle very long expertise array', () => {
        const metadata: SkillMetadata = {
          id: 'skill-long-expertise',
          type: 'skill',
          expertise: Array.from({ length: 20 }, (_, i) => `skill-${i}`)
        }
        
        const content = 'How to apply these many skills.'

        const result = validateSkill(metadata, content)

        expect(result.valid).toBe(true)
        // Should not suggest categorization for very long arrays
        expect(result.suggestions).not.toContainEqual(
          expect.objectContaining({
            code: 'SKILL_CATEGORIZE_EXPERTISE'
          })
        )
      })
    })
  })

  describe('validateSubAgent', () => {
    describe('positive cases', () => {
      it('should validate a well-formed subagent', () => {
        const metadata: SubAgentMetadata = {
          id: 'code-refactoring-agent',
          type: 'subagent',
          isolatedContext: true,
          model: 'claude-3-5-sonnet',
          tools: ['typescript', 'git'],
          systemPrompt: 'You are a code refactoring specialist.',
          maxTokens: 4000
        }
        
        const content = `
          When handling complex refactoring tasks:
          
          Step 1: Analyze the current codebase structure
          Step 2: Identify patterns and anti-patterns
          Step 3: Plan the refactoring approach
          Finally: Execute changes with proper testing
          
          Delegate complex analysis to this specialized context.
        `

        const result = validateSubAgent(metadata, content)

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('should validate minimal valid subagent', () => {
        const metadata: SubAgentMetadata = {
          id: 'basic-subagent',
          type: 'subagent',
          isolatedContext: true
        }
        
        const content = 'Step 1: Process input. Then handle the task.'

        const result = validateSubAgent(metadata, content)

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })
    })

    describe('negative cases - required fields', () => {
      it('should fail when isolatedContext is missing', () => {
        const metadata = {
          id: 'subagent-no-isolation',
          type: 'subagent'
        } as SubAgentMetadata
        
        const content = 'Some subagent content'

        const result = validateSubAgent(metadata, content)

        expect(result.valid).toBe(false)
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            code: VALIDATION_CODES.SUBAGENT_MISSING_ISOLATION,
            field: 'isolatedContext'
          })
        )
      })

      it('should fail when isolatedContext is false', () => {
        const metadata: SubAgentMetadata = {
          id: 'subagent-false-isolation',
          type: 'subagent',
          isolatedContext: false
        }
        
        const content = 'Some subagent content'

        const result = validateSubAgent(metadata, content)

        expect(result.valid).toBe(false)
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            code: VALIDATION_CODES.SUBAGENT_FALSE_ISOLATION,
            field: 'isolatedContext'
          })
        )
      })
    })

    describe('negative cases - field validation', () => {
      it('should fail with invalid model', () => {
        const metadata: SubAgentMetadata = {
          id: 'subagent-invalid-model',
          type: 'subagent',
          isolatedContext: true,
          model: 'invalid-model' as any
        }
        
        const content = 'Step 1: Process'

        const result = validateSubAgent(metadata, content)

        expect(result.valid).toBe(false)
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            code: VALIDATION_CODES.SUBAGENT_INVALID_MODEL,
            field: 'model'
          })
        )
      })

      it('should warn about unknown tools', () => {
        const metadata: SubAgentMetadata = {
          id: 'subagent-unknown-tools',
          type: 'subagent',
          isolatedContext: true,
          tools: ['typescript', 'unknown-tool', 'another-unknown']
        }
        
        const content = 'Step 1: Use tools'

        const result = validateSubAgent(metadata, content)

        expect(result.valid).toBe(true) // Warnings don't fail validation
        expect(result.warnings).toContainEqual(
          expect.objectContaining({
            code: VALIDATION_CODES.SUBAGENT_INVALID_TOOLS,
            field: 'tools'
          })
        )
      })
    })

    describe('negative cases - anti-patterns', () => {
      it('should fail when using alwaysApply flag', () => {
        const metadata: SubAgentMetadata = {
          id: 'subagent-always-apply',
          type: 'subagent',
          isolatedContext: true,
          alwaysApply: true
        }
        
        const content = 'Step 1: Process'

        const result = validateSubAgent(metadata, content)

        expect(result.valid).toBe(false)
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            code: VALIDATION_CODES.SUBAGENT_RULE_CONFLICT,
            field: 'alwaysApply'
          })
        )
      })
    })

    describe('warning cases', () => {
      it('should warn when missing procedural patterns', () => {
        const metadata: SubAgentMetadata = {
          id: 'subagent-no-patterns',
          type: 'subagent',
          isolatedContext: true
        }
        
        const content = 'This is just general information without clear steps.'

        const result = validateSubAgent(metadata, content)

        expect(result.valid).toBe(true)
        expect(result.warnings).toContainEqual(
          expect.objectContaining({
            code: VALIDATION_CODES.SUBAGENT_MISSING_PROCEDURAL
          })
        )
      })
    })

    describe('suggestions', () => {
      it('should suggest specifying model', () => {
        const metadata: SubAgentMetadata = {
          id: 'subagent-no-model',
          type: 'subagent',
          isolatedContext: true
        }
        
        const content = 'Step 1: Process the task'

        const result = validateSubAgent(metadata, content)

        expect(result.suggestions).toContainEqual(
          expect.objectContaining({
            code: 'SUBAGENT_SPECIFY_MODEL',
            field: 'model',
            actionable: true
          })
        )
      })

      it('should suggest adding system prompt', () => {
        const metadata: SubAgentMetadata = {
          id: 'subagent-no-prompt',
          type: 'subagent',
          isolatedContext: true
        }
        
        const content = 'Step 1: Process'

        const result = validateSubAgent(metadata, content)

        expect(result.suggestions).toContainEqual(
          expect.objectContaining({
            code: 'SUBAGENT_ADD_SYSTEM_PROMPT',
            field: 'systemPrompt',
            actionable: true
          })
        )
      })

      it('should suggest about Haiku usage', () => {
        const metadata: SubAgentMetadata = {
          id: 'subagent-haiku',
          type: 'subagent',
          isolatedContext: true,
          model: 'claude-3-haiku'
        }
        
        const content = 'Step 1: Simple task'

        const result = validateSubAgent(metadata, content)

        expect(result.suggestions).toContainEqual(
          expect.objectContaining({
            code: 'SUBAGENT_HAIKU_USAGE',
            field: 'model',
            actionable: false
          })
        )
      })

      it('should suggest reducing tool scope', () => {
        const metadata: SubAgentMetadata = {
          id: 'subagent-many-tools',
          type: 'subagent',
          isolatedContext: true,
          tools: ['tool1', 'tool2', 'tool3', 'tool4', 'tool5', 'tool6']
        }
        
        const content = 'Step 1: Use tools'

        const result = validateSubAgent(metadata, content)

        expect(result.suggestions).toContainEqual(
          expect.objectContaining({
            code: 'SUBAGENT_TOO_MANY_TOOLS',
            field: 'tools',
            actionable: true
          })
        )
      })
    })
  })

  describe('validateCommand', () => {
    describe('positive cases', () => {
      it('should validate a well-formed command', () => {
        const metadata: CommandMetadata = {
          id: 'deploy-command',
          type: 'command',
          trigger: '/deploy',
          userInvoked: true,
          arguments: [
            {
              name: 'environment',
              type: 'string',
              required: true,
              description: 'Target environment'
            },
            {
              name: 'force',
              type: 'boolean',
              required: false,
              description: 'Force deployment'
            }
          ]
        }
        
        const content = `
          /deploy [environment] [--force]
          
          Execute deployment to specified environment.
          
          Usage: /deploy staging
                 /deploy production --force
          
          When user types this command, trigger the deployment pipeline.
        `

        const result = validateCommand(metadata, content)

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('should validate minimal valid command', () => {
        const metadata: CommandMetadata = {
          id: 'basic-command',
          type: 'command',
          trigger: '/test',
          userInvoked: true
        }
        
        const content = 'Execute test suite when invoked.'

        const result = validateCommand(metadata, content)

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })
    })

    describe('negative cases - required fields', () => {
      it('should fail when trigger is missing', () => {
        const metadata = {
          id: 'command-no-trigger',
          type: 'command',
          userInvoked: true
        } as CommandMetadata
        
        const content = 'Some command content'

        const result = validateCommand(metadata, content)

        expect(result.valid).toBe(false)
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            code: VALIDATION_CODES.COMMAND_MISSING_TRIGGER,
            field: 'trigger'
          })
        )
      })

      it('should fail when trigger does not start with /', () => {
        const metadata: CommandMetadata = {
          id: 'command-invalid-trigger',
          type: 'command',
          trigger: 'deploy',
          userInvoked: true
        }
        
        const content = 'Some command content'

        const result = validateCommand(metadata, content)

        expect(result.valid).toBe(false)
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            code: VALIDATION_CODES.COMMAND_INVALID_TRIGGER,
            field: 'trigger'
          })
        )
      })

      it('should fail when userInvoked is missing', () => {
        const metadata = {
          id: 'command-no-user-invoked',
          type: 'command',
          trigger: '/test'
        } as CommandMetadata
        
        const content = 'Some command content'

        const result = validateCommand(metadata, content)

        expect(result.valid).toBe(false)
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            code: VALIDATION_CODES.COMMAND_MISSING_USER_INVOKED,
            field: 'userInvoked'
          })
        )
      })

      it('should fail when userInvoked is false', () => {
        const metadata: CommandMetadata = {
          id: 'command-false-user-invoked',
          type: 'command',
          trigger: '/test',
          userInvoked: false as any
        }
        
        const content = 'Some command content'

        const result = validateCommand(metadata, content)

        expect(result.valid).toBe(false)
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            code: VALIDATION_CODES.COMMAND_FALSE_USER_INVOKED,
            field: 'userInvoked'
          })
        )
      })
    })

    describe('negative cases - field validation', () => {
      it('should fail with invalid trigger format', () => {
        const metadata: CommandMetadata = {
          id: 'command-bad-trigger',
          type: 'command',
          trigger: '/123invalid',
          userInvoked: true
        }
        
        const content = 'Execute command'

        const result = validateCommand(metadata, content)

        expect(result.valid).toBe(false)
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            code: VALIDATION_CODES.COMMAND_INVALID_TRIGGER,
            field: 'trigger'
          })
        )
      })

      it('should fail with invalid argument structure', () => {
        const metadata: CommandMetadata = {
          id: 'command-invalid-args',
          type: 'command',
          trigger: '/test',
          userInvoked: true,
          arguments: [
            {
              name: '', // Invalid: empty name
              type: 'string',
              required: true
            },
            {
              name: 'valid',
              type: 'invalid-type' as any, // Invalid type
              required: true
            },
            {
              name: 'another',
              type: 'boolean',
              required: 'yes' as any // Invalid: not boolean
            }
          ]
        }
        
        const content = 'Execute command'

        const result = validateCommand(metadata, content)

        expect(result.valid).toBe(false)
        expect(result.errors).toHaveLength(3)
        expect(result.errors.map(e => e.code)).toEqual([
          VALIDATION_CODES.COMMAND_INVALID_ARGUMENTS,
          VALIDATION_CODES.COMMAND_INVALID_ARGUMENTS,
          VALIDATION_CODES.COMMAND_INVALID_ARGUMENTS
        ])
      })
    })

    describe('negative cases - anti-patterns', () => {
      it('should fail when using always-apply patterns in content', () => {
        const metadata: CommandMetadata = {
          id: 'command-always-pattern',
          type: 'command',
          trigger: '/test',
          userInvoked: true
        }
        
        const content = `
          /test command
          
          Always ensure this runs globally.
          Every time the system starts, this should be baseline behavior.
        `

        const result = validateCommand(metadata, content)

        expect(result.valid).toBe(false)
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            code: VALIDATION_CODES.COMMAND_ALWAYS_APPLY_PATTERN
          })
        )
      })

      it('should fail when using alwaysApply in metadata', () => {
        const metadata: CommandMetadata = {
          id: 'command-always-meta',
          type: 'command',
          trigger: '/test',
          userInvoked: true,
          alwaysApply: true
        }
        
        const content = 'Execute test'

        const result = validateCommand(metadata, content)

        expect(result.valid).toBe(false)
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            code: VALIDATION_CODES.COMMAND_ALWAYS_APPLY_PATTERN
          })
        )
      })
    })

    describe('warning cases', () => {
      it('should warn when missing instruction patterns', () => {
        const metadata: CommandMetadata = {
          id: 'command-no-instructions',
          type: 'command',
          trigger: '/test',
          userInvoked: true
        }
        
        const content = 'This is just general information without clear instructions.'

        const result = validateCommand(metadata, content)

        expect(result.valid).toBe(true)
        expect(result.warnings).toContainEqual(
          expect.objectContaining({
            code: VALIDATION_CODES.COMMAND_MISSING_INSTRUCTIONS
          })
        )
      })
    })

    describe('suggestions', () => {
      it('should suggest adding arguments', () => {
        const metadata: CommandMetadata = {
          id: 'command-no-args',
          type: 'command',
          trigger: '/deploy',
          userInvoked: true
        }
        
        const content = 'Execute deployment'

        const result = validateCommand(metadata, content)

        expect(result.suggestions).toContainEqual(
          expect.objectContaining({
            code: 'COMMAND_ADD_ARGUMENTS',
            field: 'arguments',
            actionable: true
          })
        )
      })

      it('should suggest adding usage examples', () => {
        const metadata: CommandMetadata = {
          id: 'command-no-usage',
          type: 'command',
          trigger: '/build',
          userInvoked: true
        }
        
        const content = 'Execute build process'

        const result = validateCommand(metadata, content)

        expect(result.suggestions).toContainEqual(
          expect.objectContaining({
            code: 'COMMAND_ADD_USAGE_EXAMPLE',
            actionable: true
          })
        )
      })

      it('should suggest documenting optional arguments', () => {
        const metadata: CommandMetadata = {
          id: 'command-optional-args',
          type: 'command',
          trigger: '/deploy',
          userInvoked: true,
          arguments: [
            {
              name: 'environment',
              type: 'string',
              required: true
            },
            {
              name: 'force',
              type: 'boolean',
              required: false
            }
          ]
        }
        
        const content = 'Execute deployment to environment'

        const result = validateCommand(metadata, content)

        expect(result.suggestions).toContainEqual(
          expect.objectContaining({
            code: 'COMMAND_DOCUMENT_OPTIONAL_ARGS',
            actionable: true
          })
        )
      })
    })
  })

  describe('validateRule', () => {
    describe('positive cases', () => {
      it('should validate a well-formed rule', () => {
        const metadata: RuleMetadata = {
          id: 'typescript-coding-standards',
          type: 'rule',
          alwaysApply: true,
          scope: ['typescript', 'development'],
          priority: 'high',
          description: 'TypeScript coding standards and guidelines'
        }
        
        const content = `
          You are a TypeScript expert focused on code quality.
          
          Always use strict mode and proper typing.
          Never use 'any' type without justification.
          Consistently apply formatting rules.
          
          Your role is to ensure type-safe, maintainable code.
          Must validate all inputs and handle errors gracefully.
        `

        const result = validateRule(metadata, content)

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('should validate minimal rule for backward compatibility', () => {
        const metadata: RuleMetadata = {
          id: 'basic-rule'
        }
        
        const content = 'Be helpful and accurate.'

        const result = validateRule(metadata, content)

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })
    })

    describe('negative cases', () => {
      it('should fail with invalid scope', () => {
        const metadata: RuleMetadata = {
          id: 'rule-invalid-scope',
          scope: ['valid-scope', '', 'another-valid'] as any
        }
        
        const content = 'Some rule content'

        const result = validateRule(metadata, content)

        expect(result.valid).toBe(false)
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            code: VALIDATION_CODES.RULE_INVALID_SCOPE,
            field: 'scope'
          })
        )
      })

      it('should fail with empty content', () => {
        const metadata: RuleMetadata = {
          id: 'rule-empty-content'
        }
        
        const content = ''

        const result = validateRule(metadata, content)

        expect(result.valid).toBe(false)
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            code: VALIDATION_CODES.RULE_MISSING_CONTENT
          })
        )
      })

      it('should fail with whitespace-only content', () => {
        const metadata: RuleMetadata = {
          id: 'rule-whitespace-content'
        }
        
        const content = '   \n\t  \n   '

        const result = validateRule(metadata, content)

        expect(result.valid).toBe(false)
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            code: VALIDATION_CODES.RULE_MISSING_CONTENT
          })
        )
      })
    })

    describe('suggestions for improvement', () => {
      it('should suggest adding guidelines when missing rule patterns', () => {
        const metadata: RuleMetadata = {
          id: 'rule-no-patterns'
        }
        
        const content = 'This is just general text without clear guidance patterns.'

        const result = validateRule(metadata, content)

        expect(result.valid).toBe(true)
        expect(result.suggestions).toContainEqual(
          expect.objectContaining({
            code: 'RULE_ADD_GUIDELINES',
            actionable: true
          })
        )
      })

      it('should suggest adding priority', () => {
        const metadata: RuleMetadata = {
          id: 'rule-no-priority'
        }
        
        const content = 'Always be helpful'

        const result = validateRule(metadata, content)

        expect(result.suggestions).toContainEqual(
          expect.objectContaining({
            code: 'RULE_ADD_PRIORITY',
            field: 'priority',
            actionable: true
          })
        )
      })

      it('should suggest adding description', () => {
        const metadata: RuleMetadata = {
          id: 'rule-no-description'
        }
        
        const content = 'Always follow best practices'

        const result = validateRule(metadata, content)

        expect(result.suggestions).toContainEqual(
          expect.objectContaining({
            code: 'RULE_ADD_DESCRIPTION',
            field: 'description',
            actionable: true
          })
        )
      })

      it('should suggest specifying alwaysApply', () => {
        const metadata: RuleMetadata = {
          id: 'rule-no-always-apply'
        }
        
        const content = 'Follow coding standards'

        const result = validateRule(metadata, content)

        expect(result.suggestions).toContainEqual(
          expect.objectContaining({
            code: 'RULE_SPECIFY_ALWAYS_APPLY',
            field: 'alwaysApply',
            actionable: true
          })
        )
      })
    })
  })

  describe('validateAnyAbstraction', () => {
    it('should route to skill validator', () => {
      const metadata: SkillMetadata = {
        id: 'test-skill',
        type: 'skill',
        expertise: ['testing']
      }
      
      const content = 'How to test effectively'

      const result = validateAnyAbstraction(metadata, content)

      expect(result.valid).toBe(true)
      // Should suggest adding examples (skill-specific suggestion)
      expect(result.suggestions.some(s => s.code === 'SKILL_ADD_EXAMPLES')).toBe(true)
    })

    it('should route to subagent validator', () => {
      const metadata: SubAgentMetadata = {
        id: 'test-subagent',
        type: 'subagent',
        isolatedContext: true
      }
      
      const content = 'Step 1: Process task'

      const result = validateAnyAbstraction(metadata, content)

      expect(result.valid).toBe(true)
      // Should suggest specifying model (subagent-specific suggestion)
      expect(result.suggestions.some(s => s.code === 'SUBAGENT_SPECIFY_MODEL')).toBe(true)
    })

    it('should route to command validator', () => {
      const metadata: CommandMetadata = {
        id: 'test-command',
        type: 'command',
        trigger: '/test',
        userInvoked: true
      }
      
      const content = 'Execute test suite'

      const result = validateAnyAbstraction(metadata, content)

      expect(result.valid).toBe(true)
      // Should suggest adding arguments (command-specific suggestion)
      expect(result.suggestions.some(s => s.code === 'COMMAND_ADD_ARGUMENTS')).toBe(true)
    })

    it('should route to rule validator', () => {
      const metadata: RuleMetadata = {
        id: 'test-rule'
      }
      
      const content = 'Always be helpful'

      const result = validateAnyAbstraction(metadata, content)

      expect(result.valid).toBe(true)
      // Should suggest adding priority (rule-specific suggestion)
      expect(result.suggestions.some(s => s.code === 'RULE_ADD_PRIORITY')).toBe(true)
    })

    it('should detect type mismatch and warn', () => {
      const metadata: SkillMetadata = {
        id: 'mismatched',
        type: 'skill',
        expertise: ['commands']
      }
      
      // Content clearly suggests a command, not a skill
      const content = `
        /deploy environment
        
        Execute deployment when user types this command.
        Usage: /deploy staging
      `

      const result = validateAnyAbstraction(metadata, content)

      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          code: VALIDATION_CODES.ABSTRACTION_TYPE_MISMATCH,
          field: 'type'
        })
      )
    })

    it('should handle missing metadata', () => {
      const result = validateAnyAbstraction(null as any, 'content')

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: VALIDATION_CODES.MISSING_REQUIRED_FIELD
        })
      )
    })

    it('should handle missing content', () => {
      const metadata: RuleMetadata = { id: 'test' }
      const result = validateAnyAbstraction(metadata, null as any)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: VALIDATION_CODES.MISSING_REQUIRED_FIELD
        })
      )
    })

    it('should handle unknown type', () => {
      const metadata = {
        id: 'unknown',
        type: 'unknown-type'
      } as any

      const result = validateAnyAbstraction(metadata, 'content')

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: VALIDATION_CODES.UNKNOWN_TYPE,
          field: 'type'
        })
      )
    })

    it('should use type detection when no explicit type', () => {
      const metadata: RuleMetadata = {
        id: 'inferred-skill',
        expertise: ['testing']
      }
      
      const content = 'How to write effective tests with best practices and examples.'

      const result = validateAnyAbstraction(metadata, content)

      expect(result.valid).toBe(true)
      // Should route to skill validator based on content detection
      expect(result.suggestions.some(s => s.code === 'SKILL_ADD_EXAMPLES')).toBe(true)
    })
  })

  describe('validateAbstractionGroup', () => {
    it('should validate a group without conflicts', () => {
      const abstractions = [
        {
          metadata: {
            id: 'skill-1',
            type: 'skill',
            expertise: ['typescript']
          } as SkillMetadata,
          content: 'How to use TypeScript effectively'
        },
        {
          metadata: {
            id: 'command-1',
            type: 'command',
            trigger: '/build',
            userInvoked: true
          } as CommandMetadata,
          content: 'Execute build process'
        }
      ]

      const result = validateAbstractionGroup(abstractions)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect command trigger conflicts', () => {
      const abstractions = [
        {
          metadata: {
            id: 'command-1',
            type: 'command',
            trigger: '/build',
            userInvoked: true
          } as CommandMetadata,
          content: 'Execute build process'
        },
        {
          metadata: {
            id: 'command-2',
            type: 'command',
            trigger: '/build',
            userInvoked: true
          } as CommandMetadata,
          content: 'Another build command'
        }
      ]

      const result = validateAbstractionGroup(abstractions)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: VALIDATION_CODES.COMMAND_TRIGGER_CONFLICT,
          field: 'trigger'
        })
      )
    })

    it('should detect circular dependencies', () => {
      const abstractions = [
        {
          metadata: {
            id: 'skill-1',
            type: 'skill',
            expertise: ['testing'],
            dependencies: ['skill-2']
          } as SkillMetadata,
          content: 'Skill 1'
        },
        {
          metadata: {
            id: 'skill-2',
            type: 'skill',
            expertise: ['building'],
            dependencies: ['skill-1']
          } as SkillMetadata,
          content: 'Skill 2'
        }
      ]

      const result = validateAbstractionGroup(abstractions)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: VALIDATION_CODES.CIRCULAR_DEPENDENCY,
          field: 'dependencies'
        })
      )
    })

    it('should detect invalid dependency references', () => {
      const abstractions = [
        {
          metadata: {
            id: 'skill-1',
            type: 'skill',
            expertise: ['testing'],
            dependencies: ['non-existent-skill', 'another-missing']
          } as SkillMetadata,
          content: 'Skill 1'
        }
      ]

      const result = validateAbstractionGroup(abstractions)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: VALIDATION_CODES.INVALID_DEPENDENCY,
          field: 'dependencies'
        })
      )
    })

    it('should warn about scope conflicts in always-apply rules', () => {
      const abstractions = [
        {
          metadata: {
            id: 'rule-1',
            type: 'rule',
            alwaysApply: true,
            scope: ['typescript']
          } as RuleMetadata,
          content: 'TypeScript rule 1'
        },
        {
          metadata: {
            id: 'rule-2',
            type: 'rule',
            alwaysApply: true,
            scope: ['typescript']
          } as RuleMetadata,
          content: 'TypeScript rule 2'
        }
      ]

      const result = validateAbstractionGroup(abstractions)

      expect(result.valid).toBe(true) // Warnings don't fail
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          code: VALIDATION_CODES.RULE_SCOPE_CONFLICT,
          field: 'scope'
        })
      )
    })

    it('should handle complex dependency chains', () => {
      const abstractions = [
        {
          metadata: {
            id: 'skill-1',
            dependencies: ['skill-2']
          } as RuleMetadata,
          content: 'Skill 1'
        },
        {
          metadata: {
            id: 'skill-2',
            dependencies: ['skill-3']
          } as RuleMetadata,
          content: 'Skill 2'
        },
        {
          metadata: {
            id: 'skill-3'
          } as RuleMetadata,
          content: 'Skill 3'
        }
      ]

      const result = validateAbstractionGroup(abstractions)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('utility functions', () => {
    describe('combineValidationResults', () => {
      it('should combine multiple valid results', () => {
        const results = [
          { valid: true, errors: [], warnings: [], suggestions: [{ code: 'SUGG1', message: 'Suggestion 1', actionable: true }] },
          { valid: true, errors: [], warnings: [{ code: 'WARN1', message: 'Warning 1', severity: 'warning' as const }], suggestions: [] }
        ]

        const combined = combineValidationResults(results)

        expect(combined.valid).toBe(true)
        expect(combined.errors).toHaveLength(0)
        expect(combined.warnings).toHaveLength(1)
        expect(combined.suggestions).toHaveLength(1)
      })

      it('should combine with failures', () => {
        const results = [
          { valid: true, errors: [], warnings: [], suggestions: [] },
          { valid: false, errors: [{ code: 'ERR1', message: 'Error 1', severity: 'error' as const }], warnings: [], suggestions: [] }
        ]

        const combined = combineValidationResults(results)

        expect(combined.valid).toBe(false)
        expect(combined.errors).toHaveLength(1)
      })

      it('should handle empty results array', () => {
        const combined = combineValidationResults([])

        expect(combined.valid).toBe(true)
        expect(combined.errors).toHaveLength(0)
        expect(combined.warnings).toHaveLength(0)
        expect(combined.suggestions).toHaveLength(0)
      })
    })

    describe('formatValidationResult', () => {
      it('should format valid result', () => {
        const result = {
          valid: true,
          errors: [],
          warnings: [],
          suggestions: []
        }

        const formatted = formatValidationResult(result)

        expect(formatted).toContain('✓ Validation passed')
      })

      it('should format result with errors, warnings, and suggestions', () => {
        const result = {
          valid: false,
          errors: [
            { code: 'ERR1', message: 'Error message', field: 'field1', severity: 'error' as const }
          ],
          warnings: [
            { code: 'WARN1', message: 'Warning message', severity: 'warning' as const }
          ],
          suggestions: [
            { code: 'SUGG1', message: 'Suggestion message', field: 'field2', actionable: true }
          ]
        }

        const formatted = formatValidationResult(result)

        expect(formatted).toContain('✗ Validation failed')
        expect(formatted).toContain('Errors:')
        expect(formatted).toContain('Error message (field1)')
        expect(formatted).toContain('Warnings:')
        expect(formatted).toContain('Warning message')
        expect(formatted).toContain('Suggestions:')
        expect(formatted).toContain('Suggestion message (field2) [actionable]')
      })

      it('should handle items without fields', () => {
        const result = {
          valid: false,
          errors: [
            { code: 'ERR1', message: 'Error without field', severity: 'error' as const }
          ],
          warnings: [],
          suggestions: [
            { code: 'SUGG1', message: 'Non-actionable suggestion', actionable: false }
          ]
        }

        const formatted = formatValidationResult(result)

        expect(formatted).toContain('Error without field')
        expect(formatted).not.toContain('[actionable]')
        expect(formatted).not.toContain('(undefined)')
      })
    })
  })

  describe('validation codes', () => {
    it('should have all expected validation codes defined', () => {
      // Test that all codes are defined as constants
      expect(VALIDATION_CODES.SKILL_MISSING_EXPERTISE).toBeDefined()
      expect(VALIDATION_CODES.SUBAGENT_MISSING_ISOLATION).toBeDefined()
      expect(VALIDATION_CODES.COMMAND_MISSING_TRIGGER).toBeDefined()
      expect(VALIDATION_CODES.RULE_INVALID_SCOPE).toBeDefined()
      expect(VALIDATION_CODES.ABSTRACTION_TYPE_MISMATCH).toBeDefined()
      expect(VALIDATION_CODES.CIRCULAR_DEPENDENCY).toBeDefined()
    })

    it('should use validation codes in error objects', () => {
      const metadata = {
        id: 'test',
        type: 'skill'
        // Missing expertise
      } as SkillMetadata

      const result = validateSkill(metadata, 'content')

      expect(result.errors[0].code).toBe(VALIDATION_CODES.SKILL_MISSING_EXPERTISE)
    })
  })
})