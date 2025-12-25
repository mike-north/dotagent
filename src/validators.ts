import { 
  RuleMetadata, 
  SkillMetadata, 
  SubAgentMetadata, 
  CommandMetadata,
  AnyAbstractionMetadata,
  AbstractionType,
  RuleBlock
} from './types.js'
import { detectAbstractionType } from './type-detector.js'

// Core validation result types
export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  suggestions: ValidationSuggestion[]
}

export interface ValidationError {
  code: string
  message: string
  field?: string
  severity: 'error' | 'warning' | 'info'
}

export interface ValidationWarning {
  code: string
  message: string
  field?: string
  severity: 'error' | 'warning' | 'info'
}

export interface ValidationSuggestion {
  code: string
  message: string
  field?: string
  actionable: boolean
}

// Length limits
export const LIMITS = {
  SKILL_DESCRIPTION_MAX: 1024,
  SUBAGENT_NAME_MAX: 64,
} as const

// Error codes for programmatic handling
export const VALIDATION_CODES = {
  // Skill validation codes
<<<<<<< Updated upstream
  SKILL_MISSING_EXPERTISE: 'SKILL_MISSING_EXPERTISE',
  SKILL_EMPTY_EXPERTISE: 'SKILL_EMPTY_EXPERTISE',
  SKILL_INVALID_PORTABILITY: 'SKILL_INVALID_PORTABILITY',
  SKILL_ISOLATION_PATTERN: 'SKILL_ISOLATION_PATTERN',
  SKILL_TRIGGER_PATTERN: 'SKILL_TRIGGER_PATTERN',
  SKILL_MISSING_KNOWLEDGE: 'SKILL_MISSING_KNOWLEDGE',

  // SubAgent validation codes
  SUBAGENT_MISSING_ISOLATION: 'SUBAGENT_MISSING_ISOLATION',
  SUBAGENT_FALSE_ISOLATION: 'SUBAGENT_FALSE_ISOLATION',
  SUBAGENT_INVALID_MODEL: 'SUBAGENT_INVALID_MODEL',
  SUBAGENT_INVALID_TOOLS: 'SUBAGENT_INVALID_TOOLS',
  SUBAGENT_RULE_CONFLICT: 'SUBAGENT_RULE_CONFLICT',
  SUBAGENT_MISSING_PROCEDURAL: 'SUBAGENT_MISSING_PROCEDURAL',
=======
  SKILL_MISSING_NAME: 'SKILL_MISSING_NAME',
  SKILL_MISSING_DESCRIPTION: 'SKILL_MISSING_DESCRIPTION',
  SKILL_DESCRIPTION_TOO_LONG: 'SKILL_DESCRIPTION_TOO_LONG',

  // SubAgent validation codes
  SUBAGENT_MISSING_NAME: 'SUBAGENT_MISSING_NAME',
  SUBAGENT_MISSING_DESCRIPTION: 'SUBAGENT_MISSING_DESCRIPTION',
  SUBAGENT_NAME_TOO_LONG: 'SUBAGENT_NAME_TOO_LONG',
>>>>>>> Stashed changes

  // Command validation codes
  COMMAND_MISSING_TRIGGER: 'COMMAND_MISSING_TRIGGER',
  COMMAND_INVALID_TRIGGER: 'COMMAND_INVALID_TRIGGER',
  COMMAND_MISSING_USER_INVOKED: 'COMMAND_MISSING_USER_INVOKED',
  COMMAND_FALSE_USER_INVOKED: 'COMMAND_FALSE_USER_INVOKED',
  COMMAND_INVALID_ARGUMENTS: 'COMMAND_INVALID_ARGUMENTS',
  COMMAND_ALWAYS_APPLY_PATTERN: 'COMMAND_ALWAYS_APPLY_PATTERN',
  COMMAND_MISSING_INSTRUCTIONS: 'COMMAND_MISSING_INSTRUCTIONS',
  COMMAND_TRIGGER_CONFLICT: 'COMMAND_TRIGGER_CONFLICT',

  // Rule validation codes
  RULE_INVALID_SCOPE: 'RULE_INVALID_SCOPE',
  RULE_SCOPE_CONFLICT: 'RULE_SCOPE_CONFLICT',
  RULE_MISSING_CONTENT: 'RULE_MISSING_CONTENT',

  // Universal validation codes
  ABSTRACTION_TYPE_MISMATCH: 'ABSTRACTION_TYPE_MISMATCH',
  CIRCULAR_DEPENDENCY: 'CIRCULAR_DEPENDENCY',
  INVALID_DEPENDENCY: 'INVALID_DEPENDENCY',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  UNKNOWN_TYPE: 'UNKNOWN_TYPE'
} as const

