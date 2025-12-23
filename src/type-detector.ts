import { RuleBlock, RuleMetadata, AbstractionTypeInfo, AbstractionType } from './types.js'

// Analysis interfaces for internal use
export interface ContentAnalysis {
  skillPatterns: string[]
  subagentPatterns: string[]
  commandPatterns: string[]
  rulePatterns: string[]
  structuralFeatures: string[]
  keywordDensity: Record<string, number>
}

export interface MetadataAnalysis {
  explicitType?: AbstractionType
  typeHints: string[]
  confidence: number
  conflictingSignals: string[]
}

// Keyword patterns for each abstraction type
const SKILL_KEYWORDS = [
  // Expertise indicators
  'how to', 'pattern:', 'example:', 'best practice', 'approach',
  'when working with', 'technique', 'method', 'strategy',
  'remember', 'consider', 'note that', 'keep in mind',
  'tip:', 'guideline', 'recommendation', 'practice',
  'expertise', 'knowledge', 'understanding', 'mastery'
]

const SUBAGENT_KEYWORDS = [
  // Agent delegation patterns
  'delegate to', 'hand off', 'sub-task', 'subtask',
  'separate context', 'independent', 'isolated', 'spawn',
  'claude-', 'gpt-', 'haiku', 'sonnet', 'model',
  'step 1:', 'first', 'then', 'finally', 'next',
  'procedure', 'workflow', 'process', 'pipeline'
]

const COMMAND_KEYWORDS = [
  // Executable action patterns
  'run', 'execute', 'trigger', 'invoke', 'call',
  'command', 'cli', 'script', 'tool',
  'when user types', 'usage:', 'syntax:',
  'argument', 'parameter', 'flag', 'option'
]

const RULE_KEYWORDS = [
  // Always-apply and behavioral patterns
  'always', 'every time', 'consistently', 'never',
  'you are', 'your role is', 'behave as', 'act as',
  'should', 'must', 'avoid', 'ensure', 'require',
  'global', 'universal', 'default', 'baseline'
]

// Structural pattern matchers
const STRUCTURAL_PATTERNS = {
  numberedList: /^\s*\d+\.\s+/m,
  bulletList: /^\s*[-*]\s+/m,
  slashCommand: /\/[a-zA-Z][a-zA-Z0-9_-]*/,
  codeBlock: /```[\s\S]*?```/,
  stepPattern: /(?:step\s+\d+|first|then|next|finally)/i,
  examplePattern: /(?:example|e\.g\.|for instance)/i,
  notePattern: /(?:note:|important:|remember:)/i,
  procedurePattern: /(?:procedure|process|workflow|pipeline)/i
}

/**
 * Detects the abstraction type of a rule block using heuristic analysis
 */
export function detectAbstractionType(rule: RuleBlock): AbstractionTypeInfo {
  // First check for explicit metadata type
  const metadataAnalysis = analyzeMetadata(rule.metadata)
  if (metadataAnalysis.explicitType && metadataAnalysis.confidence > 0.9) {
    return {
      type: metadataAnalysis.explicitType,
      confidence: metadataAnalysis.confidence,
      indicators: [`explicit type: ${metadataAnalysis.explicitType}`, ...metadataAnalysis.typeHints]
    }
  }

  // Analyze content for patterns
  const contentAnalysis = analyzeRuleContent(rule.content)

  // Calculate confidence scores for each type
  const scores = calculateTypeScores(contentAnalysis, metadataAnalysis)

  // Find the highest scoring type
  const maxScore = Math.max(...Object.values(scores))
  const detectedType = Object.keys(scores).find(type => scores[type as AbstractionType] === maxScore) as AbstractionType

  // Gather indicators that contributed to this classification
  const indicators = gatherIndicators(detectedType, contentAnalysis, metadataAnalysis)

  // Ensure minimum confidence for non-rule types
  const finalConfidence = detectedType === 'rule' ? Math.max(maxScore, 0.5) : maxScore

  return {
    type: detectedType,
    confidence: finalConfidence,
    indicators
  }
}

/**
 * Analyzes rule content for type detection patterns
 */
