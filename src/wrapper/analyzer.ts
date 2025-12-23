import { 
  ProjectConfig, 
  ConfigFile, 
  ProjectAnalysis, 
  FileAnalysis,
  ProjectRecommendation,
  TypeDistribution
} from './types.js'
import { 
  RuleBlock, 
  AbstractionType, 
  AnyAbstractionMetadata 
} from '../types.js'
import { detectAbstractionType } from '../type-detector.js'
import { validateAnyAbstraction, ValidationResult } from '../validators.js'

// Core analysis result types
export interface AnalysisResult {
  health: HealthScore
  complexity: ComplexityScore
  capabilities: CapabilityAnalysis
  patterns: PatternDetection
  relationships: RelationshipMap
  recommendations: AnalysisRecommendation[]
}

export interface HealthScore {
  overall: number  // 0-100
  completeness: number
  consistency: number
  maintainability: number
  performance: number
  security: number
  breakdown: HealthBreakdown
}

export interface HealthBreakdown {
  completeness: {
    score: number
    factors: HealthFactor[]
  }
  consistency: {
    score: number
    factors: HealthFactor[]
  }
  maintainability: {
    score: number
    factors: HealthFactor[]
  }
  performance: {
    score: number
    factors: HealthFactor[]
  }
  security: {
    score: number
    factors: HealthFactor[]
  }
}

export interface HealthFactor {
  name: string
  score: number
  weight: number
  description: string
  impact: 'positive' | 'negative' | 'neutral'
}

export interface ComplexityScore {
  overall: 'low' | 'medium' | 'high' | 'very-high'
  cognitive: number  // Cognitive complexity score
  structural: number // Structural complexity
  dependencies: number // Dependency complexity
  factors: ComplexityFactor[]
  breakdown: ComplexityBreakdown
}

export interface ComplexityFactor {
  category: 'cognitive' | 'structural' | 'dependency'
  name: string
  score: number
  weight: number
  description: string
}

export interface ComplexityBreakdown {
  cognitive: {
    score: number
    contributors: ComplexityContributor[]
  }
  structural: {
    score: number
    contributors: ComplexityContributor[]
  }
  dependencies: {
    score: number
    contributors: ComplexityContributor[]
  }
}

export interface ComplexityContributor {
  aspect: string
  value: number
  impact: number
  description: string
}

export interface CapabilityAnalysis {
  primary: Capability[]
  secondary: Capability[]
  emergent: Capability[]
  missing: string[]
  coverage: CapabilityCoverage
}

export interface Capability {
  name: string
  category: CapabilityCategory
  confidence: number
  evidence: string[]
  impact: 'high' | 'medium' | 'low'
  novelty: 'standard' | 'innovative' | 'unique'
}

export type CapabilityCategory = 
  | 'automation' 
  | 'guidance' 
  | 'validation' 
  | 'transformation'
  | 'coordination'
  | 'optimization'
  | 'monitoring'
  | 'documentation'
  | 'security'
  | 'integration'

export interface CapabilityCoverage {
  automation: number
  guidance: number
  validation: number
  transformation: number
  coordination: number
  optimization: number
  monitoring: number
  documentation: number
  security: number
  integration: number
}

export interface PatternDetection {
  recognized: DetectedPattern[]
  antiPatterns: AntiPattern[]
  bestPractices: BestPractice[]
  innovations: Innovation[]
  templateMatches: TemplateMatch[]
}

export interface DetectedPattern {
  name: string
  category: 'architectural' | 'behavioral' | 'organizational' | 'security'
  confidence: number
  evidence: string[]
  implications: string[]
  quality: 'excellent' | 'good' | 'acceptable' | 'needs-improvement'
}

export interface AntiPattern {
  name: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  confidence: number
  evidence: string[]
  consequences: string[]
  mitigation: string[]
}

export interface BestPractice {
  name: string
  adherence: number // 0-100
  evidence: string[]
  gaps: string[]
  benefits: string[]
}

export interface Innovation {
  aspect: string
  novelty: number // 0-100
  value: 'high' | 'medium' | 'low'
  description: string
  potential: string[]
}

export interface TemplateMatch {
  template: string
  similarity: number
  adaptations: string[]
  gaps: string[]
}

export interface RelationshipMap {
  dependencies: DependencyRelation[]
  conflicts: ConflictRelation[]
  synergies: SynergyRelation[]
  hierarchies: HierarchyRelation[]
  clusters: ClusterRelation[]
}

export interface DependencyRelation {
  from: string
  to: string
  type: 'requires' | 'enhances' | 'triggers' | 'configures'
  strength: 'strong' | 'medium' | 'weak'
  nature: 'functional' | 'data' | 'behavioral' | 'temporal'
}

export interface ConflictRelation {
  entities: string[]
  type: 'scope-overlap' | 'trigger-conflict' | 'goal-contradiction' | 'resource-contention'
  severity: 'critical' | 'high' | 'medium' | 'low'
  resolution: string[]
}

export interface SynergyRelation {
  entities: string[]
  type: 'complementary' | 'amplifying' | 'enabling' | 'optimizing'
  potential: number // 0-100
  benefits: string[]
}

