export {
  parseAgentMarkdown,
  parseFenceEncodedMarkdown
} from './parser.js'

export {
  importAll,
  importAgent,
  importCopilot,
  importCursor,
  importCursorLegacy,
  importCline,
  importWindsurf,
  importZed,
  importCodex,
  importAider,
  importClaudeCode,
  importOpenCode,
  importGemini,
  importQodo,
  importAmazonQ,
  importRoo,
  importJunie
} from './importers.js'

export {
  toAgentMarkdown,
  exportToAgent,
  exportToCopilot,
  exportToCursor,
  exportToCline,
  exportToWindsurf,
  exportToZed,
  exportToCodex,
  exportToAider,
  exportToClaudeCode,
  exportToOpenCode,
  exportToGemini,
  exportToQodo,
  exportToAmazonQ,
  exportToRoo,
  exportToJunie,
  exportAll
} from './exporters.js'

export type {
  RuleMetadata,
  RuleBlock,
  ImportResult,
  ImportResults,
  ExportOptions,
  ParserOptions,
  AbstractionTypeInfo,
  AbstractionType,
  SkillMetadata,
  SubAgentMetadata,
  CommandMetadata,
  AnyAbstractionMetadata
} from './types.js'

// Type Detection System
export {
  detectAbstractionType,
  analyzeRuleContent,
  analyzeMetadata,
  type ContentAnalysis,
  type MetadataAnalysis
} from './type-detector.js'

// Validation System
export {
  validateAnyAbstraction,
  validateSkill,
  validateSubAgent,
  validateCommand,
  validateRule,
  validateAbstractionGroup,
  type ValidationResult,
  type ValidationError,
  type ValidationWarning,
  type ValidationSuggestion
} from './validators.js'

// Command Infrastructure
export {
  BaseCommand,
  type CommandOptions,
  type CommandResult
} from './commands/base.js'

export {
  CommandRegistry,
  commandRegistry,
  registerCommand,
  executeCommand,
  type RegisteredCommand
} from './command-registry.js'

export {
  formatHeader,
  formatSuccess,
  formatWarning,
  formatError,
  formatInfo,
  formatCommand,
  formatPath,
  formatNumber,
  formatBulletList,
  formatTable,
  ProgressIndicator,
  StatusDisplay,
  COLORS,
  // Re-exported from colors.ts
  color,
  colorize,
  formatList,
  header
} from './utils/output.js'

// Wrapper API - High-level interface over dotagent complexity
export {
  SyncManager,
  SyncError,
  ImportError,
  ExportError,
  AnalysisError,
  WrapperValidationError
} from './wrapper/index.js'

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
  ValidationResult as WrapperValidationResult,
  Suggestion,
  ProjectMetadata
} from './wrapper/index.js'