// Valid model names for subagents
const VALID_MODELS = [
  'claude-3-5-sonnet',
  'claude-3-haiku', 
  'gpt-4',
  'gpt-3.5-turbo'
] as const

// Valid portability values for skills
const VALID_PORTABILITY = ['cross-tool', 'claude-only'] as const

// Known tool names (extensible list)
const KNOWN_TOOLS = [
  'bash',
  'python',
  'node',
  'git',
  'docker',
  'typescript',
  'jest',
  'webpack',
  'eslint'
] as const

/**
 * Validates a skill abstraction with comprehensive error checking
 */
export function validateSkill(metadata: SkillMetadata, content: string): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []
  const suggestions: ValidationSuggestion[] = []

  // Required field validation
  if (!metadata.expertise) {
    errors.push({
      code: VALIDATION_CODES.SKILL_MISSING_EXPERTISE,
      message: 'Skills must have an expertise field',
      field: 'expertise',
      severity: 'error'
    })
  } else if (!Array.isArray(metadata.expertise) || metadata.expertise.length === 0) {
    errors.push({
      code: VALIDATION_CODES.SKILL_EMPTY_EXPERTISE,
      message: 'Skills must have at least one area of expertise',
      field: 'expertise',
      severity: 'error'
    })
  }

  // Field validation
  if (metadata.portability && !VALID_PORTABILITY.includes(metadata.portability)) {
    errors.push({
      code: VALIDATION_CODES.SKILL_INVALID_PORTABILITY,
      message: `Invalid portability value. Must be one of: ${VALID_PORTABILITY.join(', ')}`,
      field: 'portability',
      severity: 'error'
    })
  }

  // Content rules validation
  const lowerContent = content.toLowerCase()

  // Check for knowledge/guidance patterns
  const knowledgePatterns = [
    'how to', 'best practice', 'pattern:', 'example:', 'technique',
    'approach', 'method', 'strategy', 'remember', 'consider',
    'tip:', 'guideline', 'recommendation'
  ]
  const hasKnowledgePattern = knowledgePatterns.some(pattern => lowerContent.includes(pattern))
  
  if (!hasKnowledgePattern) {
    warnings.push({
      code: VALIDATION_CODES.SKILL_MISSING_KNOWLEDGE,
      message: 'Skills should contain knowledge or guidance patterns (e.g., "how to", "best practice", "example")',
      severity: 'warning'
    })
  }

  // Anti-pattern detection
  const isolationPatterns = [
    'delegate to', 'hand off', 'separate context', 'independent', 
    'isolated', 'spawn', 'subprocess'
  ]
  const hasIsolationPattern = isolationPatterns.some(pattern => lowerContent.includes(pattern))
  
  if (hasIsolationPattern) {
    errors.push({
      code: VALIDATION_CODES.SKILL_ISOLATION_PATTERN,
      message: 'Skills should not use isolation or delegation patterns. Consider using a SubAgent instead.',
      severity: 'error'
    })
  }

  const triggerPatterns = ['when user types', '/[a-z]', 'trigger:', 'command:']
  const hasTriggerPattern = triggerPatterns.some(pattern => 
    pattern.startsWith('/') ? new RegExp(pattern).test(lowerContent) : lowerContent.includes(pattern)
  )
  
  if (hasTriggerPattern) {
    errors.push({
      code: VALIDATION_CODES.SKILL_TRIGGER_PATTERN,
      message: 'Skills should not define triggers or commands. Consider using a Command instead.',
      severity: 'error'
    })
  }

  // Suggestions
  if (metadata.expertise && metadata.expertise.length === 1) {
    suggestions.push({
      code: 'SKILL_CATEGORIZE_EXPERTISE',
      message: 'Consider categorizing expertise into more specific areas for better discoverability',
      field: 'expertise',
      actionable: true
    })
  }

  if (!metadata.examples || metadata.examples.length === 0) {
    suggestions.push({
      code: 'SKILL_ADD_EXAMPLES',
      message: 'Consider adding usage examples to help users understand when to apply this skill',
      field: 'examples',
      actionable: true
    })
  }

  if (!metadata.portability) {
    suggestions.push({
      code: 'SKILL_SPECIFY_PORTABILITY',
      message: 'Consider specifying portability to clarify tool compatibility',
      field: 'portability',
      actionable: true
    })
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    suggestions
  }
}

