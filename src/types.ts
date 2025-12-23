export interface RuleMetadata {
  id: string
  alwaysApply?: boolean
  scope?: string | string[]
  triggers?: string[]
  manual?: boolean
  priority?: 'high' | 'medium' | 'low'
  description?: string
  globs?: string[]
  private?: boolean // Flag for private/local rules
  // New abstraction fields for extended type system
  type?: 'skill' | 'subagent' | 'command' | 'rule'
  expertise?: string[] // For skills/subagents - areas of knowledge/capability
  dependencies?: string[] // What this abstraction requires
  outputs?: string[] // What this abstraction produces/affects
  [key: string]: unknown // Allow additional metadata
}

export interface RuleBlock {
  metadata: RuleMetadata
  content: string
  position?: {
    start: { line: number; column: number }
    end: { line: number; column: number }
  }
}

export interface ImportResult {
  format: 'agent' | 'copilot' | 'cursor' | 'cline' | 'windsurf' | 'zed' | 'codex' | 'aider' | 'claude' | 'qodo' | 'gemini' | 'amazonq' | 'roo' | 'junie' | 'opencode' | 'unknown'
  filePath: string
  rules: RuleBlock[]
  raw?: string
}

export interface ImportResults {
  results: ImportResult[]
  errors: Array<{ file: string; error: string }>
}

export interface ExportOptions {
  format?: 'agent' | 'copilot' | 'cursor' | 'cline' | 'windsurf' | 'zed' | 'codex' | 'aider' | 'claude' | 'qodo' | 'gemini' | 'amazonq' | 'roo' | 'junie' | 'opencode'
  outputPath?: string
  overwrite?: boolean
  includePrivate?: boolean // Include private rules in export
  skipPrivate?: boolean // Skip private rules on import
}

export interface ParserOptions {
  strict?: boolean
  preserveWhitespace?: boolean
}

// Specific abstraction interfaces extending RuleMetadata

export interface SkillMetadata extends RuleMetadata {
  type: 'skill'
  expertise: string[] // Required for skills - areas of knowledge/capability
  portability?: 'cross-tool' | 'claude-only' // Tool compatibility
  autoInvoke?: boolean // Whether skill is automatically applied
  examples?: string[] // Usage examples
}

export interface SubAgentMetadata extends RuleMetadata {
  type: 'subagent'
  model?: 'claude-3-5-sonnet' | 'claude-3-haiku' | 'gpt-4' | 'gpt-3.5-turbo'
  tools?: string[] // Tools this sub-agent can access
  isolatedContext: boolean // Must be true for subagents
  systemPrompt?: string
  maxTokens?: number
}

export interface CommandMetadata extends RuleMetadata {
  type: 'command'
  trigger: string // Must start with "/"
  userInvoked: true // Must be true for commands
  arguments?: Array<{
    name: string
    type: 'string' | 'number' | 'boolean' | 'file'
    required: boolean
    description?: string
  }>
}

// Utility types for abstraction system

export type AbstractionType = 'skill' | 'subagent' | 'command' | 'rule'

export type AnyAbstractionMetadata = RuleMetadata | SkillMetadata | SubAgentMetadata | CommandMetadata

// Critical interface for other streams
export interface AbstractionTypeInfo {
  type: 'skill' | 'subagent' | 'command' | 'rule'
  confidence: number
  indicators: string[]
}