export function analyzeRuleContent(content: string): ContentAnalysis {
  const lowerContent = content.toLowerCase()
  
  const skillPatterns: string[] = []
  const subagentPatterns: string[] = []
  const commandPatterns: string[] = []
  const rulePatterns: string[] = []
  const structuralFeatures: string[] = []
  const keywordDensity: Record<string, number> = {}

  // Check for skill patterns
  SKILL_KEYWORDS.forEach(keyword => {
    if (lowerContent.includes(keyword)) {
      skillPatterns.push(keyword)
      keywordDensity[keyword] = (lowerContent.match(new RegExp(keyword, 'g')) || []).length
    }
  })

  // Check for subagent patterns
  SUBAGENT_KEYWORDS.forEach(keyword => {
    if (lowerContent.includes(keyword)) {
      subagentPatterns.push(keyword)
      keywordDensity[keyword] = (lowerContent.match(new RegExp(keyword, 'g')) || []).length
    }
  })

  // Check for command patterns
  COMMAND_KEYWORDS.forEach(keyword => {
    if (lowerContent.includes(keyword)) {
      commandPatterns.push(keyword)
      keywordDensity[keyword] = (lowerContent.match(new RegExp(keyword, 'g')) || []).length
    }
  })

  // Check for rule patterns
  RULE_KEYWORDS.forEach(keyword => {
    if (lowerContent.includes(keyword)) {
      rulePatterns.push(keyword)
      keywordDensity[keyword] = (lowerContent.match(new RegExp(keyword, 'g')) || []).length
    }
  })

  // Check structural patterns
  Object.entries(STRUCTURAL_PATTERNS).forEach(([name, pattern]) => {
    if (pattern.test(content)) {
      structuralFeatures.push(name)
    }
  })

  // Special checks for command slash syntax
  if (STRUCTURAL_PATTERNS.slashCommand.test(content)) {
    commandPatterns.push('slash command syntax')
  }

  return {
    skillPatterns,
    subagentPatterns,
    commandPatterns,
    rulePatterns,
    structuralFeatures,
    keywordDensity
  }
}

/**
 * Analyzes metadata for type hints and explicit type declarations
 */
export function analyzeMetadata(metadata: RuleMetadata): MetadataAnalysis {
  const typeHints: string[] = []
  const conflictingSignals: string[] = []
  let confidence = 0

  // Check for explicit type
  if (metadata.type) {
    confidence = 1.0
    return {
      explicitType: metadata.type,
      typeHints: [`metadata.type: ${metadata.type}`],
      confidence,
      conflictingSignals: []
    }
  }

  // Check metadata fields for type hints
  if (metadata.triggers?.some(trigger => trigger.startsWith('/'))) {
    typeHints.push('slash trigger in metadata')
    confidence = Math.max(confidence, 0.8)
  }

  if (metadata.manual === true) {
    typeHints.push('manual invocation flag')
    confidence = Math.max(confidence, 0.6)
  }

  if (metadata.alwaysApply === true) {
    typeHints.push('always apply flag suggests rule')
    confidence = Math.max(confidence, 0.7)
  }

  if (metadata.expertise && metadata.expertise.length > 0) {
    typeHints.push('expertise field suggests skill')
    confidence = Math.max(confidence, 0.8)
  }

  if (metadata.scope) {
    const scopes = Array.isArray(metadata.scope) ? metadata.scope : [metadata.scope]
    if (scopes.some(scope => scope.includes('command') || scope.includes('cli'))) {
      typeHints.push('command-related scope')
      confidence = Math.max(confidence, 0.6)
    }
  }

  // Check for conflicting signals
  if (metadata.alwaysApply === true && metadata.manual === true) {
    conflictingSignals.push('conflicting alwaysApply and manual flags')
  }

  return {
    typeHints,
    confidence,
    conflictingSignals
  }
}

/**
 * Calculates confidence scores for each abstraction type
 */