/**
 * Validates a subagent abstraction with comprehensive error checking
 */
export function validateSubAgent(metadata: SubAgentMetadata, content: string): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []
  const suggestions: ValidationSuggestion[] = []

  // Required field validation
  if (metadata.isolatedContext === undefined) {
    errors.push({
      code: VALIDATION_CODES.SUBAGENT_MISSING_ISOLATION,
      message: 'SubAgents must have isolatedContext field',
      field: 'isolatedContext',
      severity: 'error'
    })
  } else if (metadata.isolatedContext !== true) {
    errors.push({
      code: VALIDATION_CODES.SUBAGENT_FALSE_ISOLATION,
      message: 'SubAgents must have isolatedContext set to true',
      field: 'isolatedContext',
      severity: 'error'
    })
  }

  // Model validation
  if (metadata.model && !VALID_MODELS.includes(metadata.model)) {
    errors.push({
      code: VALIDATION_CODES.SUBAGENT_INVALID_MODEL,
      message: `Invalid model. Must be one of: ${VALID_MODELS.join(', ')}`,
      field: 'model',
      severity: 'error'
    })
  }

  // Tools validation
  if (metadata.tools) {
    const invalidTools = metadata.tools.filter(tool => !KNOWN_TOOLS.includes(tool as any))
    if (invalidTools.length > 0) {
      warnings.push({
        code: VALIDATION_CODES.SUBAGENT_INVALID_TOOLS,
        message: `Unknown tools: ${invalidTools.join(', ')}. Verify these are valid tool names.`,
        field: 'tools',
        severity: 'warning'
      })
    }
  }

  // Content rules validation
  const lowerContent = content.toLowerCase()

  // Check for procedural/task patterns
  const proceduralPatterns = [
    'step 1:', 'step 2:', 'first', 'then', 'next', 'finally',
    'procedure', 'workflow', 'process', 'pipeline', 'delegate',
    'hand off', 'sub-task', 'subtask'
  ]
  const hasProceduralPattern = proceduralPatterns.some(pattern => lowerContent.includes(pattern))
  
  if (!hasProceduralPattern) {
    warnings.push({
      code: VALIDATION_CODES.SUBAGENT_MISSING_PROCEDURAL,
      message: 'SubAgents should contain procedural or task-oriented patterns',
      severity: 'warning'
    })
  }

  // Anti-pattern detection
  if (metadata.alwaysApply === true) {
    errors.push({
      code: VALIDATION_CODES.SUBAGENT_RULE_CONFLICT,
      message: 'SubAgents should not use alwaysApply flag. This conflicts with isolated context.',
      field: 'alwaysApply',
      severity: 'error'
    })
  }

  // Suggestions
  if (!metadata.model) {
    suggestions.push({
      code: 'SUBAGENT_SPECIFY_MODEL',
      message: 'Consider specifying a model for better performance optimization',
      field: 'model',
      actionable: true
    })
  } else if (metadata.model === 'claude-3-haiku') {
    suggestions.push({
      code: 'SUBAGENT_HAIKU_USAGE',
      message: 'Consider using Haiku for simple, fast tasks and Sonnet for complex reasoning',
      field: 'model',
      actionable: false
    })
  }

  if (!metadata.systemPrompt) {
    suggestions.push({
      code: 'SUBAGENT_ADD_SYSTEM_PROMPT',
      message: 'Consider adding a system prompt to better define the subagent\'s role',
      field: 'systemPrompt',
      actionable: true
    })
  }

  if (metadata.tools && metadata.tools.length > 5) {
    suggestions.push({
      code: 'SUBAGENT_TOO_MANY_TOOLS',
      message: 'Consider reducing tool scope for better focus and performance',
      field: 'tools',
      actionable: true
    })
  } else if (skill.description.length > LIMITS.SKILL_DESCRIPTION_MAX) {
    errors.push({
      code: VALIDATION_CODES.SKILL_DESCRIPTION_TOO_LONG,
      message: `Skill description must be at most ${LIMITS.SKILL_DESCRIPTION_MAX} characters (got ${skill.description.length})`,
      field: 'description',
    })
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    suggestions
  }
}

