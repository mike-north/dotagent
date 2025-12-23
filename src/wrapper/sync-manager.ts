import { promises as fs } from 'fs'
import path from 'path'
import { 
  importAll,
  exportAll,
  detectAbstractionType,
  validateAnyAbstraction,
  type ImportResults,
  type RuleBlock,
  type AbstractionType,
  type ExportOptions,
  type ValidationError,
  type ValidationSuggestion
} from '../index.js'
import {
  SyncConfig,
  ProjectConfig,
  ConfigFile,
  ProjectAnalysis,
  FileAnalysis,
  ExportResult,
  ProjectSummary,
  ProjectRecommendation,
  TypeDistribution,
  AbstractionMismatch,
  ValidationResult,
  Suggestion,
  SyncError,
  ImportError,
  ExportError,
  AnalysisError
} from './types.js'
import { 
  ConfigAnalyzer,
  AnalysisResult,
  HealthScore,
  ComplexityScore,
  CapabilityAnalysis,
  PatternDetection,
  RelationshipMap,
  ContentAnalysis,
  AbstractionMap
} from './analyzer.js'

export class SyncManager {
  private config: SyncConfig
  private analyzer: ConfigAnalyzer

  constructor(config: SyncConfig = {}) {
    this.config = {
      skipValidation: false,
      includePrivate: false,
      autoDetectTypes: true,
      strictMode: false,
      outputFormats: ['agent'],
      ...config
    }
    this.analyzer = new ConfigAnalyzer()
  }

  /**
   * Import a complete project and organize it by abstraction types
   */
  async importProject(path: string): Promise<ProjectConfig> {
    try {
      const importResults = await importAll(path)

      return await this.processImportResults(importResults, path)
    } catch (error) {
      throw new ImportError(
        `Failed to import project from ${path}`,
        path,
        [error instanceof Error ? error.message : String(error)]
      )
    }
  }

  /**
   * Import a single file and detect its abstraction type
   */
  async importFile(filePath: string): Promise<ConfigFile> {
    try {
      // Read the file content
      const content = await fs.readFile(filePath, 'utf-8')
      
      // Import using existing dotagent functionality
      const importResults = await importAll(path.dirname(filePath))

      // Find the specific file in results
      const fileResult = importResults.results.find(
        result => result.filePath === filePath
      )

      if (!fileResult) {
        throw new ImportError(`File not found in import results`, filePath)
      }

      // Process the single file
      return await this.processFileResult(fileResult, content)
    } catch (error) {
      throw new ImportError(
        `Failed to import file ${filePath}`,
        filePath,
        [error instanceof Error ? error.message : String(error)]
      )
    }
  }

  /**
   * Export project in specified formats
   */
  async exportProject(
    config: ProjectConfig, 
    formats: string[]
  ): Promise<ExportResult[]> {
    const results: ExportResult[] = []
    
    for (const format of formats) {
      try {
        const result = await this.exportToFormat(config, format)
        results.push(result)
      } catch (error) {
        results.push({
          format,
          filePath: '',
          success: false,
          error: error instanceof Error ? error.message : String(error),
          rulesExported: 0,
          warnings: []
        })
      }
    }

    return results
  }

  /**
   * Export a single file to a specific format
   */
  async exportFile(config: ConfigFile, format: string): Promise<string> {
    try {
      const exportOptions: ExportOptions = {
        format: format as any,
        includePrivate: this.config.includePrivate
      }

      // Create a temporary rule block from the config file
      const ruleBlock: RuleBlock = {
        metadata: config.metadata,
        content: config.content
      }

      // Use existing export functionality (exportAll returns void, so we'll return a success message)
      exportAll([ruleBlock], path.dirname(config.filePath), false, exportOptions)
      return `Successfully exported to ${format} format`
    } catch (error) {
      throw new ExportError(
        `Failed to export file to ${format}`,
        format,
        [error instanceof Error ? error.message : String(error)]
      )
    }
  }