export interface HierarchyRelation {
  parent: string
  children: string[]
  type: 'composition' | 'specialization' | 'control' | 'data-flow'
}

export interface ClusterRelation {
  name: string
  members: string[]
  cohesion: number // 0-100
  purpose: string
  characteristics: string[]
}

export interface AnalysisRecommendation {
  type: 'improvement' | 'warning' | 'optimization' | 'security'
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: string
  title: string
  description: string
  action: RecommendedAction
  impact: ImpactAssessment
  confidence: number
  effort: EffortEstimate
}

export interface RecommendedAction {
  type: 'add' | 'remove' | 'modify' | 'restructure' | 'validate'
  target: string
  steps: ActionStep[]
  resources: string[]
}

export interface ActionStep {
  order: number
  description: string
  command?: string
  validation?: string
}

export interface ImpactAssessment {
  scope: 'local' | 'module' | 'project' | 'ecosystem'
  magnitude: 'minor' | 'moderate' | 'significant' | 'major'
  benefits: string[]
  risks: string[]
  metrics: string[]
}

export interface EffortEstimate {
  complexity: 'trivial' | 'simple' | 'moderate' | 'complex' | 'expert-required'
  timeEstimate: string
  skills: string[]
  dependencies: string[]
}

// Content analysis types
export interface ContentAnalysis {
  structure: StructureAnalysis
  semantics: SemanticAnalysis
  quality: QualityAnalysis
  patterns: ContentPatterns
}

export interface StructureAnalysis {
  lineCount: number
  sectionCount: number
  listCount: number
  codeBlockCount: number
  linkCount: number
  formatting: FormattingQuality
  organization: OrganizationQuality
}

export interface FormattingQuality {
  score: number // 0-100
  consistency: number
  readability: number
  standardCompliance: number
  issues: FormattingIssue[]
}

export interface FormattingIssue {
  type: string
  line?: number
  description: string
  severity: 'low' | 'medium' | 'high'
}

export interface OrganizationQuality {
  score: number // 0-100
  logicalFlow: number
  hierarchyClarity: number
  sectionBalance: number
  coherence: number
}

export interface SemanticAnalysis {
  purpose: PurposeAnalysis
  scope: ScopeAnalysis
  intent: IntentAnalysis
  domain: DomainAnalysis
}

export interface PurposeAnalysis {
  primary: string
  secondary: string[]
  clarity: number // 0-100
  specificity: number // 0-100
}

export interface ScopeAnalysis {
  breadth: 'narrow' | 'focused' | 'broad' | 'comprehensive'
  depth: 'surface' | 'moderate' | 'deep' | 'expert'
  boundaries: string[]
  overlaps: string[]
}

export interface IntentAnalysis {
  directive: number // How directive/prescriptive (0-100)
  guidance: number // How much guidance it provides (0-100)
  automation: number // How much it automates (0-100)
  knowledge: number // How much knowledge it encodes (0-100)
}

export interface DomainAnalysis {
  primary: string
  secondary: string[]
  expertise: ExpertiseLevel
  terminology: TerminologyAnalysis
}

export interface ExpertiseLevel {
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  confidence: number
  indicators: string[]
}

export interface TerminologyAnalysis {
  technicalDensity: number // 0-100
  domainSpecific: string[]
  commonTerms: string[]
  ambiguousTerms: string[]
}

export interface QualityAnalysis {
  completeness: number // 0-100
  accuracy: number // 0-100
  currency: number // How up-to-date (0-100)
  consistency: number // 0-100
  actionability: number // How actionable (0-100)
  issues: QualityIssue[]
}

export interface QualityIssue {
  type: 'incomplete' | 'outdated' | 'ambiguous' | 'inconsistent' | 'vague'
  description: string
  location?: string
  severity: 'low' | 'medium' | 'high'
  suggestion?: string
}

export interface ContentPatterns {
  instructional: InstructionalPattern[]
  procedural: ProceduralPattern[]
  conditional: ConditionalPattern[]
  referential: ReferentialPattern[]
}

export interface InstructionalPattern {
  type: 'command' | 'guideline' | 'principle' | 'rule'
  strength: 'weak' | 'medium' | 'strong'
  scope: string
  content: string
}

export interface ProceduralPattern {
  type: 'sequence' | 'workflow' | 'checklist' | 'decision-tree'
  steps: number
  complexity: 'simple' | 'moderate' | 'complex'
  completeness: number
}

export interface ConditionalPattern {
  type: 'if-then' | 'when-do' | 'unless-avoid' | 'context-specific'
  conditions: string[]
  actions: string[]
  complexity: number
}

export interface ReferentialPattern {
  type: 'cross-reference' | 'example' | 'citation' | 'template'
  target: string
  relationship: string
  strength: number
}

// Abstract mapping interface for the Abstract Map feature
export interface AbstractionMap {
  abstractions: MappedAbstraction[]
  relationships: MappedRelationship[]
  clusters: AbstractionCluster[]
  metrics: AbstractionMetrics
}

