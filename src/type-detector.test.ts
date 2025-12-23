import { describe, it, expect } from 'vitest'
import { detectAbstractionType, analyzeRuleContent, analyzeMetadata } from './type-detector.js'
import { RuleBlock, RuleMetadata } from './types.js'

describe('type-detector', () => {
  describe('detectAbstractionType', () => {
    it('should detect explicit skill type from metadata', () => {
      const rule: RuleBlock = {
        metadata: {
          id: 'skill-1',
          type: 'skill',
          expertise: ['typescript', 'testing']
        },
        content: 'Some basic content here.'
      }

      const result = detectAbstractionType(rule)

      expect(result.type).toBe('skill')
      expect(result.confidence).toBeGreaterThan(0.9)
      expect(result.indicators).toContain('explicit type: skill')
    })

    it('should detect skill from content patterns', () => {
      const rule: RuleBlock = {
        metadata: { id: 'skill-content-1' },
        content: `
          How to write effective tests:
          
          Best practice: Always write both positive and negative test cases.
          
          Example: When testing a function, consider edge cases.
          
          Remember to keep tests focused and descriptive.
          Note that test names should explain what is being tested.
        `
      }

      const result = detectAbstractionType(rule)

      expect(result.type).toBe('skill')
      expect(result.confidence).toBeGreaterThan(0.6)
      expect(result.indicators.some(i => i.includes('how to'))).toBe(true)
      expect(result.indicators.some(i => i.includes('best practice'))).toBe(true)
    })

    it('should detect subagent from delegation patterns', () => {
      const rule: RuleBlock = {
        metadata: { id: 'subagent-1' },
        content: `
          When handling complex refactoring, delegate to a separate context:
          
          Step 1: Analyze the codebase structure
          Step 2: Plan the refactoring approach  
          Step 3: Execute changes in isolated environment
          
          Use claude-3-5-sonnet for this task with independent context.
        `
      }

      const result = detectAbstractionType(rule)

      expect(result.type).toBe('subagent')
      expect(result.confidence).toBeGreaterThan(0.6)
      expect(result.indicators.some(i => i.includes('delegate'))).toBe(true)
      expect(result.indicators.some(i => i.includes('stepPattern'))).toBe(true)
    })

    it('should detect command from slash syntax', () => {
      const rule: RuleBlock = {
        metadata: { id: 'command-1' },
        content: `
          /deploy [environment]
          
          Execute deployment to specified environment.
          Usage: /deploy staging
          
          When user types this command, trigger the deployment pipeline.
        `
      }

      const result = detectAbstractionType(rule)

      expect(result.type).toBe('command')
      expect(result.confidence).toBeGreaterThan(0.7)
      expect(result.indicators.some(i => i.includes('execute'))).toBe(true)
      expect(result.indicators.some(i => i.includes('slashCommand'))).toBe(true)
    })

    it('should detect rule from always-apply patterns', () => {
      const rule: RuleBlock = {
        metadata: { id: 'rule-1', alwaysApply: true },
        content: `
          You are a helpful coding assistant.
          
          Always use TypeScript strict mode.
          Never use any type without justification.
          Consistently apply best practices.
          
          Your role is to provide accurate, type-safe code.
        `
      }

      const result = detectAbstractionType(rule)

      expect(result.type).toBe('rule')
      expect(result.confidence).toBeGreaterThan(0.6)
      expect(result.indicators.some(i => i.includes('always apply'))).toBe(true)
      expect(result.indicators.some(i => i.includes('always'))).toBe(true)
    })

    it('should fallback to rule for ambiguous content', () => {
      const rule: RuleBlock = {
        metadata: { id: 'ambiguous-1' },
        content: 'This is some generic content without clear patterns.'
      }

      const result = detectAbstractionType(rule)

      expect(result.type).toBe('rule')
      expect(result.confidence).toBeGreaterThanOrEqual(0.5) // Minimum confidence for fallback
    })

    it('should handle conflicting signals appropriately', () => {
      const rule: RuleBlock = {
        metadata: { 
          id: 'mixed-1',
          alwaysApply: true,
          manual: true // Conflicting signals
        },
        content: `
          How to handle commands effectively.
          /test command
          Always ensure proper validation.
        `
      }

      const result = detectAbstractionType(rule)

      // Should pick the strongest signal (likely skill due to "How to")
      expect(['skill', 'command', 'rule']).toContain(result.type)
      expect(result.confidence).toBeGreaterThan(0.5)
    })
  })

  describe('analyzeRuleContent', () => {
    it('should identify skill patterns correctly', () => {
      const content = `
        How to write effective TypeScript:
        
        Best practice: Use strict mode
        Example: interface User { name: string }
        
        Remember to validate inputs
        Consider using utility types
      `

      const analysis = analyzeRuleContent(content)

      expect(analysis.skillPatterns).toContain('how to')
      expect(analysis.skillPatterns).toContain('best practice')
      expect(analysis.skillPatterns).toContain('example:')
      expect(analysis.skillPatterns).toContain('remember')
      expect(analysis.skillPatterns).toContain('consider')
      expect(analysis.keywordDensity['how to']).toBe(1)
    })

    it('should identify subagent patterns correctly', () => {
      const content = `
        Delegate to specialized agent:
        
        Step 1: Parse the input
        Step 2: Process data
        Finally: Return results
        
        Use claude-3-haiku for simple tasks
        Isolated context required
      `

      const analysis = analyzeRuleContent(content)

      expect(analysis.subagentPatterns).toContain('delegate to')
      expect(analysis.subagentPatterns).toContain('step 1:')
      expect(analysis.subagentPatterns).toContain('finally')
      expect(analysis.subagentPatterns).toContain('claude-')
      expect(analysis.subagentPatterns).toContain('isolated')
    })

    it('should identify command patterns correctly', () => {
      const content = `
        /build --production
        
        Execute the build process
        When user types this command, run the build
        
        Arguments:
        --production: flag for production build
      `

      const analysis = analyzeRuleContent(content)

      expect(analysis.commandPatterns).toContain('execute')
      expect(analysis.commandPatterns).toContain('when user types')
      expect(analysis.commandPatterns).toContain('argument')
      expect(analysis.commandPatterns).toContain('slash command syntax')
    })

    it('should identify rule patterns correctly', () => {
      const content = `
        You are a TypeScript expert.
        
        Always use strict typing
        Never use any without justification
        Consistently apply formatting rules
        
        Your role is to ensure code quality
      `

      const analysis = analyzeRuleContent(content)

      expect(analysis.rulePatterns).toContain('you are')
      expect(analysis.rulePatterns).toContain('always')
      expect(analysis.rulePatterns).toContain('never')
      expect(analysis.rulePatterns).toContain('consistently')
      expect(analysis.rulePatterns).toContain('your role is')
    })

    it('should identify structural patterns', () => {
      const content = `
        1. First step
        2. Second step
        
        - Bullet point one
        - Bullet point two
        
        \`\`\`typescript
        const example = "code";
        \`\`\`
        
        Example: This shows usage
        Note: Important consideration
      `

      const analysis = analyzeRuleContent(content)

      expect(analysis.structuralFeatures).toContain('numberedList')
      expect(analysis.structuralFeatures).toContain('bulletList')
      expect(analysis.structuralFeatures).toContain('codeBlock')
      expect(analysis.structuralFeatures).toContain('examplePattern')
      expect(analysis.structuralFeatures).toContain('notePattern')
    })

    it('should count keyword density', () => {
      const content = `
        How to use patterns. How to apply them effectively.
        Always do this. Always ensure quality.
      `

      const analysis = analyzeRuleContent(content)

      expect(analysis.keywordDensity['how to']).toBe(2)
      expect(analysis.keywordDensity['always']).toBe(2)
    })
  })

  describe('analyzeMetadata', () => {
    it('should detect explicit type with high confidence', () => {
      const metadata: RuleMetadata = {
        id: 'test-1',
        type: 'skill',
        expertise: ['typescript']
      }

      const analysis = analyzeMetadata(metadata)

      expect(analysis.explicitType).toBe('skill')
      expect(analysis.confidence).toBe(1.0)
      expect(analysis.typeHints).toContain('metadata.type: skill')
    })

    it('should detect slash triggers', () => {
      const metadata: RuleMetadata = {
        id: 'test-1',
        triggers: ['/build', '/test', 'normal-trigger']
      }

      const analysis = analyzeMetadata(metadata)

      expect(analysis.typeHints).toContain('slash trigger in metadata')
      expect(analysis.confidence).toBeGreaterThanOrEqual(0.8)
    })

    it('should detect manual invocation flag', () => {
      const metadata: RuleMetadata = {
        id: 'test-1',
        manual: true
      }

      const analysis = analyzeMetadata(metadata)

      expect(analysis.typeHints).toContain('manual invocation flag')
      expect(analysis.confidence).toBeGreaterThanOrEqual(0.6)
    })

    it('should detect alwaysApply flag', () => {
      const metadata: RuleMetadata = {
        id: 'test-1',
        alwaysApply: true
      }

      const analysis = analyzeMetadata(metadata)

      expect(analysis.typeHints).toContain('always apply flag suggests rule')
      expect(analysis.confidence).toBeGreaterThanOrEqual(0.7)
    })

    it('should detect expertise field', () => {
      const metadata: RuleMetadata = {
        id: 'test-1',
        expertise: ['typescript', 'react']
      }

      const analysis = analyzeMetadata(metadata)

      expect(analysis.typeHints).toContain('expertise field suggests skill')
      expect(analysis.confidence).toBeGreaterThanOrEqual(0.8)
    })

    it('should detect command-related scope', () => {
      const metadata: RuleMetadata = {
        id: 'test-1',
        scope: ['command-handling', 'cli-tools']
      }

      const analysis = analyzeMetadata(metadata)

      expect(analysis.typeHints).toContain('command-related scope')
      expect(analysis.confidence).toBeGreaterThanOrEqual(0.6)
    })

    it('should detect conflicting signals', () => {
      const metadata: RuleMetadata = {
        id: 'test-1',
        alwaysApply: true,
        manual: true
      }

      const analysis = analyzeMetadata(metadata)

      expect(analysis.conflictingSignals).toContain('conflicting alwaysApply and manual flags')
    })

    it('should handle empty metadata gracefully', () => {
      const metadata: RuleMetadata = {
        id: 'test-1'
      }

      const analysis = analyzeMetadata(metadata)

      expect(analysis.typeHints).toHaveLength(0)
      expect(analysis.confidence).toBe(0)
      expect(analysis.conflictingSignals).toHaveLength(0)
    })
  })

  describe('edge cases and combinations', () => {
    it('should handle mixed patterns with reasonable confidence', () => {
      const rule: RuleBlock = {
        metadata: { 
          id: 'mixed-1',
          expertise: ['testing']
        },
        content: `
          How to run automated tests effectively:
          
          Best practice: Use watch mode during development
          Example: Set up continuous testing workflow
          
          Remember to validate test coverage before deploying
          Consider using different test environments
        `
      }

      const result = detectAbstractionType(rule)

      // Should lean towards skill due to "How to" and expertise metadata
      expect(result.type).toBe('skill')
      expect(result.confidence).toBeGreaterThan(0.5)
    })

    it('should handle very short content', () => {
      const rule: RuleBlock = {
        metadata: { id: 'short-1' },
        content: 'Be helpful.'
      }

      const result = detectAbstractionType(rule)

      expect(result.type).toBe('rule') // Should fallback to rule
      expect(result.confidence).toBeGreaterThanOrEqual(0.5)
    })

    it('should handle empty content', () => {
      const rule: RuleBlock = {
        metadata: { id: 'empty-1' },
        content: ''
      }

      const result = detectAbstractionType(rule)

      expect(result.type).toBe('rule') // Should fallback to rule
      expect(result.confidence).toBeGreaterThanOrEqual(0.5)
    })

    it('should prioritize strong signals over weak ones', () => {
      const rule: RuleBlock = {
        metadata: { 
          id: 'strong-signal-1',
          type: 'command'
        },
        content: `
          How to use this pattern effectively.
          Best practice for implementation.
        `
      }

      const result = detectAbstractionType(rule)

      // Explicit metadata type should override content patterns
      expect(result.type).toBe('command')
      expect(result.confidence).toBeGreaterThan(0.9)
    })
  })
})