  /**
   * Analyze a project for issues and recommendations
   */
  async analyzeProject(projectPath: string): Promise<ProjectAnalysis> {
    try {
      const projectConfig = await this.importProject(projectPath)
      
      const files: FileAnalysis[] = []
      const allFiles = [
        ...projectConfig.rules,
        ...projectConfig.skills,
        ...projectConfig.subagents,
        ...projectConfig.commands
      ]

      // Analyze each file
      for (const file of allFiles) {
        const analysis = await this.analyzeConfigFile(file)
        files.push(analysis)
      }

      const summary = this.generateProjectSummary(projectConfig, files)
      const recommendations = this.generateProjectRecommendations(files)
      const typeDistribution = this.calculateTypeDistribution(files)

      return {
        summary,
        files,
        recommendations,
        typeDistribution
      }
    } catch (error) {
      throw new AnalysisError(
        `Failed to analyze project at ${projectPath}`,
        projectPath,
        [error instanceof Error ? error.message : String(error)]
      )
    }
  }

  /**
   * Analyze a single file for type and validation issues
   */
  async analyzeFile(filePath: string): Promise<FileAnalysis> {
    try {
      const configFile = await this.importFile(filePath)
      return await this.analyzeConfigFile(configFile)
    } catch (error) {
      throw new AnalysisError(
        `Failed to analyze file ${filePath}`,
        filePath,
        [error instanceof Error ? error.message : String(error)]
      )
    }
  }

  /**
   * Validate a configuration file
   */
  validateConfig(config: ConfigFile): ValidationResult {
    try {
      return validateAnyAbstraction(config.metadata, config.content)
    } catch (error) {
      return {
        valid: false,
        errors: [{
          code: 'VALIDATION_FAILED',
          message: error instanceof Error ? error.message : String(error),
          severity: 'error' as const
        }],
        warnings: [],
        suggestions: []
      }
    }
  }

  /**
   * Suggest improvements for a configuration file
   */
  suggestImprovements(config: ConfigFile): Suggestion[] {
    const suggestions: Suggestion[] = []
    
    // Get validation results first
    const validation = this.validateConfig(config)
    
    // Convert validation suggestions to our format
    for (const suggestion of validation.suggestions) {
      suggestions.push({
        type: 'validation',
        severity: 'medium',
        message: suggestion.message,
        field: suggestion.field,
        actionable: suggestion.actionable
      })
    }

    // Add type-specific suggestions
    suggestions.push(...this.getTypeSpecificSuggestions(config))
    
    // Add structural suggestions
    suggestions.push(...this.getStructuralSuggestions(config))

    return suggestions
  }

  /**
   * Comprehensive project analysis using ConfigAnalyzer
   */
  async analyzeProjectComprehensive(projectPath: string): Promise<AnalysisResult> {
    try {
      const projectConfig = await this.importProject(projectPath)
      
      // Use ConfigAnalyzer for comprehensive analysis
      const projectAnalysis = this.analyzer.analyzeProject(projectConfig)
      
      // Calculate health score
      const health = this.calculateHealthScore(projectAnalysis)
      
      // Calculate complexity score  
      const complexity = await this.calculateComplexityScore(projectConfig)
      
      // Analyze capabilities
      const capabilities = await this.analyzeCapabilities(projectConfig)
      
      // Detect patterns
      const patterns = await this.detectPatterns(projectConfig)
      
      // Map relationships
      const relationships = await this.mapRelationships(projectConfig)
      
      // Generate recommendations
      const recommendations = this.analyzer.suggestImprovements(projectAnalysis.files[0] || {
        filePath: '',
        detectedType: 'rule',
        confidence: 0,
        issues: [],
        warnings: [],
        suggestions: [],
        originalFormat: 'agent',
        ruleCount: 0
      })
      
      return {
        health,
        complexity,
        capabilities,
        patterns,
        relationships,
        recommendations
      }
    } catch (error) {
      throw new AnalysisError(
        `Comprehensive analysis failed for ${projectPath}`,
        projectPath,
        [error instanceof Error ? error.message : String(error)]
      )
    }
  }