export interface MappedAbstraction {
  id: string
  type: AbstractionType
  name: string
  purpose: string
  capabilities: string[]
  complexity: number
  health: number
  position: AbstractionPosition
}

export interface MappedRelationship {
  from: string
  to: string
  type: string
  strength: number
  nature: string
}

export interface AbstractionCluster {
  id: string
  name: string
  members: string[]
  cohesion: number
  purpose: string
}

export interface AbstractionMetrics {
  totalAbstractions: number
  typeDistribution: Record<AbstractionType, number>
  complexityDistribution: Record<string, number>
  healthDistribution: Record<string, number>
  relationshipDensity: number
}

export interface AbstractionPosition {
  x: number
  y: number
  cluster?: string
}

/**
 * Advanced configuration analyzer that provides comprehensive insights
 * into project health, complexity, capabilities, and relationships
 */
export class ConfigAnalyzer {
  private readonly knownPatterns: Map<string, DetectedPattern>
  private readonly antiPatterns: Map<string, AntiPattern>
  private readonly bestPractices: Map<string, BestPractice>
  private readonly capabilityMappings: Map<string, CapabilityCategory>
  
  constructor() {
    this.knownPatterns = this.initializeKnownPatterns()
    this.antiPatterns = this.initializeAntiPatterns()
    this.bestPractices = this.initializeBestPractices()
    this.capabilityMappings = this.initializeCapabilityMappings()
  }

  /**
   * Analyzes an entire project for health, patterns, and recommendations
   */
  analyzeProject(project: ProjectConfig): ProjectAnalysis {
    const files = project.rules.concat(project.skills, project.subagents, project.commands)
    const fileAnalyses = files.map(file => this.analyzeFile(file))
    
    // Calculate project-level metrics
    const healthScore = this.calculateProjectHealth(fileAnalyses)
    const typeDistribution = this.calculateTypeDistribution(files)
    
    // Generate project-level recommendations
    const recommendations = this.generateProjectRecommendations(fileAnalyses, project)
    
    // Calculate summary metrics
    const totalRules = project.rules.length
    const errorCount = fileAnalyses.reduce((sum, analysis) => sum + analysis.issues.length, 0)
    const warningCount = fileAnalyses.reduce((sum, analysis) => sum + analysis.warnings.length, 0)
    
    return {
      summary: {
        totalFiles: files.length,
        totalRules,
        totalSkills: project.skills.length,
        totalSubagents: project.subagents.length,
        totalCommands: project.commands.length,
        errorCount,
        warningCount,
        healthScore
      },
      files: fileAnalyses,
      recommendations,
      typeDistribution
    }
  }

  /**
   * Analyzes a single configuration file comprehensively
   */
  analyzeFile(config: ConfigFile): FileAnalysis {
    // Perform validation
    const validation = validateAnyAbstraction(config.metadata, config.content)
    
    // Detect abstraction type with confidence
    const ruleBlock: RuleBlock = { 
      metadata: config.metadata, 
      content: config.content 
    }
    const typeInfo = detectAbstractionType(ruleBlock)
    
    // Check for abstraction mismatch
    const abstractionMismatch = this.detectAbstractionMismatch(config, typeInfo)
    
    // Count rules in content
    const ruleCount = this.countRules(config)
    
    return {
      filePath: config.filePath,
      detectedType: typeInfo.type,
      confidence: typeInfo.confidence,
      issues: validation.errors,
      warnings: validation.warnings,
      suggestions: validation.suggestions,
      abstractionMismatch,
      originalFormat: config.originalFormat,
      ruleCount
    }
  }

  /**
   * Detects and classifies abstractions with detailed analysis
   */
  detectAbstractions(rules: RuleBlock[]): AbstractionMap {
    const mappedAbstractions: MappedAbstraction[] = []
    const relationships: MappedRelationship[] = []
    const clusters: AbstractionCluster[] = []
    
    // Analyze each rule block
    rules.forEach((rule, index) => {
      const typeInfo = detectAbstractionType(rule)
      const health = this.calculateAbstractionHealth(rule)
      const complexity = this.calculateAbstractionComplexity(rule)
      const capabilities = this.extractCapabilities(rule)
      
      mappedAbstractions.push({
        id: rule.metadata.id,
        type: typeInfo.type,
        name: rule.metadata.description || `${typeInfo.type}-${index}`,
        purpose: this.extractPurpose(rule),
        capabilities: capabilities.map(c => c.name),
        complexity,
        health,
        position: this.calculatePosition(rule, index, rules.length)
      })
    })
    
    // Analyze relationships
    this.analyzeAbstractionRelationships(rules, mappedAbstractions, relationships)
    
    // Create clusters
    this.createAbstractionClusters(mappedAbstractions, relationships, clusters)
    
    // Calculate metrics
    const metrics = this.calculateAbstractionMetrics(mappedAbstractions, relationships)
    
    return {
      abstractions: mappedAbstractions,
      relationships,
      clusters,
      metrics
    }
  }