/**
 * Validates a command abstraction with comprehensive error checking
 */
export function validateCommand(metadata: CommandMetadata, content: string): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []
  const suggestions: ValidationSuggestion[] = []

  // Required field validation
  if (!metadata.trigger) {
    errors.push({
      code: VALIDATION_CODES.COMMAND_MISSING_TRIGGER,
      message: 'Commands must have a trigger field',
      field: 'trigger',
      severity: 'error'
    })
  } else if (!metadata.trigger.startsWith('/')) {
    errors.push({
      code: VALIDATION_CODES.COMMAND_INVALID_TRIGGER,
      message: 'Command triggers must start with "/"',
      field: 'trigger',
      severity: 'error'
    })
  } else if (subagent.name.length > LIMITS.SUBAGENT_NAME_MAX) {
    errors.push({
      code: VALIDATION_CODES.SUBAGENT_NAME_TOO_LONG,
      message: `SubAgent name must be at most ${LIMITS.SUBAGENT_NAME_MAX} characters (got ${subagent.name.length})`,
      field: 'name',
    })
  }

  if (metadata.userInvoked === undefined) {
    errors.push({
      code: VALIDATION_CODES.COMMAND_MISSING_USER_INVOKED,
      message: 'Commands must have userInvoked field',
      field: 'userInvoked',
      severity: 'error'
    })
  } else if (metadata.userInvoked !== true) {
    errors.push({
      code: VALIDATION_CODES.COMMAND_FALSE_USER_INVOKED,
      message: 'Commands must have userInvoked set to true',
      field: 'userInvoked',
      severity: 'error'
    })
  }

  // Trigger validation
  if (metadata.trigger) {
    const triggerRegex = /^\/[a-zA-Z][a-zA-Z0-9_-]*$/
    if (!triggerRegex.test(metadata.trigger)) {
      errors.push({
        code: VALIDATION_CODES.COMMAND_INVALID_TRIGGER,
        message: 'Command trigger must be a valid slash command (e.g., /build, /test)',
        field: 'trigger',
        severity: 'error'
      })
    }
  }

  // Arguments validation
  if (metadata.arguments) {
    const validArgTypes = ['string', 'number', 'boolean', 'file']
    metadata.arguments.forEach((arg, index) => {
      if (!arg.name) {
        errors.push({
          code: VALIDATION_CODES.COMMAND_INVALID_ARGUMENTS,
          message: `Argument at index ${index} must have a name`,
          field: `arguments.${index}.name`,
          severity: 'error'
        })
      }

      if (!validArgTypes.includes(arg.type)) {
        errors.push({
          code: VALIDATION_CODES.COMMAND_INVALID_ARGUMENTS,
          message: `Invalid argument type "${arg.type}". Must be one of: ${validArgTypes.join(', ')}`,
          field: `arguments.${index}.type`,
          severity: 'error'
        })
      }

      if (typeof arg.required !== 'boolean') {
        errors.push({
          code: VALIDATION_CODES.COMMAND_INVALID_ARGUMENTS,
          message: `Argument required field must be boolean`,
          field: `arguments.${index}.required`,
          severity: 'error'
        })
      }
    })
  }

  // Content rules validation
  const lowerContent = content.toLowerCase()

  // Check for executable instructions
  const instructionPatterns = [
    'run', 'execute', 'trigger', 'invoke', 'call',
    'usage:', 'syntax:', 'when user types', 'command'
  ]
  const hasInstructionPattern = instructionPatterns.some(pattern => lowerContent.includes(pattern))
  
  if (!hasInstructionPattern) {
    warnings.push({
      code: VALIDATION_CODES.COMMAND_MISSING_INSTRUCTIONS,
      message: 'Commands should contain executable instructions or usage guidance',
      severity: 'warning'
    })
  }

  // Anti-pattern detection
  const alwaysPatterns = ['always apply', 'every time', 'consistently', 'baseline', 'global']
  const hasAlwaysPattern = alwaysPatterns.some(pattern => lowerContent.includes(pattern))
  
  if (hasAlwaysPattern || metadata.alwaysApply === true) {
    errors.push({
      code: VALIDATION_CODES.COMMAND_ALWAYS_APPLY_PATTERN,
      message: 'Commands should not use always-apply patterns. They are user-invoked only.',
      severity: 'error'
    })
  }

  // Suggestions
  if (!metadata.arguments || metadata.arguments.length === 0) {
    suggestions.push({
      code: 'COMMAND_ADD_ARGUMENTS',
      message: 'Consider defining arguments structure for better usability',
      field: 'arguments',
      actionable: true
    })
  }

  if (!content.includes('usage:') && !content.includes('example:')) {
    suggestions.push({
      code: 'COMMAND_ADD_USAGE_EXAMPLE',
      message: 'Consider adding usage examples to help users understand how to invoke the command',
      actionable: true
    })
  }

  if (metadata.arguments?.some(arg => arg.required === false) && 
      !content.includes('optional')) {
    suggestions.push({
      code: 'COMMAND_DOCUMENT_OPTIONAL_ARGS',
      message: 'Consider documenting optional arguments in the command description',
      actionable: true
    })
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    suggestions
  }
}

