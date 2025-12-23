import { 
  RuleBlock, 
  AnyAbstractionMetadata, 
  AbstractionType,
  AbstractionTypeInfo
} from '../types.js'
import { ValidationError as ValidatorError, ValidationWarning, ValidationSuggestion } from '../validators.js'

// Core wrapper configuration
export interface SyncConfig {
  skipValidation?: boolean
  includePrivate?: boolean
  autoDetectTypes?: boolean
  strictMode?: boolean
  outputFormats?: string[]
}

// Enhanced project representation with abstraction awareness
export interface ProjectConfig {
  path: string
  rules: ConfigFile[]
  skills: ConfigFile[]
  subagents: ConfigFile[]
  commands: ConfigFile[]
  metadata: ProjectMetadata
}

export interface ProjectMetadata {
  name?: string
  version?: string
  totalFiles: number
  detectedTypes: Record<AbstractionType, number>
  issues: ValidatorError[]
  lastAnalyzed: Date
  configuration?: SyncConfig
}

// Enhanced file representation with validation and suggestions
export interface ConfigFile {
  filePath: string
  type: AbstractionType
  metadata: AnyAbstractionMetadata
  content: string
  raw?: string
  detectedIssues?: ValidatorError[]
  suggestions?: ValidationSuggestion[]
  typeDetection?: AbstractionTypeInfo
  originalFormat?: string
  ruleCount?: number
}

// Project analysis results
export interface ProjectAnalysis {
  summary: ProjectSummary
  files: FileAnalysis[]
  recommendations: ProjectRecommendation[]
  typeDistribution: TypeDistribution
}

export interface ProjectSummary {
  totalFiles: number
  totalRules: number
  totalSkills: number
  totalSubagents: number
  totalCommands: number
  errorCount: number
  warningCount: number
  healthScore: number // 0-100 based on validation results
}

export interface FileAnalysis {
  filePath: string
  detectedType: AbstractionType
  confidence: number
  issues: ValidatorError[]
  warnings: ValidationWarning[]
  suggestions: ValidationSuggestion[]
  abstractionMismatch?: AbstractionMismatch
  originalFormat?: string
  ruleCount?: number
}

export interface AbstractionMismatch {
  declaredType?: AbstractionType
  detectedType: AbstractionType
  confidence: number
  reasons: string[]
}

export interface TypeDistribution {
  rules: number
  skills: number
  subagents: number
  commands: number
  mixed: number
  unknown: number
}

export interface ProjectRecommendation {
  code: string
  severity: 'high' | 'medium' | 'low'
  title: string
  description: string
  affectedFiles: string[]
  actionable: boolean
  suggestedAction?: string
}

// Export operation results
export interface ExportResult {
  format: string
  filePath: string
  success: boolean
  error?: string
  rulesExported: number
  warnings: string[]
}

// Error classes for the wrapper API
export class SyncError extends Error {
  constructor(
    message: string, 
    public readonly details: string[], 
    public readonly code: string
  ) {
    super(message)
    this.name = 'SyncError'
  }
}

export class WrapperValidationError extends Error {
  constructor(
    message: string, 
    public readonly issues: ValidatorError[]
  ) {
    super(message)
    this.name = 'WrapperValidationError'
  }
}

export class ImportError extends SyncError {
  constructor(message: string, public readonly filePath: string, details: string[] = []) {
    super(message, details, 'IMPORT_ERROR')
    this.name = 'ImportError'
  }
}

export class ExportError extends SyncError {
  constructor(message: string, public readonly format: string, details: string[] = []) {
    super(message, details, 'EXPORT_ERROR')
    this.name = 'ExportError'
  }
}

export class AnalysisError extends SyncError {
  constructor(message: string, public readonly target: string, details: string[] = []) {
    super(message, details, 'ANALYSIS_ERROR')
    this.name = 'AnalysisError'
  }
}

// Validation result wrapper that aligns with existing validator types
export interface ValidationResult {
  valid: boolean
  errors: ValidatorError[]
  warnings: ValidationWarning[]
  suggestions: ValidationSuggestion[]
}

// Suggestion interfaces for improvement recommendations
export interface Suggestion {
  type: 'structure' | 'content' | 'metadata' | 'validation'
  severity: 'high' | 'medium' | 'low'
  message: string
  field?: string
  suggestedValue?: string
  actionable: boolean
}