  /**
   * Analyze project health with detailed breakdown
   */
  async analyzeProjectHealth(projectPath: string): Promise<HealthScore> {
    try {
      const projectConfig = await this.importProject(projectPath)
      const projectAnalysis = this.analyzer.analyzeProject(projectConfig)
      
      return this.calculateHealthScore(projectAnalysis)
    } catch (error) {
      throw new AnalysisError(
        `Health analysis failed for ${projectPath}`,
        projectPath,
        [error instanceof Error ? error.message : String(error)]
      )
    }
  }

  /**
   * Analyze project complexity with detailed scoring
   */
  async analyzeProjectComplexity(projectPath: string): Promise<ComplexityScore> {
    try {
      const projectConfig = await this.importProject(projectPath)
      return await this.calculateComplexityScore(projectConfig)
    } catch (error) {
      throw new AnalysisError(
        `Complexity analysis failed for ${projectPath}`,
        projectPath,
        [error instanceof Error ? error.message : String(error)]
      )
    }
  }

  /**
   * Analyze project capabilities 
   */
  async analyzeProjectCapabilities(projectPath: string): Promise<CapabilityAnalysis> {
    try {
      const projectConfig = await this.importProject(projectPath)
      return await this.analyzeCapabilities(projectConfig)
    } catch (error) {
      throw new AnalysisError(
        `Capability analysis failed for ${projectPath}`,
        projectPath,
        [error instanceof Error ? error.message : String(error)]
      )
    }
  }

  /**
   * Detect patterns and anti-patterns in project
   */
  async detectProjectPatterns(projectPath: string): Promise<PatternDetection> {
    try {
      const projectConfig = await this.importProject(projectPath)
      return await this.detectPatterns(projectConfig)
    } catch (error) {
      throw new AnalysisError(
        `Pattern detection failed for ${projectPath}`,
        projectPath,
        [error instanceof Error ? error.message : String(error)]
      )
    }
  }

  /**
   * Map relationships between abstractions
   */
  async mapProjectRelationships(projectPath: string): Promise<RelationshipMap> {
    try {
      const projectConfig = await this.importProject(projectPath)
      return await this.mapRelationships(projectConfig)
    } catch (error) {
      throw new AnalysisError(
        `Relationship mapping failed for ${projectPath}`,
        projectPath,
        [error instanceof Error ? error.message : String(error)]
      )
    }
  }

  /**
   * Generate abstraction map for visualization
   */
  async generateAbstractionMap(projectPath: string): Promise<AbstractionMap> {
    try {
      const projectConfig = await this.importProject(projectPath)
      const allFiles = [
        ...projectConfig.rules,
        ...projectConfig.skills, 
        ...projectConfig.subagents,
        ...projectConfig.commands
      ]
      
      const ruleBlocks: RuleBlock[] = allFiles.map(file => ({
        metadata: file.metadata,
        content: file.content
      }))
      
      return this.analyzer.detectAbstractions(ruleBlocks)
    } catch (error) {
      throw new AnalysisError(
        `Abstraction mapping failed for ${projectPath}`,
        projectPath,
        [error instanceof Error ? error.message : String(error)]
      )
    }
  }

  /**
   * Analyze content quality and structure
   */
  async analyzeContent(filePath: string): Promise<ContentAnalysis> {
    try {
      const configFile = await this.importFile(filePath)
      return this.analyzer.analyzeContent(configFile.content)
    } catch (error) {
      throw new AnalysisError(
        `Content analysis failed for ${filePath}`,
        filePath,
        [error instanceof Error ? error.message : String(error)]
      )
    }
  }

  // Private analysis helper methods