/**
 * Validates a rule abstraction with comprehensive error checking
 * Maintains backward compatibility with existing rules
 */
export function validateRule(metadata: RuleMetadata, content: string): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []
  const suggestions: ValidationSuggestion[] = []

  // Backward compatibility: All existing rules should remain valid
  // Only perform basic validation to avoid breaking existing setups

  // Validate scope if present
  if (metadata.scope) {
    const scopes = Array.isArray(metadata.scope) ? metadata.scope : [metadata.scope]
    const invalidScopes = scopes.filter(scope => typeof scope !== 'string' || scope.trim() === '')
    
    if (invalidScopes.length > 0) {
      errors.push({
        code: VALIDATION_CODES.RULE_INVALID_SCOPE,
        message: 'Rule scopes must be non-empty strings',
        field: 'scope',
        severity: 'error'
      })
    }
  }

  // Basic content validation
  if (!content || content.trim() === '') {
    errors.push({
      code: VALIDATION_CODES.RULE_MISSING_CONTENT,
      message: 'Rules must have content',
      severity: 'error'
    })
  }

  // Content rules validation (suggestions only to maintain compatibility)
  const lowerContent = content.toLowerCase()

  // Check for guidelines/constraints
  const rulePatterns = [
    'always', 'never', 'should', 'must', 'avoid', 'ensure',
    'you are', 'your role is', 'behave as', 'act as',
    'consistently', 'require', 'policy', 'guideline'
  ]
  const hasRulePattern = rulePatterns.some(pattern => lowerContent.includes(pattern))
  
  if (!hasRulePattern) {
    suggestions.push({
      code: 'RULE_ADD_GUIDELINES',
      message: 'Consider adding clear guidelines or constraints for better rule effectiveness',
      actionable: true
    })
  }

  // Suggestions for improvement
  if (!metadata.priority) {
    suggestions.push({
      code: 'RULE_ADD_PRIORITY',
      message: 'Consider adding priority level for better rule ordering',
      field: 'priority',
      actionable: true
    })
  }

  if (!metadata.description) {
    suggestions.push({
      code: 'RULE_ADD_DESCRIPTION',
      message: 'Consider adding description for better documentation',
      field: 'description',
      actionable: true
    })
  }

  if (metadata.alwaysApply === undefined) {
    suggestions.push({
      code: 'RULE_SPECIFY_ALWAYS_APPLY',
      message: 'Consider explicitly setting alwaysApply to clarify rule application',
      field: 'alwaysApply',
      actionable: true
    })
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    suggestions
  }
}

