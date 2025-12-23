// Main wrapper API exports
export { SyncManager } from './sync-manager.js'

// Export all types for consumer usage
export type {
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
  ProjectMetadata
} from './types.js'

// Export error classes
export {
  SyncError,
  ImportError,
  ExportError,
  AnalysisError,
  WrapperValidationError
} from './types.js'