  /**
   * Analyzes the capabilities provided by a configuration
   */
  analyzeCapabilities(config: ConfigFile): CapabilityAnalysis {
    const ruleBlock: RuleBlock = {
      metadata: config.metadata,
      content: config.content
    }
    
    const capabilities = this.extractCapabilities(ruleBlock)
    const coverage = this.calculateCapabilityCoverage(capabilities)
    const missing = this.identifyMissingCapabilities(config, capabilities)
    
    return {
      primary: capabilities.filter(c => c.impact === 'high'),
      secondary: capabilities.filter(c => c.impact === 'medium'),
      emergent: capabilities.filter(c => c.impact === 'low'),
      missing,
      coverage
    }
  }

  /**
   * Suggests improvements based on comprehensive analysis
   */
  suggestImprovements(analysis: FileAnalysis): AnalysisRecommendation[] {
    const recommendations: AnalysisRecommendation[] = []
    
    // Convert validation issues to recommendations
    analysis.issues.forEach(issue => {
      recommendations.push(this.createRecommendationFromIssue(issue, 'critical'))
    })
    
    analysis.warnings.forEach(warning => {
      recommendations.push(this.createRecommendationFromIssue(warning, 'medium'))
    })
    
    // Add type-specific recommendations
    recommendations.push(...this.getTypeSpecificRecommendations(analysis))
    
    // Add complexity-based recommendations
    recommendations.push(...this.getComplexityRecommendations(analysis))
    
    // Add best practice recommendations
    recommendations.push(...this.getBestPracticeRecommendations(analysis))
    
    return recommendations.sort((a, b) => this.priorityValue(b.priority) - this.priorityValue(a.priority))
  }

  /**
   * Analyzes content structure, semantics, and quality
   */
  analyzeContent(content: string): ContentAnalysis {
    return {
      structure: this.analyzeStructure(content),
      semantics: this.analyzeSemantics(content),
      quality: this.analyzeQuality(content),
      patterns: this.analyzeContentPatterns(content)
    }
  }

  /**
   * Detects patterns and anti-patterns in configuration content
   */
  detectPatterns(content: string): PatternDetection {
    return {
      recognized: this.detectRecognizedPatterns(content),
      antiPatterns: this.detectAntiPatternsInContent(content),
      bestPractices: this.assessBestPractices(content),
      innovations: this.detectInnovations(content),
      templateMatches: this.findTemplateMatches(content)
    }
  }

  /**
   * Calculates complexity score with detailed breakdown
   */
  scoreComplexity(config: ConfigFile): ComplexityScore {
    const ruleBlock: RuleBlock = {
      metadata: config.metadata,
      content: config.content
    }
    
    const cognitive = this.calculateCognitiveComplexity(ruleBlock)
    const structural = this.calculateStructuralComplexity(ruleBlock)
    const dependencies = this.calculateDependencyComplexity(ruleBlock)
    
    const overall = this.determineOverallComplexity(cognitive, structural, dependencies)
    
    return {
      overall,
      cognitive,
      structural,
      dependencies,
      factors: this.getComplexityFactors(cognitive, structural, dependencies),
      breakdown: this.getComplexityBreakdown(cognitive, structural, dependencies)
    }
  }

  // Private helper methods

  private initializeKnownPatterns(): Map<string, DetectedPattern> {
    const patterns = new Map<string, DetectedPattern>()
    
    patterns.set('skill-expertise', {
      name: 'Skill Expertise Pattern',
      category: 'architectural',
      confidence: 0.8,
      evidence: ['expert', 'expertise', 'testing expert', 'knowledge'],
      implications: ['Clear specialization', 'Reusable knowledge'],
      quality: 'good'
    })
    
    patterns.set('command-trigger', {
      name: 'Command Trigger Pattern',
      category: 'behavioral',
      confidence: 0.9,
      evidence: ['slash trigger', 'user invocation'],
      implications: ['Clear user interface', 'Defined entry point'],
      quality: 'excellent'
    })
    
    patterns.set('subagent-isolation', {
      name: 'SubAgent Isolation Pattern',
      category: 'architectural',
      confidence: 0.85,
      evidence: ['isolated context', 'model specification'],
      implications: ['Clear boundaries', 'Controlled execution'],
      quality: 'good'
    })
    
    return patterns
  }

  private initializeAntiPatterns(): Map<string, AntiPattern> {
    const antiPatterns = new Map<string, AntiPattern>()
    
    antiPatterns.set('skill-delegation', {
      name: 'Skill Delegation Anti-Pattern',
      severity: 'high',
      confidence: 0.8,
      evidence: ['delegation', 'delegate', 'other agents', 'always applies'],
      consequences: ['Breaks skill paradigm', 'Creates confusion'],
      mitigation: ['Convert to SubAgent', 'Remove delegation logic']
    })
    
    antiPatterns.set('command-always-apply', {
      name: 'Command Always-Apply Anti-Pattern',
      severity: 'critical',
      confidence: 0.9,
      evidence: ['alwaysApply in command', 'automatic execution patterns'],
      consequences: ['Breaks command paradigm', 'Unexpected behavior'],
      mitigation: ['Convert to Rule', 'Remove automatic flags']
    })
    
    return antiPatterns
  }