  private calculateHealthScore(projectAnalysis: ProjectAnalysis): HealthScore {
    const healthScore = projectAnalysis.summary.healthScore
    
    // Calculate component scores based on project analysis
    const completeness = Math.max(0, 100 - (projectAnalysis.summary.errorCount * 10))
    const consistency = Math.max(0, 100 - (projectAnalysis.summary.warningCount * 5))
    const maintainability = Math.min(100, healthScore + 10) // Boost for good structure
    const performance = healthScore // Use base health as performance proxy
    const security = Math.max(80, healthScore) // Security baseline
    
    // Create factor breakdowns
    const factors = this.createHealthFactors(projectAnalysis)
    
    return {
      overall: Math.round((completeness + consistency + maintainability + performance + security) / 5),
      completeness,
      consistency, 
      maintainability,
      performance,
      security,
      breakdown: {
        completeness: {
          score: completeness,
          factors: factors.completeness
        },
        consistency: {
          score: consistency,
          factors: factors.consistency
        },
        maintainability: {
          score: maintainability,
          factors: factors.maintainability
        },
        performance: {
          score: performance,
          factors: factors.performance
        },
        security: {
          score: security,
          factors: factors.security
        }
      }
    }
  }

  private async calculateComplexityScore(projectConfig: ProjectConfig): Promise<ComplexityScore> {
    let totalCognitive = 0
    let totalStructural = 0
    let totalDependencies = 0
    
    const allFiles = [
      ...projectConfig.rules,
      ...projectConfig.skills,
      ...projectConfig.subagents,
      ...projectConfig.commands
    ]
    
    // Analyze each file for complexity
    for (const file of allFiles) {
      const complexity = this.analyzer.scoreComplexity(file)
      totalCognitive += complexity.cognitive
      totalStructural += complexity.structural
      totalDependencies += complexity.dependencies
    }
    
    // Average complexity scores
    const fileCount = allFiles.length || 1
    const avgCognitive = totalCognitive / fileCount
    const avgStructural = totalStructural / fileCount  
    const avgDependencies = totalDependencies / fileCount
    
    // Determine overall complexity level
    const total = avgCognitive + avgStructural + avgDependencies
    const overall: ComplexityScore['overall'] = 
      total <= 5 ? 'low' :
      total <= 15 ? 'medium' :
      total <= 30 ? 'high' : 'very-high'
    
    return {
      overall,
      cognitive: avgCognitive,
      structural: avgStructural,
      dependencies: avgDependencies,
      factors: this.createComplexityFactors(avgCognitive, avgStructural, avgDependencies),
      breakdown: this.createComplexityBreakdown(avgCognitive, avgStructural, avgDependencies)
    }
  }

  private async analyzeCapabilities(projectConfig: ProjectConfig): Promise<CapabilityAnalysis> {
    const allFiles = [
      ...projectConfig.rules,
      ...projectConfig.skills,
      ...projectConfig.subagents,
      ...projectConfig.commands
    ]
    
    let allCapabilities: any[] = []
    let allMissing: string[] = []
    
    // Analyze capabilities for each file
    for (const file of allFiles) {
      const capabilityAnalysis = this.analyzer.analyzeCapabilities(file)
      allCapabilities = allCapabilities.concat(
        capabilityAnalysis.primary,
        capabilityAnalysis.secondary,
        capabilityAnalysis.emergent
      )
      allMissing = allMissing.concat(capabilityAnalysis.missing)
    }
    
    // Categorize by impact
    const primary = allCapabilities.filter(c => c.impact === 'high')
    const secondary = allCapabilities.filter(c => c.impact === 'medium')
    const emergent = allCapabilities.filter(c => c.impact === 'low')
    
    // Remove duplicates from missing capabilities
    const missing = Array.from(new Set(allMissing))
    
    // Calculate coverage
    const coverage = this.calculateProjectCoverage(allCapabilities)
    
    return {
      primary,
      secondary,
      emergent,
      missing,
      coverage
    }
  }