function calculateTypeScores(
  contentAnalysis: ContentAnalysis,
  metadataAnalysis: MetadataAnalysis
): Record<AbstractionType, number> {
  const scores: Record<AbstractionType, number> = {
    skill: 0,
    subagent: 0,
    command: 0,
    rule: 0
  }

  // Base scores from content pattern matching
  scores.skill = calculateContentScore(contentAnalysis.skillPatterns, contentAnalysis.keywordDensity)
  scores.subagent = calculateContentScore(contentAnalysis.subagentPatterns, contentAnalysis.keywordDensity)
  scores.command = calculateContentScore(contentAnalysis.commandPatterns, contentAnalysis.keywordDensity)
  scores.rule = calculateContentScore(contentAnalysis.rulePatterns, contentAnalysis.keywordDensity)

  // Boost scores based on structural features
  if (contentAnalysis.structuralFeatures.includes('slashCommand')) {
    scores.command += 0.4
  }

  if (contentAnalysis.structuralFeatures.includes('stepPattern') || 
      contentAnalysis.structuralFeatures.includes('procedurePattern')) {
    scores.subagent += 0.3
  }

  if (contentAnalysis.structuralFeatures.includes('examplePattern') || 
      contentAnalysis.structuralFeatures.includes('notePattern')) {
    scores.skill += 0.2
  }

  if (contentAnalysis.structuralFeatures.includes('numberedList')) {
    scores.subagent += 0.2
  }

  // Apply metadata analysis influence
  const metadataBoost = metadataAnalysis.confidence * 0.3
  if (metadataAnalysis.typeHints.some(hint => hint.includes('expertise'))) {
    scores.skill += metadataBoost
  }
  if (metadataAnalysis.typeHints.some(hint => hint.includes('trigger'))) {
    scores.command += metadataBoost
  }
  if (metadataAnalysis.typeHints.some(hint => hint.includes('manual'))) {
    scores.command += metadataBoost * 0.5
  }
  if (metadataAnalysis.typeHints.some(hint => hint.includes('always apply'))) {
    scores.rule += metadataBoost
  }

  // Normalize scores to [0, 1] range
  const maxRawScore = Math.max(...Object.values(scores))
  if (maxRawScore > 0) {
    Object.keys(scores).forEach(type => {
      scores[type as AbstractionType] = Math.min(scores[type as AbstractionType] / maxRawScore, 1.0)
    })
  }

  // Ensure rule has minimum score as fallback
  scores.rule = Math.max(scores.rule, 0.3)

  return scores
}

/**
 * Calculates content score based on pattern matches and keyword density
 */
function calculateContentScore(patterns: string[], keywordDensity: Record<string, number>): number {
  if (patterns.length === 0) return 0

  // Base score from number of unique patterns matched
  const score = Math.min(patterns.length * 0.15, 0.7)

  // Boost score based on keyword density (frequency of matches)
  const totalDensity = patterns.reduce((sum, pattern) => sum + (keywordDensity[pattern] || 1), 0)
  const densityBoost = Math.min(totalDensity * 0.05, 0.3)

  return Math.min(score + densityBoost, 1.0)
}

/**
 * Gathers the indicators that led to the type classification
 */
function gatherIndicators(
  detectedType: AbstractionType,
  contentAnalysis: ContentAnalysis,
  metadataAnalysis: MetadataAnalysis
): string[] {
  const indicators: string[] = []

  // Add relevant content patterns
  switch (detectedType) {
    case 'skill':
      indicators.push(...contentAnalysis.skillPatterns.slice(0, 3).map(p => `skill pattern: ${p}`))
      break
    case 'subagent':
      indicators.push(...contentAnalysis.subagentPatterns.slice(0, 3).map(p => `subagent pattern: ${p}`))
      break
    case 'command':
      indicators.push(...contentAnalysis.commandPatterns.slice(0, 3).map(p => `command pattern: ${p}`))
      break
    case 'rule':
      indicators.push(...contentAnalysis.rulePatterns.slice(0, 3).map(p => `rule pattern: ${p}`))
      break
  }

  // Add structural features that support the classification
  const relevantStructural = contentAnalysis.structuralFeatures.filter(feature => {
    switch (detectedType) {
      case 'command': return feature === 'slashCommand'
      case 'subagent': return ['stepPattern', 'procedurePattern', 'numberedList'].includes(feature)
      case 'skill': return ['examplePattern', 'notePattern'].includes(feature)
      default: return false
    }
  })
  indicators.push(...relevantStructural.map(f => `structural: ${f}`))

  // Add metadata hints
  indicators.push(...metadataAnalysis.typeHints.slice(0, 2))

  // Limit to most relevant indicators
  return indicators.slice(0, 5)
}