  private initializeBestPractices(): Map<string, BestPractice> {
    const practices = new Map<string, BestPractice>()
    
    practices.set('clear-metadata', {
      name: 'Clear Metadata',
      adherence: 0,
      evidence: [],
      gaps: [],
      benefits: ['Better organization', 'Easier maintenance', 'Clearer intent']
    })
    
    practices.set('specific-scope', {
      name: 'Specific Scope Definition',
      adherence: 0,
      evidence: [],
      gaps: [],
      benefits: ['Reduced conflicts', 'Predictable behavior', 'Better targeting']
    })
    
    return practices
  }

  private initializeCapabilityMappings(): Map<string, CapabilityCategory> {
    const mappings = new Map<string, CapabilityCategory>()
    
    // Map keywords to capability categories
    mappings.set('automate', 'automation')
    mappings.set('guide', 'guidance')
    mappings.set('validate', 'validation')
    mappings.set('transform', 'transformation')
    mappings.set('coordinate', 'coordination')
    mappings.set('optimize', 'optimization')
    mappings.set('monitor', 'monitoring')
    mappings.set('document', 'documentation')
    mappings.set('secure', 'security')
    mappings.set('integrate', 'integration')
    
    return mappings
  }

  private calculateProjectHealth(fileAnalyses: FileAnalysis[]): number {
    if (fileAnalyses.length === 0) return 100
    
    const totalIssues = fileAnalyses.reduce((sum, analysis) => 
      sum + analysis.issues.length + analysis.warnings.length, 0
    )
    
    const baseScore = Math.max(0, 100 - (totalIssues * 5))
    
    // Boost for high confidence type detection
    const avgConfidence = fileAnalyses.reduce((sum, analysis) => 
      sum + analysis.confidence, 0
    ) / fileAnalyses.length
    
    const confidenceBoost = avgConfidence * 10
    
    return Math.min(100, baseScore + confidenceBoost)
  }

  private calculateTypeDistribution(files: ConfigFile[]): TypeDistribution {
    const distribution: TypeDistribution = {
      rules: 0,
      skills: 0,
      subagents: 0,
      commands: 0,
      mixed: 0,
      unknown: 0
    }
    
    files.forEach(file => {
      const typeInfo = detectAbstractionType({
        metadata: file.metadata,
        content: file.content
      })
      
      if (typeInfo.confidence > 0.7) {
        distribution[`${typeInfo.type}s` as keyof TypeDistribution]++
      } else if (typeInfo.confidence > 0.3) {
        distribution.mixed++
      } else {
        distribution.unknown++
      }
    })
    
    return distribution
  }

  private generateProjectRecommendations(
    fileAnalyses: FileAnalysis[], 
    project: ProjectConfig
  ): ProjectRecommendation[] {
    const recommendations: ProjectRecommendation[] = []
    
    // Check for overall project health
    const criticalIssues = fileAnalyses.filter(analysis => 
      analysis.issues.some(issue => issue.severity === 'error')
    )
    
    if (criticalIssues.length > fileAnalyses.length * 0.2) {
      recommendations.push({
        code: 'PROJECT_HIGH_ERROR_RATE',
        severity: 'high',
        title: 'High Error Rate Detected',
        description: `${criticalIssues.length} files have critical issues that need attention`,
        affectedFiles: criticalIssues.map(analysis => analysis.filePath),
        actionable: true,
        suggestedAction: 'Run validation and fix critical errors before proceeding'
      })
    }
    
    // Check for type distribution balance
    const distribution = this.calculateTypeDistribution(
      project.rules.concat(project.skills, project.subagents, project.commands)
    )
    
    if (distribution.rules > distribution.skills + distribution.subagents + distribution.commands) {
      recommendations.push({
        code: 'PROJECT_RULE_HEAVY',
        severity: 'medium',
        title: 'Rule-Heavy Configuration',
        description: 'Consider converting some rules to more specific abstraction types',
        affectedFiles: [],
        actionable: true,
        suggestedAction: 'Review rules for skill, command, or subagent patterns'
      })
    }
    
    return recommendations
  }

  private countRules(config: ConfigFile): number {
    const content = config.content
    
    // Count explicit rule patterns
    const rulePatterns = [
      /^Rule \d+:/gim,
      /^- Rule:/gim,
      /^\d+\./gim,
      /^[*-]\s*Always/gim,
      /^[*-]\s*Never/gim,
      /^[*-]\s*When/gim,
      /^[*-]\s*You (are|should|must)/gim
    ]
    
    let ruleCount = 0
    for (const pattern of rulePatterns) {
      const matches = content.match(pattern)
      if (matches) {
        ruleCount += matches.length
      }
    }
    
    // If no explicit rules found, return 1 as minimum for any content
    return Math.max(1, ruleCount)
  }

  private detectAbstractionMismatch(config: ConfigFile, typeInfo: any) {
    if (config.metadata.type && config.metadata.type !== typeInfo.type && typeInfo.confidence > 0.7) {
      return {
        declaredType: config.metadata.type,
        detectedType: typeInfo.type,
        confidence: typeInfo.confidence,
        reasons: typeInfo.indicators
      }
    }
    return undefined
  }