  private async detectPatterns(projectConfig: ProjectConfig): Promise<PatternDetection> {
    const allFiles = [
      ...projectConfig.rules,
      ...projectConfig.skills,
      ...projectConfig.subagents,
      ...projectConfig.commands
    ]
    
    const allPatterns: any = {
      recognized: [],
      antiPatterns: [],
      bestPractices: [],
      innovations: [],
      templateMatches: []
    }
    
    // Detect patterns in each file
    for (const file of allFiles) {
      const patterns = this.analyzer.detectPatterns(file.content)
      allPatterns.recognized = allPatterns.recognized.concat(patterns.recognized)
      allPatterns.antiPatterns = allPatterns.antiPatterns.concat(patterns.antiPatterns)
      allPatterns.bestPractices = allPatterns.bestPractices.concat(patterns.bestPractices)
      allPatterns.innovations = allPatterns.innovations.concat(patterns.innovations)
      allPatterns.templateMatches = allPatterns.templateMatches.concat(patterns.templateMatches)
    }
    
    return allPatterns
  }

  private async mapRelationships(projectConfig: ProjectConfig): Promise<RelationshipMap> {
    // Create relationship map using ConfigAnalyzer
    const allFiles = [
      ...projectConfig.rules,
      ...projectConfig.skills,
      ...projectConfig.subagents,
      ...projectConfig.commands
    ]
    
    const ruleBlocks: RuleBlock[] = allFiles.map(file => ({
      metadata: file.metadata,
      content: file.content
    }))
    
    const abstractionMap = this.analyzer.detectAbstractions(ruleBlocks)
    
    // Convert abstraction relationships to relationship map format
    return {
      dependencies: abstractionMap.relationships.map(rel => ({
        from: rel.from,
        to: rel.to,
        type: 'requires' as const,
        strength: rel.strength > 0.7 ? 'strong' as const : 
                 rel.strength > 0.4 ? 'medium' as const : 'weak' as const,
        nature: rel.nature as any
      })),
      conflicts: [], // Would need more sophisticated analysis
      synergies: [], // Would need more sophisticated analysis
      hierarchies: [], // Would need more sophisticated analysis
      clusters: abstractionMap.clusters.map(cluster => ({
        name: cluster.name,
        members: cluster.members,
        cohesion: cluster.cohesion,
        purpose: cluster.purpose,
        characteristics: [cluster.purpose] // Simplified
      }))
    }
  }

  private createHealthFactors(projectAnalysis: ProjectAnalysis) {
    return {
      completeness: [
        {
          name: 'Error Rate',
          score: Math.max(0, 100 - projectAnalysis.summary.errorCount * 10),
          weight: 0.6,
          description: 'Number of validation errors',
          impact: projectAnalysis.summary.errorCount > 0 ? 'negative' as const : 'positive' as const
        }
      ],
      consistency: [
        {
          name: 'Warning Rate', 
          score: Math.max(0, 100 - projectAnalysis.summary.warningCount * 5),
          weight: 0.5,
          description: 'Number of validation warnings',
          impact: projectAnalysis.summary.warningCount > 0 ? 'negative' as const : 'positive' as const
        }
      ],
      maintainability: [
        {
          name: 'Type Distribution',
          score: this.calculateTypeDistributionScore(projectAnalysis.typeDistribution),
          weight: 0.4,
          description: 'Balance of abstraction types',
          impact: 'positive' as const
        }
      ],
      performance: [
        {
          name: 'File Organization',
          score: projectAnalysis.summary.totalFiles > 0 ? 85 : 50,
          weight: 0.3,
          description: 'Organization of configuration files',
          impact: 'positive' as const
        }
      ],
      security: [
        {
          name: 'Validation Coverage',
          score: projectAnalysis.summary.errorCount === 0 ? 90 : 70,
          weight: 0.5,
          description: 'Validation rule coverage',
          impact: 'positive' as const
        }
      ]
    }
  }