/**
 * Universal validation function that detects type and routes to specific validator
 */
export function validateAnyAbstraction(metadata: AnyAbstractionMetadata, content: string): ValidationResult {
  // Handle edge cases
  if (!metadata) {
    return {
      valid: false,
      errors: [{
        code: VALIDATION_CODES.MISSING_REQUIRED_FIELD,
        message: 'Metadata is required for validation',
        severity: 'error'
      }],
      warnings: [],
      suggestions: []
    }
  }

  if (content === undefined || content === null) {
    return {
      valid: false,
      errors: [{
        code: VALIDATION_CODES.MISSING_REQUIRED_FIELD,
        message: 'Content is required for validation',
        severity: 'error'
      }],
      warnings: [],
      suggestions: []
    }
  }

  // Determine the type
  let detectedType: AbstractionType
  let typeSource = 'explicit'

  if (metadata.type) {
    detectedType = metadata.type
  } else {
    // Use type detection to infer type
    const ruleBlock: RuleBlock = { metadata, content }
    const typeInfo = detectAbstractionType(ruleBlock)
    detectedType = typeInfo.type
    typeSource = 'inferred'
  }

  // Route to specific validator first
  const result = routeToSpecificValidator(detectedType, metadata, content)

  // Check for type mismatch if we have an explicit type
  if (metadata.type) {
    // Create a metadata copy without the explicit type for content-based detection
    const { type: _, ...metadataWithoutType } = metadata
    const ruleBlock: RuleBlock = { metadata: metadataWithoutType, content }
    const typeInfo = detectAbstractionType(ruleBlock)
    
    if (typeInfo.type !== metadata.type && typeInfo.confidence > 0.7) {
      result.warnings.push({
        code: VALIDATION_CODES.ABSTRACTION_TYPE_MISMATCH,
        message: `Content suggests "${typeInfo.type}" but metadata specifies "${metadata.type}". Consider reviewing the type or content.`,
        field: 'type',
        severity: 'warning'
      })
    }
  }

  return result
}

/**
 * Routes to the appropriate specific validator based on type
 */
function routeToSpecificValidator(
  type: AbstractionType, 
  metadata: AnyAbstractionMetadata, 
  content: string
): ValidationResult {
  switch (type) {
    case 'skill':
      return validateSkill(metadata as SkillMetadata, content)
    case 'subagent':
      return validateSubAgent(metadata as SubAgentMetadata, content)
    case 'command':
      return validateCommand(metadata as CommandMetadata, content)
    case 'rule':
      return validateRule(metadata, content)
    default:
      return {
        valid: false,
        errors: [{
          code: VALIDATION_CODES.UNKNOWN_TYPE,
          message: `Unknown abstraction type: ${type}`,
          field: 'type',
          severity: 'error'
        }],
        warnings: [],
        suggestions: []
      }
  }
}

/**
 * Cross-validation logic for dependency and conflict detection
 */