  private calculateAbstractionHealth(rule: RuleBlock): number {
    const validation = validateAnyAbstraction(rule.metadata, rule.content)
    const errorPenalty = validation.errors.length * 20
    const warningPenalty = validation.warnings.length * 5
    
    return Math.max(0, 100 - errorPenalty - warningPenalty)
  }

  private calculateAbstractionComplexity(rule: RuleBlock): number {
    let complexity = 0
    
    // Content length factor
    complexity += Math.min(rule.content.length / 1000, 5)
    
    // Metadata complexity
    const metadataFields = Object.keys(rule.metadata).length
    complexity += metadataFields * 0.5
    
    // Dependencies
    if (rule.metadata.dependencies) {
      complexity += rule.metadata.dependencies.length
    }
    
    return Math.min(complexity, 10)
  }

  private extractCapabilities(rule: RuleBlock): Capability[] {
    const capabilities: Capability[] = []
    const content = rule.content.toLowerCase()
    
    // Analyze content for capability indicators
    for (const [keyword, category] of this.capabilityMappings) {
      if (content.includes(keyword)) {
        capabilities.push({
          name: `${keyword} capability`,
          category,
          confidence: 0.7,
          evidence: [`Content contains "${keyword}"`],
          impact: 'medium',
          novelty: 'standard'
        })
      }
    }
    
    return capabilities
  }

  private calculatePosition(rule: RuleBlock, index: number, total: number): AbstractionPosition {
    // Simple circular layout
    const angle = (index / total) * 2 * Math.PI
    return {
      x: 50 + 40 * Math.cos(angle),
      y: 50 + 40 * Math.sin(angle)
    }
  }

  private analyzeAbstractionRelationships(
    rules: RuleBlock[],
    abstractions: MappedAbstraction[],
    relationships: MappedRelationship[]
  ): void {
    // Analyze dependencies declared in metadata
    rules.forEach(rule => {
      if (rule.metadata.dependencies) {
        rule.metadata.dependencies.forEach(depId => {
          relationships.push({
            from: rule.metadata.id,
            to: depId,
            type: 'requires',
            strength: 0.8,
            nature: 'functional'
          })
        })
      }
    })
  }

  private createAbstractionClusters(
    abstractions: MappedAbstraction[],
    relationships: MappedRelationship[],
    clusters: AbstractionCluster[]
  ): void {
    // Group by abstraction type
    const typeGroups = new Map<string, MappedAbstraction[]>()
    abstractions.forEach(abs => {
      if (!typeGroups.has(abs.type)) {
        typeGroups.set(abs.type, [])
      }
      typeGroups.get(abs.type)!.push(abs)
    })
    
    typeGroups.forEach((members, type) => {
      if (members.length > 1) {
        clusters.push({
          id: `${type}-cluster`,
          name: `${type.charAt(0).toUpperCase() + type.slice(1)} Cluster`,
          members: members.map(m => m.id),
          cohesion: 0.8,
          purpose: `Groups all ${type} abstractions`
        })
      }
    })
  }

  private calculateAbstractionMetrics(
    abstractions: MappedAbstraction[],
    relationships: MappedRelationship[]
  ): AbstractionMetrics {
    const typeDistribution: Record<AbstractionType, number> = {
      skill: 0,
      subagent: 0,
      command: 0,
      rule: 0
    }
    
    abstractions.forEach(abs => {
      typeDistribution[abs.type]++
    })
    
    return {
      totalAbstractions: abstractions.length,
      typeDistribution,
      complexityDistribution: {
        low: abstractions.filter(a => a.complexity <= 3).length,
        medium: abstractions.filter(a => a.complexity > 3 && a.complexity <= 6).length,
        high: abstractions.filter(a => a.complexity > 6).length
      },
      healthDistribution: {
        excellent: abstractions.filter(a => a.health >= 90).length,
        good: abstractions.filter(a => a.health >= 70 && a.health < 90).length,
        fair: abstractions.filter(a => a.health >= 50 && a.health < 70).length,
        poor: abstractions.filter(a => a.health < 50).length
      },
      relationshipDensity: relationships.length / Math.max(abstractions.length, 1)
    }
  }

  private calculateCapabilityCoverage(capabilities: Capability[]): CapabilityCoverage {
    const coverage: CapabilityCoverage = {
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
      coverage[cap.category] = Math.max(coverage[cap.category], cap.confidence)
    })
    