  private createComplexityFactors(cognitive: number, structural: number, dependencies: number) {
    return [
      {
        category: 'cognitive' as const,
        name: 'Cognitive Load',
        score: cognitive,
        weight: 0.4,
        description: 'Mental effort required to understand'
      },
      {
        category: 'structural' as const,
        name: 'Structural Complexity',
        score: structural,
        weight: 0.3,
        description: 'Organization and size complexity'
      },
      {
        category: 'dependency' as const,
        name: 'Dependency Complexity',
        score: dependencies,
        weight: 0.3,
        description: 'External dependency complexity'
      }
    ]
  }

  private createComplexityBreakdown(cognitive: number, structural: number, dependencies: number) {
    return {
      cognitive: {
        score: cognitive,
        contributors: [
          {
            aspect: 'Conditional Logic',
            value: cognitive * 0.6,
            impact: cognitive * 0.24,
            description: 'If/when/unless statements'
          },
          {
            aspect: 'Nesting Depth',
            value: cognitive * 0.4,
            impact: cognitive * 0.16,
            description: 'Nested structures and blocks'
          }
        ]
      },
      structural: {
        score: structural,
        contributors: [
          {
            aspect: 'Content Length',
            value: structural * 0.7,
            impact: structural * 0.21,
            description: 'Lines of configuration content'
          },
          {
            aspect: 'Section Count',
            value: structural * 0.3,
            impact: structural * 0.09,
            description: 'Number of organized sections'
          }
        ]
      },
      dependencies: {
        score: dependencies,
        contributors: [
          {
            aspect: 'Direct Dependencies',
            value: dependencies,
            impact: dependencies * 0.3,
            description: 'Direct dependency count'
          }
        ]
      }
    }
  }

  private calculateProjectCoverage(capabilities: any[]) {
    const coverage = {
      automation: 0,
      guidance: 0, 
      validation: 0,
      transformation: 0,
      coordination: 0,
      optimization: 0,
      monitoring: 0,
      documentation: 0,
      security: 0,
      integration: 0
    }
    
    capabilities.forEach(cap => {
      coverage[cap.category as keyof typeof coverage] = Math.max(
        coverage[cap.category as keyof typeof coverage], 
        cap.confidence
      )
    })
    
    return coverage
  }

  private calculateTypeDistributionScore(distribution: TypeDistribution): number {
    // Calculate balance score - prefer balanced distribution
    const total = distribution.rules + distribution.skills + distribution.subagents + distribution.commands
    if (total === 0) return 50
    
    const balance = [
      distribution.rules / total,
      distribution.skills / total,
      distribution.subagents / total,
      distribution.commands / total
    ]
    
    // Penalize extreme imbalance
    const maxProportion = Math.max(...balance)
    return Math.max(0, 100 - (maxProportion * 100 - 25) * 2)
  }

  // Private helper methods

  private async processImportResults(
    importResults: ImportResults, 
    projectPath: string
  ): Promise<ProjectConfig> {
    const rules: ConfigFile[] = []
    const skills: ConfigFile[] = []
    const subagents: ConfigFile[] = []
    const commands: ConfigFile[] = []

    // Process each import result
    for (const result of importResults.results) {
      const content = result.raw || ''
      
      for (const ruleBlock of result.rules) {
        const configFile = await this.processRuleBlock(ruleBlock, result.filePath, content)
        
        // Categorize by detected type
        switch (configFile.type) {
          case 'skill':
            skills.push(configFile)
            break
          case 'subagent':
            subagents.push(configFile)
            break
          case 'command':
            commands.push(configFile)
            break
          default:
            rules.push(configFile)
            break
        }
      }
    }

    const metadata = {
      totalFiles: importResults.results.length,
      detectedTypes: {
        rule: rules.length,
        skill: skills.length,
        subagent: subagents.length,
        command: commands.length
      },
      issues: importResults.errors.map(err => ({
        code: 'IMPORT_ERROR',
        message: err.error,
        field: err.file,
        severity: 'error' as const
      })),
      lastAnalyzed: new Date()
    }

    return {
      path: projectPath,
      rules,
      skills,
      subagents,
      commands,
      metadata
    }
  }

