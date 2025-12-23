/**
 * Tests for ConfigAnalyzer comprehensive analysis functionality
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ConfigAnalyzer } from '../analyzer.js'
import type { 
  ProjectConfig, 
  ConfigFile,
  AnalysisResult,
  HealthScore,
  ComplexityScore,
  CapabilityAnalysis,
  PatternDetection,
  RelationshipMap,
  ContentAnalysis,
  AbstractionMap
} from '../types.js'
import type { RuleBlock, AbstractionType } from '../../types.js'

describe('ConfigAnalyzer', () => {
  let analyzer: ConfigAnalyzer
  let mockProjectConfig: ProjectConfig
  let mockConfigFile: ConfigFile
  let mockRuleBlock: RuleBlock

  beforeEach(() => {
    analyzer = new ConfigAnalyzer()
    
    mockConfigFile = {
      filePath: '/test/skill.agent',
      metadata: {
        id: 'test-skill',
        type: 'skill',
        description: 'Test skill for automation',
        version: '1.0.0'
      },
      content: 'You are a test automation expert. Automate tasks efficiently.',
      originalFormat: 'agent',
      type: 'skill',
      ruleCount: 1
    }
    
    mockRuleBlock = {
      metadata: mockConfigFile.metadata,
      content: mockConfigFile.content
    }
    
    mockProjectConfig = {
      path: '/test/project',
      rules: [],
      skills: [mockConfigFile],
      subagents: [],
      commands: [],
      metadata: {
        name: 'test-project',
        version: '1.0.0',
        totalFiles: 1,
        detectedTypes: { rule: 0, skill: 1, subagent: 0, command: 0 },
        issues: [],
        lastAnalyzed: new Date()
      }
    }
  })

  describe('Project Analysis', () => {
    it('should analyze project comprehensively', () => {
      const result = analyzer.analyzeProject(mockProjectConfig)
      
      expect(result).toHaveProperty('summary')
      expect(result).toHaveProperty('files')
      expect(result).toHaveProperty('recommendations')
      expect(result).toHaveProperty('typeDistribution')
      
      expect(result.summary.totalFiles).toBe(1)
      expect(result.summary.totalSkills).toBe(1)
      expect(result.summary.totalRules).toBe(0)
      expect(result.summary.totalSubagents).toBe(0)
      expect(result.summary.totalCommands).toBe(0)
    })

    it('should calculate project health score', () => {
      const result = analyzer.analyzeProject(mockProjectConfig)
      
      expect(result.summary.healthScore).toBeGreaterThan(0)
      expect(result.summary.healthScore).toBeLessThanOrEqual(100)
    })

    it('should generate type distribution', () => {
      const result = analyzer.analyzeProject(mockProjectConfig)
      
      expect(result.typeDistribution).toHaveProperty('skills', 1)
      expect(result.typeDistribution).toHaveProperty('rules', 0)
      expect(result.typeDistribution).toHaveProperty('subagents', 0)
      expect(result.typeDistribution).toHaveProperty('commands', 0)
    })

    it('should handle empty projects', () => {
      const emptyProject: ProjectConfig = {
        path: '/empty/project',
        rules: [],
        skills: [],
        subagents: [],
        commands: [],
        metadata: {
          name: 'empty',
          version: '1.0.0',
          totalFiles: 0,
          detectedTypes: { rule: 0, skill: 0, subagent: 0, command: 0 },
          issues: [],
          lastAnalyzed: new Date()
        }
      }
      
      const result = analyzer.analyzeProject(emptyProject)
      
      expect(result.summary.totalFiles).toBe(0)
      expect(result.summary.healthScore).toBeGreaterThan(0) // Should still have some base score
    })

    it('should detect abstraction mismatches', () => {
      const mismatchedFile: ConfigFile = {
        ...mockConfigFile,
        metadata: { ...mockConfigFile.metadata, type: 'rule' }, // Declared as rule
        content: 'You are an expert. Provide guidance.' // But contains skill-like content
      }
      
      const projectWithMismatch: ProjectConfig = {
        ...mockProjectConfig,
        rules: [mismatchedFile],
        skills: []
      }
      
      const result = analyzer.analyzeProject(projectWithMismatch)
      const fileAnalysis = result.files.find(f => f.filePath === mismatchedFile.filePath)
      
      expect(fileAnalysis).toBeDefined()
      // The analyzer should detect the mismatch between declared and actual type
    })
  })

  describe('File Analysis', () => {
    it('should analyze individual files', () => {
      const result = analyzer.analyzeFile(mockConfigFile)
      
      expect(result).toHaveProperty('filePath', '/test/skill.agent')
      expect(result).toHaveProperty('detectedType')
      expect(result).toHaveProperty('confidence')
      expect(result).toHaveProperty('issues')
      expect(result).toHaveProperty('warnings')
      expect(result).toHaveProperty('suggestions')
      expect(result).toHaveProperty('originalFormat', 'agent')
      expect(result).toHaveProperty('ruleCount')
    })

    it('should detect abstraction type with confidence', () => {
      const result = analyzer.analyzeFile(mockConfigFile)
      
      expect(result.detectedType).toBe('skill')
      expect(result.confidence).toBeGreaterThan(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })

    it('should validate file content', () => {
      const invalidFile: ConfigFile = {
        ...mockConfigFile,
        metadata: {
          id: 'test',
          type: 'rule' as const,
          alwaysApply: true
        } as any, // Invalid metadata for test
        content: '' // Empty content
      }
      
      const result = analyzer.analyzeFile(invalidFile)
      
      expect(result.issues.length).toBeGreaterThan(0)
    })

    it('should count rules in content', () => {
      const multiRuleFile: ConfigFile = {
        ...mockConfigFile,
        content: `
You are a test expert.

Rule 1: Always validate input
Rule 2: Provide clear feedback
Rule 3: Document your work
        `
      }
      
      const result = analyzer.analyzeFile(multiRuleFile)
      
      expect(result.ruleCount).toBeGreaterThan(1)
    })
  })

  describe('Abstraction Detection', () => {
    it('should detect abstractions and create map', () => {
      const ruleBlocks = [mockRuleBlock]
      const result = analyzer.detectAbstractions(ruleBlocks)
      
      expect(result).toHaveProperty('abstractions')
      expect(result).toHaveProperty('relationships')
      expect(result).toHaveProperty('clusters')
      expect(result).toHaveProperty('metrics')
      
      expect(result.abstractions).toHaveLength(1)
      expect(result.abstractions[0]).toMatchObject({
        id: 'test-skill',
        type: 'skill',
        name: expect.any(String),
        purpose: expect.any(String),
        capabilities: expect.any(Array),
        complexity: expect.any(Number),
        health: expect.any(Number),
        position: expect.objectContaining({
          x: expect.any(Number),
          y: expect.any(Number)
        })
      })
    })

    it('should calculate abstraction metrics', () => {
      const ruleBlocks = [mockRuleBlock]
      const result = analyzer.detectAbstractions(ruleBlocks)
      
      expect(result.metrics).toMatchObject({
        totalAbstractions: 1,
        typeDistribution: expect.objectContaining({
          skill: 1,
          rule: 0,
          subagent: 0,
          command: 0
        }),
        complexityDistribution: expect.any(Object),
        healthDistribution: expect.any(Object),
        relationshipDensity: expect.any(Number)
      })
    })

    it('should create clusters based on type', () => {
      const skillBlock1: RuleBlock = {
        metadata: { id: 'skill-1', type: 'skill' },
        content: 'Skill 1 content'
      }
      
      const skillBlock2: RuleBlock = {
        metadata: { id: 'skill-2', type: 'skill' },
        content: 'Skill 2 content'
      }
      
      const ruleBlocks = [skillBlock1, skillBlock2]
      const result = analyzer.detectAbstractions(ruleBlocks)
      
      expect(result.clusters).toHaveLength(1)
      expect(result.clusters[0]).toMatchObject({
        id: 'skill-cluster',
        name: 'Skill Cluster',
        members: ['skill-1', 'skill-2'],
        cohesion: expect.any(Number),
        purpose: 'Groups all skill abstractions'
      })
    })

    it('should handle dependencies in relationships', () => {
      const dependentBlock: RuleBlock = {
        metadata: { 
          id: 'dependent-skill',
          type: 'skill',
          dependencies: ['test-skill']
        },
        content: 'This skill depends on test-skill'
      }
      
      const ruleBlocks = [mockRuleBlock, dependentBlock]
      const result = analyzer.detectAbstractions(ruleBlocks)
      
      expect(result.relationships).toHaveLength(1)
      expect(result.relationships[0]).toMatchObject({
        from: 'dependent-skill',
        to: 'test-skill',
        type: 'requires',
        strength: 0.8,
        nature: 'functional'
      })
    })
  })

  describe('Capability Analysis', () => {
    it('should analyze file capabilities', () => {
      const result = analyzer.analyzeCapabilities(mockConfigFile)
      
      expect(result).toHaveProperty('primary')
      expect(result).toHaveProperty('secondary')
      expect(result).toHaveProperty('emergent')
      expect(result).toHaveProperty('missing')
      expect(result).toHaveProperty('coverage')
      
      expect(result.coverage).toHaveProperty('automation')
      expect(result.coverage).toHaveProperty('guidance')
      expect(result.coverage).toHaveProperty('validation')
    })

    it('should identify automation capabilities', () => {
      const automationFile: ConfigFile = {
        ...mockConfigFile,
        content: 'Automate testing processes. Use automated tools to validate code.'
      }
      
      const result = analyzer.analyzeCapabilities(automationFile)
      
      const automationCaps = [
        ...result.primary,
        ...result.secondary,
        ...result.emergent
      ].filter(cap => cap.category === 'automation')
      
      expect(automationCaps.length).toBeGreaterThan(0)
      expect(result.coverage.automation).toBeGreaterThan(0)
    })

    it('should identify missing capabilities for skills', () => {
      const skillWithoutGuidance: ConfigFile = {
        ...mockConfigFile,
        content: 'Just execute tasks.'
      }
      
      const result = analyzer.analyzeCapabilities(skillWithoutGuidance)
      
      expect(result.missing).toContain('guidance - skills should provide guidance')
    })

    it('should calculate capability coverage correctly', () => {
      const comprehensiveFile: ConfigFile = {
        ...mockConfigFile,
        content: `
You are an expert that can:
- Automate repetitive tasks
- Guide users through complex processes  
- Validate input and output
- Transform data formats
- Coordinate multiple systems
- Optimize performance
- Monitor system health
- Document procedures
- Secure sensitive data
- Integrate different tools
        `
      }
      
      const result = analyzer.analyzeCapabilities(comprehensiveFile)
      
      // Should have high coverage across multiple categories
      const coverageValues = Object.values(result.coverage)
      const highCoverageCount = coverageValues.filter(v => v > 0.5).length
      
      expect(highCoverageCount).toBeGreaterThan(3)
    })
  })

  describe('Pattern Detection', () => {
    it('should detect content patterns', () => {
      const result = analyzer.detectPatterns(mockConfigFile.content)
      
      expect(result).toHaveProperty('recognized')
      expect(result).toHaveProperty('antiPatterns')
      expect(result).toHaveProperty('bestPractices')
      expect(result).toHaveProperty('innovations')
      expect(result).toHaveProperty('templateMatches')
    })

    it('should recognize skill expertise patterns', () => {
      const expertiseContent = 'You are a testing expert. Your expertise includes automated testing.'
      const result = analyzer.detectPatterns(expertiseContent)
      
      const expertisePattern = result.recognized.find(p => p.name.includes('Expertise'))
      expect(expertisePattern).toBeDefined()
    })

    it('should detect anti-patterns', () => {
      const antiPatternContent = 'You are a skill that always applies delegation to other agents.'
      const result = analyzer.detectPatterns(antiPatternContent)
      
      // Should detect skill delegation anti-pattern
      expect(result.antiPatterns.length).toBeGreaterThan(0)
    })

    it('should assess best practices', () => {
      const wellStructuredContent = `
# Description
You are a well-documented skill for testing.

## Purpose
Validate code quality and functionality.

## Usage
1. Run automated tests
2. Review results
3. Generate reports
      `
      
      const result = analyzer.detectPatterns(wellStructuredContent)
      
      expect(result.bestPractices.length).toBeGreaterThan(0)
      const practiceAdherence = result.bestPractices.reduce((sum, p) => sum + p.adherence, 0)
      expect(practiceAdherence).toBeGreaterThan(0)
    })
  })

  describe('Complexity Scoring', () => {
    it('should calculate complexity score', () => {
      const result = analyzer.scoreComplexity(mockConfigFile)
      
      expect(result).toHaveProperty('overall')
      expect(result).toHaveProperty('cognitive')
      expect(result).toHaveProperty('structural')
      expect(result).toHaveProperty('dependencies')
      expect(result).toHaveProperty('factors')
      expect(result).toHaveProperty('breakdown')
      
      expect(['low', 'medium', 'high', 'very-high']).toContain(result.overall)
    })

    it('should calculate cognitive complexity', () => {
      const complexContent = `
If user requests testing, then:
  When automated tests are available:
    While tests are running:
      For each test case:
        If test passes:
          Continue to next
        Unless test fails:
          Generate error report
      `
      
      const complexFile: ConfigFile = {
        ...mockConfigFile,
        content: complexContent
      }
      
      const result = analyzer.scoreComplexity(complexFile)
      
      expect(result.cognitive).toBeGreaterThan(1) // Should detect conditionals
    })

    it('should calculate structural complexity', () => {
      const longContent = 'This is a very long configuration content. '.repeat(100)
      
      const longFile: ConfigFile = {
        ...mockConfigFile,
        content: longContent
      }
      
      const result = analyzer.scoreComplexity(longFile)
      
      expect(result.structural).toBeGreaterThan(1) // Should detect length
    })

    it('should calculate dependency complexity', () => {
      const dependentFile: ConfigFile = {
        ...mockConfigFile,
        metadata: {
          ...mockConfigFile.metadata,
          dependencies: ['skill-1', 'skill-2', 'rule-1']
        }
      }
      
      const result = analyzer.scoreComplexity(dependentFile)
      
      expect(result.dependencies).toBeGreaterThan(0) // Should detect dependencies
    })

    it('should provide complexity breakdown', () => {
      const result = analyzer.scoreComplexity(mockConfigFile)
      
      expect(result.breakdown).toHaveProperty('cognitive')
      expect(result.breakdown).toHaveProperty('structural')
      expect(result.breakdown).toHaveProperty('dependencies')
      
      expect(result.breakdown.cognitive).toHaveProperty('score')
      expect(result.breakdown.cognitive).toHaveProperty('contributors')
      
      expect(Array.isArray(result.breakdown.cognitive.contributors)).toBe(true)
    })
  })

  describe('Content Analysis', () => {
    it('should analyze content structure', () => {
      const structuredContent = `
# Main Title

This is content with structure.

## Section 1
- Item 1
- Item 2

## Section 2
1. Step 1
2. Step 2

\`\`\`bash
echo "code block"
\`\`\`

[Link](https://example.com)
      `
      
      const result = analyzer.analyzeContent(structuredContent)
      
      expect(result).toHaveProperty('structure')
      expect(result).toHaveProperty('semantics')
      expect(result).toHaveProperty('quality')
      expect(result).toHaveProperty('patterns')
      
      expect(result.structure.sectionCount).toBeGreaterThan(0)
      expect(result.structure.listCount).toBeGreaterThan(0)
      expect(result.structure.codeBlockCount).toBeGreaterThan(0)
      expect(result.structure.linkCount).toBeGreaterThan(0)
    })

    it('should analyze semantic content', () => {
      const result = analyzer.analyzeContent(mockConfigFile.content)
      
      expect(result.semantics).toHaveProperty('purpose')
      expect(result.semantics).toHaveProperty('scope')
      expect(result.semantics).toHaveProperty('intent')
      expect(result.semantics).toHaveProperty('domain')
      
      expect(result.semantics.purpose.primary).toBeTruthy()
      expect(result.semantics.intent.directive).toBeGreaterThan(0)
      expect(result.semantics.intent.guidance).toBeGreaterThan(0)
    })

    it('should analyze content quality', () => {
      const result = analyzer.analyzeContent(mockConfigFile.content)
      
      expect(result.quality).toHaveProperty('completeness')
      expect(result.quality).toHaveProperty('accuracy')
      expect(result.quality).toHaveProperty('currency')
      expect(result.quality).toHaveProperty('consistency')
      expect(result.quality).toHaveProperty('actionability')
      expect(result.quality).toHaveProperty('issues')
      
      expect(result.quality.completeness).toBeGreaterThan(0)
      expect(result.quality.completeness).toBeLessThanOrEqual(100)
    })

    it('should detect content patterns', () => {
      const patternedContent = `
Run the following commands:
1. npm install
2. npm test
3. npm build

If errors occur, then fix them.
When tests pass, deploy to production.
      `
      
      const result = analyzer.analyzeContent(patternedContent)
      
      expect(result.patterns).toHaveProperty('instructional')
      expect(result.patterns).toHaveProperty('procedural')
      expect(result.patterns).toHaveProperty('conditional')
      expect(result.patterns).toHaveProperty('referential')
    })
  })

  describe('Improvement Suggestions', () => {
    it('should suggest improvements based on analysis', () => {
      const mockFileAnalysis = {
        filePath: '/test/file.agent',
        detectedType: 'skill' as AbstractionType,
        confidence: 0.8,
        issues: [
          { code: 'MISSING_FIELD', message: 'Missing description', severity: 'error' as const }
        ],
        warnings: [
          { code: 'STYLE_ISSUE', message: 'Inconsistent formatting', severity: 'warning' as const }
        ],
        suggestions: [],
        originalFormat: 'agent' as const,
        ruleCount: 1
      }
      
      const suggestions = analyzer.suggestImprovements(mockFileAnalysis)
      
      expect(Array.isArray(suggestions)).toBe(true)
      expect(suggestions.length).toBeGreaterThan(0)
      
      // Should have recommendations for issues and warnings
      expect(suggestions.some(s => s.priority === 'critical')).toBe(true)
      expect(suggestions.some(s => s.priority === 'medium')).toBe(true)
    })

    it('should prioritize recommendations correctly', () => {
      const mockFileAnalysis = {
        filePath: '/test/file.agent',
        detectedType: 'skill' as AbstractionType,
        confidence: 0.8,
        issues: [
          { code: 'CRITICAL_ERROR', message: 'Critical issue', severity: 'error' as const }
        ],
        warnings: [
          { code: 'MINOR_WARNING', message: 'Minor issue', severity: 'warning' as const }
        ],
        suggestions: [],
        originalFormat: 'agent' as const,
        ruleCount: 1
      }
      
      const suggestions = analyzer.suggestImprovements(mockFileAnalysis)
      
      // Should be sorted by priority (critical first)
      expect(suggestions[0].priority).toBe('critical')
    })

    it('should provide actionable recommendations', () => {
      const mockFileAnalysis = {
        filePath: '/test/file.agent',
        detectedType: 'skill' as AbstractionType,
        confidence: 0.8,
        issues: [
          { code: 'VALIDATION_ERROR', message: 'Fix this error', severity: 'error' as const }
        ],
        warnings: [],
        suggestions: [],
        originalFormat: 'agent' as const,
        ruleCount: 1
      }
      
      const suggestions = analyzer.suggestImprovements(mockFileAnalysis)
      
      expect(suggestions[0]).toHaveProperty('action')
      expect(suggestions[0]).toHaveProperty('impact')
      expect(suggestions[0]).toHaveProperty('effort')
      
      expect(suggestions[0].action).toHaveProperty('type')
      expect(suggestions[0].action).toHaveProperty('target')
      expect(suggestions[0].action).toHaveProperty('steps')
      
      expect(Array.isArray(suggestions[0].action.steps)).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty content', () => {
      const emptyFile: ConfigFile = {
        ...mockConfigFile,
        content: ''
      }
      
      expect(() => analyzer.analyzeFile(emptyFile)).not.toThrow()
      expect(() => analyzer.analyzeCapabilities(emptyFile)).not.toThrow()
      expect(() => analyzer.scoreComplexity(emptyFile)).not.toThrow()
    })

    it('should handle malformed metadata', () => {
      const malformedFile: ConfigFile = {
        ...mockConfigFile,
        metadata: {} as any
      }
      
      expect(() => analyzer.analyzeFile(malformedFile)).not.toThrow()
    })

    it('should handle very large content', () => {
      const largeContent = 'This is very large content. '.repeat(10000)
      const largeFile: ConfigFile = {
        ...mockConfigFile,
        content: largeContent
      }
      
      expect(() => analyzer.analyzeContent(largeContent)).not.toThrow()
      expect(() => analyzer.scoreComplexity(largeFile)).not.toThrow()
    })

    it('should handle special characters and encoding', () => {
      const specialContent = 'Content with émojis 🎉 and spëcial chäracters'
      const specialFile: ConfigFile = {
        ...mockConfigFile,
        content: specialContent
      }
      
      expect(() => analyzer.analyzeContent(specialContent)).not.toThrow()
      expect(() => analyzer.detectPatterns(specialContent)).not.toThrow()
    })
  })
})