    return coverage
  }

  private identifyMissingCapabilities(config: ConfigFile, capabilities: Capability[]): string[] {
    const missing: string[] = []
    const presentCategories = new Set(capabilities.map(c => c.category))
    
    // Check for obvious missing capabilities based on abstraction type
    const typeInfo = detectAbstractionType({
      metadata: config.metadata,
      content: config.content
    })
    
    switch (typeInfo.type) {
      case 'skill':
        if (!presentCategories.has('guidance')) {
          missing.push('guidance - skills should provide guidance')
        }
        break
      case 'command':
        if (!presentCategories.has('automation')) {
          missing.push('automation - commands should automate tasks')
        }
        break
      case 'subagent':
        if (!presentCategories.has('coordination')) {
          missing.push('coordination - subagents should coordinate tasks')
        }
        break
    }
    
    return missing
  }

  private createRecommendationFromIssue(
    issue: any, 
    priority: 'low' | 'medium' | 'high' | 'critical'
  ): AnalysisRecommendation {
    return {
      type: 'improvement',
      priority,
      category: 'validation',
      title: issue.message,
      description: issue.message,
      action: {
        type: 'modify',
        target: issue.field || 'configuration',
        steps: [
          {
            order: 1,
            description: 'Address the validation issue',
            validation: 'Run validation again to confirm fix'
          }
        ],
        resources: ['Validation documentation']
      },
      impact: {
        scope: 'local',
        magnitude: priority === 'critical' ? 'major' : 'moderate',
        benefits: ['Improved validation', 'Better compliance'],
        risks: ['None'],
        metrics: ['Validation success rate']
      },
      confidence: 0.9,
      effort: {
        complexity: 'simple',
        timeEstimate: '5-15 minutes',
        skills: ['Configuration editing'],
        dependencies: []
      }
    }
  }

  private getTypeSpecificRecommendations(analysis: FileAnalysis): AnalysisRecommendation[] {
    // Implementation depends on detected type
    return []
  }

  private getComplexityRecommendations(analysis: FileAnalysis): AnalysisRecommendation[] {
    // Analyze complexity and suggest improvements
    return []
  }

  private getBestPracticeRecommendations(analysis: FileAnalysis): AnalysisRecommendation[] {
    // Check against best practices
    return []
  }

  private priorityValue(priority: string): number {
    switch (priority) {
      case 'critical': return 4
      case 'high': return 3
      case 'medium': return 2
      case 'low': return 1
      default: return 0
    }
  }

  private analyzeStructure(content: string): StructureAnalysis {
    const lines = content.split('\n')
    const codeBlocks = content.match(/```[\s\S]*?```/g) || []
    const links = content.match(/\[.*?\]\(.*?\)/g) || []
    const lists = content.match(/^\s*[-*]\s+/gm) || []
    
    return {
      lineCount: lines.length,
      sectionCount: (content.match(/^#+ /gm) || []).length,
      listCount: lists.length,
      codeBlockCount: codeBlocks.length,
      linkCount: links.length,
      formatting: this.analyzeFormatting(content, lines),
      organization: this.analyzeOrganization(content, lines)
    }
  }

  private analyzeSemantics(content: string): SemanticAnalysis {
    return {
      purpose: this.analyzePurpose(content),
      scope: this.analyzeScope(content),
      intent: this.analyzeIntent(content),
      domain: this.analyzeDomain(content)
    }
  }

  private analyzeQuality(content: string): QualityAnalysis {
    const issues: QualityIssue[] = []
    
    const completeness = 100
    const accuracy = 90 // Default high, would need domain knowledge to assess
    const currency = 85 // Default, would need temporal analysis
    const consistency = this.assessConsistency(content)
    const actionability = this.assessActionability(content)
    
    return {
      completeness,
      accuracy,
      currency,
      consistency,
      actionability,
      issues
    }
  }

  private analyzeContentPatterns(content: string): ContentPatterns {
    return {
      instructional: this.findInstructionalPatterns(content),
      procedural: this.findProceduralPatterns(content),
      conditional: this.findConditionalPatterns(content),
      referential: this.findReferentialPatterns(content)
    }
  }

  // Additional helper methods would be implemented here...
  private analyzeFormatting(content: string, lines: string[]): FormattingQuality {
    return {
      score: 85,
      consistency: 80,
      readability: 90,
      standardCompliance: 85,
      issues: []
    }
  }

  private analyzeOrganization(content: string, lines: string[]): OrganizationQuality {
    return {
      score: 80,
      logicalFlow: 75,
      hierarchyClarity: 85,
      sectionBalance: 80,
      coherence: 85
    }
  }

  private analyzePurpose(content: string): PurposeAnalysis {
    return {
      primary: 'Configuration guidance',
      secondary: [],
      clarity: 80,
      specificity: 75
    }
  }

  private analyzeScope(content: string): ScopeAnalysis {
    return {
      breadth: 'focused',
      depth: 'moderate',
      boundaries: [],
      overlaps: []
    }
  }

  private analyzeIntent(content: string): IntentAnalysis {
    return {
      directive: 70,
      guidance: 80,
      automation: 30,
      knowledge: 85
    }
  }

  private analyzeDomain(content: string): DomainAnalysis {
    return {
      primary: 'Software Configuration',
      secondary: [],
      expertise: {
        level: 'intermediate',
        confidence: 0.7,
        indicators: []
      },
      terminology: {
        technicalDensity: 60,
        domainSpecific: [],
        commonTerms: [],
        ambiguousTerms: []
      }
    }
  }

  private extractPurpose(rule: RuleBlock): string {
    return rule.metadata.description || 'Configuration rule'
  }

  private detectRecognizedPatterns(content: string): DetectedPattern[] {
    const patterns: DetectedPattern[] = []
    
    for (const [key, pattern] of this.knownPatterns) {
      if (this.matchesPattern(content, pattern)) {
        patterns.push({ ...pattern })
      }
    }
    
    return patterns
  }

  private detectAntiPatternsInContent(content: string): AntiPattern[] {
    const antiPatterns: AntiPattern[] = []
    
    for (const [key, pattern] of this.antiPatterns) {
      if (this.matchesAntiPattern(content, pattern)) {
        antiPatterns.push({ ...pattern })
      }
    }
    
    return antiPatterns
  }

  private assessBestPractices(content: string): BestPractice[] {
    const practices: BestPractice[] = []
    
    for (const [key, practice] of this.bestPractices) {
      const assessment = this.assessBestPractice(content, practice)
      practices.push(assessment)
    }
    
    return practices
  }

  private detectInnovations(content: string): Innovation[] {
    // Detect novel or innovative aspects
    return []
  }

  private findTemplateMatches(content: string): TemplateMatch[] {
    // Match against known templates
    return []
  }

  private calculateCognitiveComplexity(rule: RuleBlock): number {
    let complexity = 1 // Base complexity
    
    const content = rule.content.toLowerCase()
    
    // Conditional statements increase complexity
    const conditionals = ['if', 'when', 'unless', 'while', 'for'].reduce((count, keyword) => {
      return count + (content.match(new RegExp(`\\b${keyword}\\b`, 'g')) || []).length
    }, 0)
    
    complexity += conditionals
    
    // Nested structures
    const nesting = (content.match(/\{[^}]*\{/g) || []).length
    complexity += nesting * 2
    
    return complexity
  }

  private calculateStructuralComplexity(rule: RuleBlock): number {
    const content = rule.content
    const lines = content.split('\n').filter(line => line.trim() !== '')
    const sections = (content.match(/^#+ /gm) || []).length
    const totalLength = content.length
    
    // Consider both line count and total content length
    const lineComplexity = lines.length * 0.1
    const lengthComplexity = totalLength / 1000 // 1 point per 1000 chars
    const sectionComplexity = sections * 2
    
    return lineComplexity + lengthComplexity + sectionComplexity
  }

  private calculateDependencyComplexity(rule: RuleBlock): number {
    const deps = rule.metadata.dependencies || []
    return deps.length * 2
  }

  private determineOverallComplexity(cognitive: number, structural: number, dependencies: number): 'low' | 'medium' | 'high' | 'very-high' {
    const total = cognitive + structural + dependencies
    
    if (total <= 5) return 'low'
    if (total <= 15) return 'medium'
    if (total <= 30) return 'high'
    return 'very-high'
  }

  private getComplexityFactors(cognitive: number, structural: number, dependencies: number): ComplexityFactor[] {
    return [
      {
        category: 'cognitive',
        name: 'Cognitive Load',
        score: cognitive,
        weight: 0.4,
        description: 'Mental effort required to understand'
      },
      {
        category: 'structural',
        name: 'Structural Complexity',
        score: structural,
        weight: 0.3,
        description: 'Organization and size complexity'
      },
      {
        category: 'dependency',
        name: 'Dependency Complexity',
        score: dependencies,
        weight: 0.3,
        description: 'External dependency complexity'
      }
    ]
  }

  private getComplexityBreakdown(cognitive: number, structural: number, dependencies: number): ComplexityBreakdown {
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

  private matchesPattern(content: string, pattern: DetectedPattern): boolean {
    // Simple heuristic - would be more sophisticated in practice
    return pattern.evidence.some(evidence => 
      content.toLowerCase().includes(evidence.toLowerCase())
    )
  }

  private matchesAntiPattern(content: string, pattern: AntiPattern): boolean {
    return pattern.evidence.some(evidence => 
      content.toLowerCase().includes(evidence.toLowerCase())
    )
  }

  private assessBestPractice(content: string, practice: BestPractice): BestPractice {
    // Assess adherence to best practice
    let adherence = 50 // Default
    const evidence: string[] = []
    const gaps: string[] = []
    
    if (practice.name === 'Clear Metadata') {
      // Check for metadata completeness
      if (content.includes('description')) {
        adherence += 25
        evidence.push('Has description')
      } else {
        gaps.push('Missing description')
      }
    }
    
    return {
      ...practice,
      adherence: Math.min(adherence, 100),
      evidence,
      gaps
    }
  }

  private assessConsistency(content: string): number {
    // Assess consistency in formatting, naming, etc.
    return 85
  }

  private assessActionability(content: string): number {
    // How actionable is the content
    const actionWords = ['run', 'execute', 'use', 'apply', 'configure', 'set', 'enable']
    const actionCount = actionWords.reduce((count, word) => {
      return count + (content.toLowerCase().match(new RegExp(`\\b${word}\\b`, 'g')) || []).length
    }, 0)
    
    return Math.min(actionCount * 10, 100)
  }

  private findInstructionalPatterns(content: string): InstructionalPattern[] {
    return []
  }

  private findProceduralPatterns(content: string): ProceduralPattern[] {
    return []
  }

  private findConditionalPatterns(content: string): ConditionalPattern[] {
    return []
  }

  private findReferentialPatterns(content: string): ReferentialPattern[] {
    return []
  }
}