  private async processFileResult(
    fileResult: any,
    content: string
  ): Promise<ConfigFile> {
    if (fileResult.rules.length === 0) {
      throw new ImportError('No rules found in file', fileResult.filePath)
    }

    // For single file, take the first rule block
    const ruleBlock = fileResult.rules[0]
    return await this.processRuleBlock(ruleBlock, fileResult.filePath, content)
  }

  private async processRuleBlock(
    ruleBlock: RuleBlock,
    filePath: string,
    rawContent: string
  ): Promise<ConfigFile> {
    // Detect abstraction type if auto-detection is enabled
    let detectedType: AbstractionType = 'rule'
    let typeDetection = undefined
    
    if (this.config.autoDetectTypes) {
      typeDetection = detectAbstractionType(ruleBlock)
      detectedType = typeDetection.type
    }

    // Use declared type if available, otherwise use detected type
    const finalType = ruleBlock.metadata.type || detectedType

    // Validate unless disabled
    let detectedIssues: ValidationError[] = []
    let suggestions: ValidationSuggestion[] = []
    
    if (!this.config.skipValidation) {
      const validation = validateAnyAbstraction(ruleBlock.metadata, ruleBlock.content)
      detectedIssues = validation.errors
      suggestions = validation.suggestions
    }

    return {
      filePath,
      type: finalType,
      metadata: ruleBlock.metadata,
      content: ruleBlock.content,
      raw: rawContent,
      detectedIssues,
      suggestions,
      typeDetection
    }
  }

  private async analyzeConfigFile(config: ConfigFile): Promise<FileAnalysis> {
    // Re-detect type for analysis
    const typeDetection = detectAbstractionType({
      metadata: config.metadata,
      content: config.content
    })

    // Check for abstraction mismatches
    let abstractionMismatch: AbstractionMismatch | undefined
    if (config.metadata.type && config.metadata.type !== typeDetection.type) {
      abstractionMismatch = {
        declaredType: config.metadata.type as AbstractionType,
        detectedType: typeDetection.type,
        confidence: typeDetection.confidence,
        reasons: typeDetection.indicators
      }
    }

    // Get fresh validation results
    const validation = this.validateConfig(config)

    return {
      filePath: config.filePath,
      detectedType: typeDetection.type,
      confidence: typeDetection.confidence,
      issues: validation.errors,
      warnings: validation.warnings,
      suggestions: validation.suggestions,
      abstractionMismatch,
      originalFormat: config.typeDetection?.type,
      ruleCount: 1 // Single rule per file for now
    }
  }

  private generateProjectSummary(
    config: ProjectConfig,
    files: FileAnalysis[]
  ): ProjectSummary {
    const totalErrors = files.reduce((sum, file) => sum + file.issues.length, 0)
    const totalWarnings = files.reduce((sum, file) => sum + file.warnings.length, 0)
    
    // Calculate health score (0-100)
    const totalIssues = totalErrors + totalWarnings
    const maxPossibleIssues = files.length * 5 // Assume max 5 issues per file
    const healthScore = Math.max(0, 100 - (totalIssues / maxPossibleIssues) * 100)

    return {
      totalFiles: files.length,
      totalRules: config.rules.length,
      totalSkills: config.skills.length,
      totalSubagents: config.subagents.length,
      totalCommands: config.commands.length,
      errorCount: totalErrors,
      warningCount: totalWarnings,
      healthScore: Math.round(healthScore)
    }
  }