// Advanced analysis types for ConfigAnalyzer
export interface AnalysisResult {
  healthScore: HealthScore
  complexityScore: ComplexityScore
  capabilities: CapabilityAnalysis
  patterns: PatternDetection
  relationships: RelationshipMap
  contentAnalysis: ContentAnalysis
  abstractionMap: AbstractionMap
  timestamp: Date
  version: string
}

export interface HealthScore {
  overall: number // 0-100
  categories: {
    structure: number
    validation: number
    consistency: number
    completeness: number
    bestPractices: number
  }
  factors: HealthFactor[]
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
  cognitive: number
  structural: number
  dependencies: number
  factors: ComplexityFactor[]
}

export interface ComplexityFactor {
  name: string
  score: number
  weight: number
  description: string
  category: 'cognitive' | 'structural' | 'dependency'
}

export interface CapabilityAnalysis {
  primary: Capability[]
  secondary: Capability[]
  coverage: Record<string, number>
  missing: string[]
  gaps: CapabilityGap[]
}

export interface Capability {
  name: string
  category: string
  confidence: number
  evidence: string[]
  impact: 'low' | 'medium' | 'high'
}

export interface CapabilityGap {
  area: string
  severity: 'low' | 'medium' | 'high'
  recommendation: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface PatternDetection {
  recognized: RecognizedPattern[]
  antiPatterns: AntiPattern[]
  bestPractices: BestPractice[]
  innovations: Innovation[]
}

export interface RecognizedPattern {
  name: string
  category: string
  confidence: number
  locations: string[]
  quality: 'excellent' | 'good' | 'fair' | 'poor'
}

export interface AntiPattern {
  name: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  locations: string[]
  consequences: string[]
  remediation: string
}

export interface BestPractice {
  name: string
  adherence: number // 0-100
  gaps: string[]
  recommendations: string[]
}

export interface Innovation {
  aspect: string
  description: string
  value: 'low' | 'medium' | 'high'
  novelty: number // 0-100
}

export interface RelationshipMap {
  dependencies: Dependency[]
  clusters: Cluster[]
  conflicts: Conflict[]
  synergies: Synergy[]
}

export interface Dependency {
  from: string
  to: string
  type: 'direct' | 'indirect' | 'implicit'
  strength: 'weak' | 'medium' | 'strong'
  nature: 'functional' | 'data' | 'control' | 'conceptual'
}

export interface Cluster {
  name: string
  members: string[]
  cohesion: number // 0-1
  purpose: string
  stability: 'stable' | 'evolving' | 'volatile'
}

export interface Conflict {
  entities: string[]
  type: 'functional' | 'semantic' | 'behavioral' | 'structural'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
}

export interface Synergy {
  entities: string[]
  type: 'complementary' | 'enhancing' | 'enabling'
  potential: number // 0-100
  description: string
}

export interface ContentAnalysis {
  themes: Theme[]
  topics: Topic[]
  sentiment: SentimentAnalysis
  vocabulary: VocabularyAnalysis
  structure: StructureAnalysis
}

export interface Theme {
  name: string
  prevalence: number // 0-100
  files: string[]
  keywords: string[]
}

export interface Topic {
  name: string
  confidence: number
  coverage: string[]
  related: string[]
}

export interface SentimentAnalysis {
  overall: 'positive' | 'neutral' | 'negative'
  confidence: number
  aspects: Record<string, number>
}

export interface VocabularyAnalysis {
  complexity: 'simple' | 'moderate' | 'complex' | 'advanced'
  diversity: number
  consistency: number
  domain: string[]
}

export interface StructureAnalysis {
  organization: 'poor' | 'fair' | 'good' | 'excellent'
  modularity: number // 0-100
  hierarchy: HierarchyAnalysis
  consistency: number
}

export interface HierarchyAnalysis {
  depth: number
  breadth: number
  balance: number
  clarity: number
}

export interface AbstractionMap {
  layers: AbstractionLayer[]
  transitions: AbstractionTransition[]
  coverage: AbstractionCoverage
  quality: AbstractionQuality
}

export interface AbstractionLayer {
  level: number
  name: string
  entities: string[]
  purpose: string
  stability: number // 0-100
}

export interface AbstractionTransition {
  from: number
  to: number
  mechanism: string
  quality: 'smooth' | 'rough' | 'broken'
  bidirectional: boolean
}

export interface AbstractionCoverage {
  total: number
  covered: number
  gaps: string[]
  redundancies: string[]
}

export interface AbstractionQuality {
  separation: number // 0-100
  cohesion: number // 0-100
  coupling: number // 0-100 (lower is better)
  leakage: string[] // abstractions that leak implementation details
}