export function validateAbstractionGroup(abstractions: Array<{ metadata: AnyAbstractionMetadata, content: string }>): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []
  const suggestions: ValidationSuggestion[] = []

  // Track command triggers for conflict detection
  const commandTriggers = new Map<string, string>()
  
  // Track dependencies for circular dependency detection
  const dependencyGraph = new Map<string, string[]>()

  abstractions.forEach((abstraction, index) => {
    const { metadata } = abstraction

    // Build dependency graph
    if (metadata.dependencies) {
      dependencyGraph.set(metadata.id, metadata.dependencies)
    }

    // Check for command trigger conflicts
    if (metadata.type === 'command') {
      const commandMeta = metadata as CommandMetadata
      if (commandMeta.trigger) {
        const existingId = commandTriggers.get(commandMeta.trigger)
        if (existingId) {
          errors.push({
            code: VALIDATION_CODES.COMMAND_TRIGGER_CONFLICT,
            message: `Trigger "${commandMeta.trigger}" conflicts with command "${existingId}"`,
            field: 'trigger',
            severity: 'error'
          })
        } else {
          commandTriggers.set(commandMeta.trigger, metadata.id)
        }
      }
    }
  })

  // Check for circular dependencies
  const visited = new Set<string>()
  const recursionStack = new Set<string>()
  
  function hasCircularDependency(nodeId: string): boolean {
    if (recursionStack.has(nodeId)) return true
    if (visited.has(nodeId)) return false

    visited.add(nodeId)
    recursionStack.add(nodeId)

    const dependencies = dependencyGraph.get(nodeId) || []
    for (const depId of dependencies) {
      if (hasCircularDependency(depId)) return true
    }

    recursionStack.delete(nodeId)
    return false
  }

  for (const [nodeId] of dependencyGraph) {
    if (hasCircularDependency(nodeId)) {
      errors.push({
        code: VALIDATION_CODES.CIRCULAR_DEPENDENCY,
        message: `Circular dependency detected involving "${nodeId}"`,
        field: 'dependencies',
        severity: 'error'
      })
      break // Only report once to avoid spam
    }
  }

  // Validate dependency references
  const allIds = new Set(abstractions.map(a => a.metadata.id))
  for (const [nodeId, dependencies] of dependencyGraph) {
    const invalidDeps = dependencies.filter(depId => !allIds.has(depId))
    if (invalidDeps.length > 0) {
      errors.push({
        code: VALIDATION_CODES.INVALID_DEPENDENCY,
        message: `Invalid dependencies in "${nodeId}": ${invalidDeps.join(', ')}`,
        field: 'dependencies',
        severity: 'error'
      })
    }
  }

  // Check for scope conflicts (rules that might override each other)
  const alwaysApplyRules = abstractions.filter(a => 
    a.metadata.alwaysApply === true && a.metadata.type === 'rule'
  )

  if (alwaysApplyRules.length > 1) {
    const overlappingScopes = new Map<string, string[]>()
    
    alwaysApplyRules.forEach(rule => {
      const scopes = rule.metadata.scope ? 
        (Array.isArray(rule.metadata.scope) ? rule.metadata.scope : [rule.metadata.scope]) : 
        ['global']
      
      scopes.forEach(scope => {
        if (!overlappingScopes.has(scope)) {
          overlappingScopes.set(scope, [])
        }
        overlappingScopes.get(scope)!.push(rule.metadata.id)
      })
    })

    for (const [scope, ruleIds] of overlappingScopes) {
      if (ruleIds.length > 1) {
        warnings.push({
          code: VALIDATION_CODES.RULE_SCOPE_CONFLICT,
          message: `Multiple always-apply rules in scope "${scope}": ${ruleIds.join(', ')}. Consider setting priorities.`,
          field: 'scope',
          severity: 'warning'
        })
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    suggestions
  }
}

/**
 * Utility function to combine multiple validation results
 */
export function combineValidationResults(results: ValidationResult[]): ValidationResult {
  const combined: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    suggestions: []
  }

  results.forEach(result => {
    if (!result.valid) {
      combined.valid = false
    }
    combined.errors.push(...result.errors)
    combined.warnings.push(...result.warnings)
    combined.suggestions.push(...result.suggestions)
  })

  return combined
}

/**
 * Utility function to format validation result for human-readable output
 */
export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = []
  
  if (result.valid) {
    lines.push('✓ Validation passed')
  } else {
    lines.push('✗ Validation failed')
  }

  if (result.errors.length > 0) {
    lines.push('\nErrors:')
    result.errors.forEach(error => {
      const fieldInfo = error.field ? ` (${error.field})` : ''
      lines.push(`  • ${error.message}${fieldInfo}`)
    })
  }

  if (result.warnings.length > 0) {
    lines.push('\nWarnings:')
    result.warnings.forEach(warning => {
      const fieldInfo = warning.field ? ` (${warning.field})` : ''
      lines.push(`  • ${warning.message}${fieldInfo}`)
    })
  }

  if (result.suggestions.length > 0) {
    lines.push('\nSuggestions:')
    result.suggestions.forEach(suggestion => {
      const fieldInfo = suggestion.field ? ` (${suggestion.field})` : ''
      const actionable = suggestion.actionable ? ' [actionable]' : ''
      lines.push(`  • ${suggestion.message}${fieldInfo}${actionable}`)
    })
  }

  return lines.join('\n')
}