  private generateProjectRecommendations(files: FileAnalysis[]): ProjectRecommendation[] {
    const recommendations: ProjectRecommendation[] = []

    // Check for type mismatches
    const mismatchedFiles = files.filter(f => f.abstractionMismatch)
    if (mismatchedFiles.length > 0) {
      recommendations.push({
        code: 'TYPE_MISMATCH',
        severity: 'medium',
        title: 'Abstraction Type Mismatches Detected',
        description: `${mismatchedFiles.length} files have mismatched abstraction types`,
        affectedFiles: mismatchedFiles.map(f => f.filePath),
        actionable: true,
        suggestedAction: 'Review and update type declarations in metadata'
      })
    }

    // Check for high error rates
    const errorFiles = files.filter(f => f.issues.length > 2)
    if (errorFiles.length > 0) {
      recommendations.push({
        code: 'HIGH_ERROR_RATE',
        severity: 'high',
        title: 'Files with Multiple Validation Errors',
        description: `${errorFiles.length} files have more than 2 validation errors`,
        affectedFiles: errorFiles.map(f => f.filePath),
        actionable: true,
        suggestedAction: 'Address validation errors to improve configuration quality'
      })
    }

    return recommendations
  }

  private calculateTypeDistribution(files: FileAnalysis[]): TypeDistribution {
    const distribution = {
      rules: 0,
      skills: 0,
      subagents: 0,
      commands: 0,
      mixed: 0,
      unknown: 0
    }

    for (const file of files) {
      if (file.abstractionMismatch) {
        distribution.mixed++
      } else {
        switch (file.detectedType) {
          case 'rule':
            distribution.rules++
            break
          case 'skill':
            distribution.skills++
            break
          case 'subagent':
            distribution.subagents++
            break
          case 'command':
            distribution.commands++
            break
          default:
            distribution.unknown++
            break
        }
      }
    }

    return distribution
  }

  private async exportToFormat(
    config: ProjectConfig,
    format: string
  ): Promise<ExportResult> {
    try {
      // Combine all config files into rule blocks
      const allFiles = [
        ...config.rules,
        ...config.skills,
        ...config.subagents,
        ...config.commands
      ]

      const ruleBlocks: RuleBlock[] = allFiles.map(file => ({
        metadata: file.metadata,
        content: file.content
      }))

      const exportOptions: ExportOptions = {
        format: format as any,
        includePrivate: this.config.includePrivate
      }

      exportAll(ruleBlocks, config.path, false, exportOptions)

      return {
        format,
        filePath: path.join(config.path, `export.${format}`),
        success: true,
        rulesExported: ruleBlocks.length,
        warnings: []
      }
    } catch (error) {
      throw new ExportError(
        `Failed to export to ${format}`,
        format,
        [error instanceof Error ? error.message : String(error)]
      )
    }
  }

  private getTypeSpecificSuggestions(config: ConfigFile): Suggestion[] {
    const suggestions: Suggestion[] = []

    switch (config.type) {
      case 'skill':
        if (!config.metadata.expertise || config.metadata.expertise.length === 0) {
          suggestions.push({
            type: 'metadata',
            severity: 'high',
            message: 'Skills should define expertise areas',
            field: 'expertise',
            actionable: true
          })
        }
        break
        
      case 'subagent':
        if (!config.metadata.isolatedContext) {
          suggestions.push({
            type: 'metadata',
            severity: 'high',
            message: 'Subagents must have isolated context',
            field: 'isolatedContext',
            suggestedValue: 'true',
            actionable: true
          })
        }
        break
        
      case 'command':
        // eslint-disable-next-line no-case-declarations
        const commandMetadata = config.metadata as any
        if (!commandMetadata.trigger || !commandMetadata.trigger.startsWith('/')) {
          suggestions.push({
            type: 'metadata',
            severity: 'high',
            message: 'Commands must have a trigger starting with "/"',
            field: 'trigger',
            actionable: true
          })
        }
        break
    }

    return suggestions
  }

  private getStructuralSuggestions(config: ConfigFile): Suggestion[] {
    const suggestions: Suggestion[] = []

    // Check for missing descriptions
    if (!config.metadata.description) {
      suggestions.push({
        type: 'metadata',
        severity: 'low',
        message: 'Consider adding a description for better documentation',
        field: 'description',
        actionable: true
      })
    }

    // Check content length
    if (config.content.length < 50) {
      suggestions.push({
        type: 'content',
        severity: 'medium',
        message: 'Content seems very short - consider adding more detail',
        actionable: true
      })
    }

    return suggestions
  }
}