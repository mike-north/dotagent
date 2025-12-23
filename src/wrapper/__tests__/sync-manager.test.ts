import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SyncManager } from '../sync-manager.js'
import { 
  SyncConfig,
  ProjectConfig,
  ConfigFile,
  ImportError,
  ExportError,
  AnalysisError
} from '../types.js'

// Mock the imports from the main module
vi.mock('../../index.js', () => ({
  importAll: vi.fn(),
  exportAll: vi.fn(),
  detectAbstractionType: vi.fn(),
  validateAnyAbstraction: vi.fn()
}))

vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn()
  }
}))

import { 
  importAll,
  exportAll,
  detectAbstractionType,
  validateAnyAbstraction
} from '../../index.js'
import { promises as fs } from 'fs'

const mockImportAll = vi.mocked(importAll)
const mockExportAll = vi.mocked(exportAll)
const mockDetectAbstractionType = vi.mocked(detectAbstractionType)
const mockValidateAnyAbstraction = vi.mocked(validateAnyAbstraction)
const mockReadFile = vi.mocked(fs.readFile)

describe('SyncManager', () => {
  let syncManager: SyncManager

  beforeEach(() => {
    vi.clearAllMocks()
    syncManager = new SyncManager()
  })

  describe('constructor', () => {
    it('should create with default config', () => {
      const manager = new SyncManager()
      expect(manager).toBeInstanceOf(SyncManager)
    })

    it('should create with custom config', () => {
      const config: SyncConfig = {
        skipValidation: true,
        includePrivate: true,
        strictMode: true
      }
      const manager = new SyncManager(config)
      expect(manager).toBeInstanceOf(SyncManager)
    })
  })

  describe('importProject', () => {
    const mockImportResults = {
      results: [
        {
          filePath: '/test/rule.md',
          format: 'agent' as const,
          rules: [
            {
              metadata: { id: 'test-rule', type: 'rule' as const },
              content: 'Test rule content'
            }
          ],
          raw: 'Raw content'
        }
      ],
      errors: []
    }

    beforeEach(() => {
      mockImportAll.mockResolvedValue(mockImportResults)
      mockDetectAbstractionType.mockReturnValue({
        type: 'rule',
        confidence: 0.9,
        indicators: ['rule-pattern']
      })
      mockValidateAnyAbstraction.mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
        suggestions: []
      })
    })

    it('should import project successfully', async () => {
      const result = await syncManager.importProject('/test/project')

      expect(mockImportAll).toHaveBeenCalledWith('/test/project')
      expect(result).toEqual({
        path: '/test/project',
        rules: [{
          filePath: '/test/rule.md',
          type: 'rule',
          metadata: { id: 'test-rule', type: 'rule' },
          content: 'Test rule content',
          raw: 'Raw content',
          detectedIssues: [],
          suggestions: [],
          typeDetection: {
            type: 'rule',
            confidence: 0.9,
            indicators: ['rule-pattern']
          }
        }],
        skills: [],
        subagents: [],
        commands: [],
        metadata: expect.objectContaining({
          totalFiles: 1,
          detectedTypes: {
            rule: 1,
            skill: 0,
            subagent: 0,
            command: 0
          }
        })
      })
    })

    it('should categorize files by abstraction type', async () => {
      const skillImportResults = {
        results: [
          {
            filePath: '/test/skill.md',
            format: 'agent' as const,
            rules: [
              {
                metadata: { id: 'test-skill', type: 'skill' as const, expertise: ['testing'] },
                content: 'Test skill content'
              }
            ],
            raw: 'Raw skill content'
          }
        ],
        errors: []
      }

      mockImportAll.mockResolvedValue(skillImportResults)
      mockDetectAbstractionType.mockReturnValue({
        type: 'skill',
        confidence: 0.95,
        indicators: ['skill-pattern']
      })

      const result = await syncManager.importProject('/test/project')

      expect(result.skills).toHaveLength(1)
      expect(result.skills[0].type).toBe('skill')
      expect(result.rules).toHaveLength(0)
    })

    it('should handle import errors', async () => {
      mockImportAll.mockRejectedValue(new Error('Import failed'))

      await expect(syncManager.importProject('/test/project'))
        .rejects.toThrow(ImportError)
    })

    it('should include import errors in metadata', async () => {
      const importResultsWithErrors = {
        results: [],
        errors: [
          { file: 'bad-file.md', error: 'Parse error' }
        ]
      }

      mockImportAll.mockResolvedValue(importResultsWithErrors)

      const result = await syncManager.importProject('/test/project')

      expect(result.metadata.issues).toHaveLength(1)
      expect(result.metadata.issues[0].message).toBe('Parse error')
    })
  })

  describe('importFile', () => {
    const mockFileContent = 'File content'
    const mockImportResults = {
      results: [
        {
          filePath: '/test/file.md',
          format: 'agent' as const,
          rules: [
            {
              metadata: { id: 'test-file', type: 'command' as const },
              content: 'Test command content'
            }
          ],
          raw: mockFileContent
        }
      ],
      errors: []
    }

    beforeEach(() => {
      mockReadFile.mockResolvedValue(mockFileContent)
      mockImportAll.mockResolvedValue(mockImportResults)
      mockDetectAbstractionType.mockReturnValue({
        type: 'command',
        confidence: 0.8,
        indicators: ['command-pattern']
      })
      mockValidateAnyAbstraction.mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
        suggestions: []
      })
    })

    it('should import single file successfully', async () => {
      const result = await syncManager.importFile('/test/file.md')

      expect(mockReadFile).toHaveBeenCalledWith('/test/file.md', 'utf-8')
      expect(mockImportAll).toHaveBeenCalledWith('/test')
      expect(result).toEqual({
        filePath: '/test/file.md',
        type: 'command',
        metadata: { id: 'test-file', type: 'command' },
        content: 'Test command content',
        raw: mockFileContent,
        detectedIssues: [],
        suggestions: [],
        typeDetection: {
          type: 'command',
          confidence: 0.8,
          indicators: ['command-pattern']
        }
      })
    })

    it('should handle file not found in import results', async () => {
      const emptyImportResults = { results: [], errors: [] }
      mockImportAll.mockResolvedValue(emptyImportResults)

      await expect(syncManager.importFile('/test/missing.md'))
        .rejects.toThrow(ImportError)
    })
  })

  describe('exportProject', () => {
    const mockProjectConfig: ProjectConfig = {
      path: '/test/project',
      rules: [],
      skills: [],
      subagents: [],
      commands: [{
        filePath: '/test/command.md',
        type: 'command',
        metadata: { id: 'test-cmd', type: 'command', trigger: '/test', userInvoked: true },
        content: 'Test command',
        raw: 'Raw command',
        detectedIssues: [],
        suggestions: []
      }],
      metadata: {
        totalFiles: 1,
        detectedTypes: { rule: 0, skill: 0, subagent: 0, command: 1 },
        issues: [],
        lastAnalyzed: new Date()
      }
    }

    beforeEach(() => {
      mockExportAll.mockImplementation(() => {})
    })

    it('should export project to multiple formats', async () => {
      const results = await syncManager.exportProject(mockProjectConfig, ['agent', 'cursor'])

      expect(results).toHaveLength(2)
      expect(results[0]).toEqual({
        format: 'agent',
        filePath: '/test/project/export.agent',
        success: true,
        rulesExported: 1,
        warnings: []
      })
      expect(results[1]).toEqual({
        format: 'cursor',
        filePath: '/test/project/export.cursor',
        success: true,
        rulesExported: 1,
        warnings: []
      })
    })

    it('should handle export failures gracefully', async () => {
      mockExportAll.mockImplementation(() => {
        throw new Error('Export failed')
      })

      const results = await syncManager.exportProject(mockProjectConfig, ['agent'])

      expect(results).toHaveLength(1)
      expect(results[0].success).toBe(false)
      expect(results[0].error).toBe('Failed to export to agent')
    })
  })

  describe('exportFile', () => {
    const mockConfigFile: ConfigFile = {
      filePath: '/test/skill.md',
      type: 'skill',
      metadata: { id: 'test-skill', type: 'skill', expertise: ['testing'] },
      content: 'Test skill content',
      raw: 'Raw skill content',
      detectedIssues: [],
      suggestions: []
    }

    beforeEach(() => {
      mockExportAll.mockImplementation(() => {})
    })

    it('should export single file successfully', async () => {
      const result = await syncManager.exportFile(mockConfigFile, 'agent')

      expect(mockExportAll).toHaveBeenCalledWith(
        [{
          metadata: mockConfigFile.metadata,
          content: mockConfigFile.content
        }],
        expect.any(String), // repoPath
        false, // dryRun  
        expect.objectContaining({
          format: 'agent',
          includePrivate: false
        })
      )
      expect(result).toBe('Successfully exported to agent format')
    })

    it('should handle export errors', async () => {
      mockExportAll.mockImplementation(() => {
        throw new Error('Export failed')
      })

      await expect(syncManager.exportFile(mockConfigFile, 'agent'))
        .rejects.toThrow(ExportError)
    })
  })

  describe('analyzeProject', () => {
    const mockProjectConfig: ProjectConfig = {
      path: '/test/project',
      rules: [{
        filePath: '/test/rule.md',
        type: 'rule',
        metadata: { id: 'test-rule' },
        content: 'Test rule',
        raw: 'Raw rule',
        detectedIssues: [],
        suggestions: []
      }],
      skills: [],
      subagents: [],
      commands: [],
      metadata: {
        totalFiles: 1,
        detectedTypes: { rule: 1, skill: 0, subagent: 0, command: 0 },
        issues: [],
        lastAnalyzed: new Date()
      }
    }

    beforeEach(() => {
      // Mock importProject to return our test config
      vi.spyOn(syncManager, 'importProject').mockResolvedValue(mockProjectConfig)
      
      mockDetectAbstractionType.mockReturnValue({
        type: 'rule',
        confidence: 0.9,
        indicators: ['rule-indicator']
      })
      
      mockValidateAnyAbstraction.mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
        suggestions: []
      })
    })

    it('should analyze project successfully', async () => {
      const result = await syncManager.analyzeProject('/test/project')

      expect(result.summary).toEqual({
        totalFiles: 1,
        totalRules: 1,
        totalSkills: 0,
        totalSubagents: 0,
        totalCommands: 0,
        errorCount: 0,
        warningCount: 0,
        healthScore: 100
      })

      expect(result.files).toHaveLength(1)
      expect(result.files[0]).toEqual({
        filePath: '/test/rule.md',
        detectedType: 'rule',
        confidence: 0.9,
        issues: [],
        warnings: [],
        suggestions: [],
        abstractionMismatch: undefined,
        originalFormat: undefined,
        ruleCount: 1
      })

      expect(result.typeDistribution).toEqual({
        rules: 1,
        skills: 0,
        subagents: 0,
        commands: 0,
        mixed: 0,
        unknown: 0
      })
    })

    it('should detect abstraction mismatches', async () => {
      // Mock a file with type mismatch
      const mismatchConfig: ProjectConfig = {
        ...mockProjectConfig,
        rules: [{
          ...mockProjectConfig.rules[0],
          metadata: { id: 'test-rule', type: 'skill' } // Declared as skill
        }]
      }

      vi.spyOn(syncManager, 'importProject').mockResolvedValue(mismatchConfig)
      
      // But detected as rule
      mockDetectAbstractionType.mockReturnValue({
        type: 'rule',
        confidence: 0.95,
        indicators: ['rule-pattern']
      })

      const result = await syncManager.analyzeProject('/test/project')

      expect(result.files[0].abstractionMismatch).toEqual({
        declaredType: 'skill',
        detectedType: 'rule',
        confidence: 0.95,
        reasons: ['rule-pattern']
      })

      expect(result.recommendations).toContainEqual({
        code: 'TYPE_MISMATCH',
        severity: 'medium',
        title: 'Abstraction Type Mismatches Detected',
        description: '1 files have mismatched abstraction types',
        affectedFiles: ['/test/rule.md'],
        actionable: true,
        suggestedAction: 'Review and update type declarations in metadata'
      })
    })

    it('should handle analysis errors', async () => {
      vi.spyOn(syncManager, 'importProject').mockRejectedValue(new Error('Import failed'))

      await expect(syncManager.analyzeProject('/test/project'))
        .rejects.toThrow(AnalysisError)
    })
  })

  describe('validateConfig', () => {
    const mockConfigFile: ConfigFile = {
      filePath: '/test/file.md',
      type: 'rule',
      metadata: { id: 'test-rule' },
      content: 'Test content',
      raw: 'Raw content',
      detectedIssues: [],
      suggestions: []
    }

    it('should validate successfully', () => {
      mockValidateAnyAbstraction.mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
        suggestions: []
      })

      const result = syncManager.validateConfig(mockConfigFile)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should handle validation errors', () => {
      mockValidateAnyAbstraction.mockReturnValue({
        valid: false,
        errors: [{
          code: 'MISSING_ID',
          message: 'ID is required',
          severity: 'error'
        }],
        warnings: [],
        suggestions: []
      })

      const result = syncManager.validateConfig(mockConfigFile)

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].message).toBe('ID is required')
    })

    it('should handle validation exceptions', () => {
      mockValidateAnyAbstraction.mockImplementation(() => {
        throw new Error('Validation crashed')
      })

      const result = syncManager.validateConfig(mockConfigFile)

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].message).toBe('Validation crashed')
    })
  })

  describe('suggestImprovements', () => {
    it('should suggest expertise for skills without it', () => {
      const skillConfig: ConfigFile = {
        filePath: '/test/skill.md',
        type: 'skill',
        metadata: { id: 'test-skill', type: 'skill' }, // Missing expertise
        content: 'Test skill',
        raw: 'Raw skill',
        detectedIssues: [],
        suggestions: []
      }

      mockValidateAnyAbstraction.mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
        suggestions: []
      })

      const suggestions = syncManager.suggestImprovements(skillConfig)

      expect(suggestions).toContainEqual({
        type: 'metadata',
        severity: 'high',
        message: 'Skills should define expertise areas',
        field: 'expertise',
        actionable: true
      })
    })

    it('should suggest isolated context for subagents', () => {
      const subagentConfig: ConfigFile = {
        filePath: '/test/subagent.md',
        type: 'subagent',
        metadata: { id: 'test-subagent', type: 'subagent' }, // Missing isolatedContext
        content: 'Test subagent',
        raw: 'Raw subagent',
        detectedIssues: [],
        suggestions: []
      }

      mockValidateAnyAbstraction.mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
        suggestions: []
      })

      const suggestions = syncManager.suggestImprovements(subagentConfig)

      expect(suggestions).toContainEqual({
        type: 'metadata',
        severity: 'high',
        message: 'Subagents must have isolated context',
        field: 'isolatedContext',
        suggestedValue: 'true',
        actionable: true
      })
    })

    it('should suggest trigger format for commands', () => {
      const commandConfig: ConfigFile = {
        filePath: '/test/command.md',
        type: 'command',
        metadata: { id: 'test-command', type: 'command', trigger: 'bad-trigger' }, // Invalid trigger
        content: 'Test command',
        raw: 'Raw command',
        detectedIssues: [],
        suggestions: []
      }

      mockValidateAnyAbstraction.mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
        suggestions: []
      })

      const suggestions = syncManager.suggestImprovements(commandConfig)

      expect(suggestions).toContainEqual({
        type: 'metadata',
        severity: 'high',
        message: 'Commands must have a trigger starting with "/"',
        field: 'trigger',
        actionable: true
      })
    })

    it('should suggest description when missing', () => {
      const configFile: ConfigFile = {
        filePath: '/test/rule.md',
        type: 'rule',
        metadata: { id: 'test-rule' }, // Missing description
        content: 'Test rule content that is long enough to not trigger length warning',
        raw: 'Raw rule',
        detectedIssues: [],
        suggestions: []
      }

      mockValidateAnyAbstraction.mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
        suggestions: []
      })

      const suggestions = syncManager.suggestImprovements(configFile)

      expect(suggestions).toContainEqual({
        type: 'metadata',
        severity: 'low',
        message: 'Consider adding a description for better documentation',
        field: 'description',
        actionable: true
      })
    })

    it('should suggest more content when too short', () => {
      const configFile: ConfigFile = {
        filePath: '/test/rule.md',
        type: 'rule',
        metadata: { id: 'test-rule', description: 'Test' },
        content: 'Short', // Too short
        raw: 'Raw rule',
        detectedIssues: [],
        suggestions: []
      }

      mockValidateAnyAbstraction.mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
        suggestions: []
      })

      const suggestions = syncManager.suggestImprovements(configFile)

      expect(suggestions).toContainEqual({
        type: 'content',
        severity: 'medium',
        message: 'Content seems very short - consider adding more detail',
        actionable: true
      })
    })
  })
})