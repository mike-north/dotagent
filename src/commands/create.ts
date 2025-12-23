/**
 * Create command for generating configurations from natural language.
 * 
 * Transforms natural language descriptions into structured configuration files
 * for skills, subagents, commands, and rules.
 */

import { BaseCommand, CommandOptions, CommandResult } from './base.js'
import { formatHeader, formatSuccess, formatWarning, formatError, formatBulletList } from '../utils/output.js'

interface CreateOptions extends CommandOptions {
  type?: 'skill' | 'subagent' | 'command' | 'rule'
  output?: string
  template?: string
  interactive?: boolean
}

export class CreateCommand extends BaseCommand {
  name = 'create'
  description = 'Generate configurations from natural language intent'
  
  /**
   * Execute the create command to generate configurations
   */
  async execute(args: string[], options: CreateOptions): Promise<CommandResult> {
    if (options.help) {
      this.showHelp()
      return this.success('Help displayed')
    }
    
    const { type, output, template, interactive = false } = options
    
    if (args.length === 0 && !interactive) {
      this.error(formatError('Description required', 
        'Provide a natural language description of what you want to create',
        'Use --interactive for guided creation'), options)
      return this.failure('Missing description')
    }
    
    this.log(formatHeader('Configuration Generator'), options)
    this.verbose('Starting configuration generation...', options)
    
    try {
      if (interactive) {
        return this.handleInteractiveMode(options)
      }
      
      const description = args.join(' ')
      return this.generateConfiguration(description, type, output, template, options)
      
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.error(formatError('Configuration generation failed', message), options)
      return this.failure('Generation failed', 1)
    }
  }
  
  /**
   * Display comprehensive help for the create command
   */
  protected showHelp(): void {
    console.log(`
${formatHeader('create - Generate Configurations from Natural Language')}

${this.description}

USAGE:
  create "<description>" [options]
  create --interactive [options]

ARGUMENTS:
  description         Natural language description of what to create

OPTIONS:
  --type TYPE         Configuration type: skill, subagent, command, or rule
  --output PATH       Output file path (default: auto-generated)
  --template NAME     Use specific template (default: standard)
  --interactive       Use interactive guided creation
  --verbose           Enable verbose output
  --quiet             Suppress non-essential output
  --help              Show this help message

EXAMPLES:
  create "A skill for code review"
  create "Command to run tests" --type=command
  create "Subagent for documentation" --output=.agent/subagents/docs.mdc
  create --interactive
  create "Rule for TypeScript formatting" --template=eslint

SUPPORTED TYPES:
  skill               Reusable capability with specific expertise
  subagent            Autonomous agent with defined role and goals
  command             Executable action with parameters and validation
  rule                Guideline or constraint for behavior

TEMPLATES:
  standard            Default template for the type
  minimal             Minimal configuration with basic fields
  comprehensive       Full-featured configuration with all options
  custom              User-defined template (requires --template-file)
`)
  }
  
  /**
   * Handle interactive mode for guided configuration creation
   */
  private async handleInteractiveMode(options: CreateOptions): Promise<CommandResult> {
    this.log(formatHeader('Interactive Configuration Creator'), options)
    
    // TODO: Implement interactive prompts using a prompt library
    // This is a placeholder showing the expected flow
    
    this.log('Interactive mode would guide you through:', options)
    this.log(formatBulletList([
      'Select configuration type (skill/subagent/command/rule)',
      'Provide natural language description',
      'Choose template and options',
      'Review and confirm generated configuration',
      'Save to specified location'
    ]), options)
    
    this.log(formatWarning('Interactive mode not yet implemented'), options)
    this.log('Use direct description mode for now: create "your description"', options)
    
    return this.failure('Interactive mode not available', 2)
  }
  
  /**
   * Generate configuration from natural language description
   */
  private async generateConfiguration(
    description: string, 
    type: string | undefined, 
    outputPath: string | undefined, 
    template: string | undefined, 
    options: CreateOptions
  ): Promise<CommandResult> {
    this.verbose(`Description: "${description}"`, options)
    this.verbose(`Type: ${type || 'auto-detect'}`, options)
    this.verbose(`Template: ${template || 'standard'}`, options)
    
    // TODO: Integrate with sync-engine wrapper API for actual generation
    const analysis = this.analyzeDescription(description)
    const detectedType = type || analysis.suggestedType
    const outputFile = outputPath || this.generateOutputPath(detectedType, analysis.suggestedName)
    
    this.log(`Detected type: ${detectedType}`, options)
    this.log(`Output path: ${outputFile}`, options)
    
    const generatedConfig = this.generateConfigurationContent(description, detectedType, template || 'standard', analysis)
    
    // TODO: Write the generated configuration to file using sync-engine wrapper
    this.verbose('Generated configuration:', options)
    if (options.verbose) {
      console.log('---')
      console.log(generatedConfig)
      console.log('---')
    }
    
    this.log(formatSuccess(`Generated ${detectedType} configuration`), options)
    this.log(`Saved to: ${outputFile}`, options)
    
    return this.success('Configuration created successfully', {
      type: detectedType,
      file: outputFile,
      description: description
    })
  }
  
  /**
   * Analyze natural language description to extract intent
   */
  private analyzeDescription(description: string): ConfigurationAnalysis {
    // TODO: Implement actual NL analysis using sync-engine wrapper
    // This is a placeholder implementation
    
    const lowercased = description.toLowerCase()
    
    let suggestedType: 'skill' | 'subagent' | 'command' | 'rule' = 'rule'
    let suggestedName = 'generated-config'
    
    // Simple keyword-based type detection
    if (lowercased.includes('skill') || lowercased.includes('capability') || lowercased.includes('expertise')) {
      suggestedType = 'skill'
      suggestedName = this.extractNameFromDescription(description, 'skill')
    } else if (lowercased.includes('subagent') || lowercased.includes('agent') || lowercased.includes('role')) {
      suggestedType = 'subagent'
      suggestedName = this.extractNameFromDescription(description, 'agent')
    } else if (lowercased.includes('command') || lowercased.includes('run') || lowercased.includes('execute')) {
      suggestedType = 'command'
      suggestedName = this.extractNameFromDescription(description, 'command')
    } else {
      suggestedType = 'rule'
      suggestedName = this.extractNameFromDescription(description, 'rule')
    }
    
    return {
      suggestedType,
      suggestedName,
      confidence: 0.7,
      keywords: this.extractKeywords(description),
      intent: this.extractIntent(description)
    }
  }
  
  /**
   * Extract a suitable name from the description
   */
  private extractNameFromDescription(description: string, type: string): string {
    // TODO: Implement more sophisticated name extraction
    const words = description.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !this.isStopWord(word))
    
    const relevantWords = words.slice(0, 3).join('-')
    return relevantWords || `${type}-config`
  }
  
  /**
   * Check if a word is a stop word that should be filtered
   */
  private isStopWord(word: string): boolean {
    const stopWords = ['a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'will', 'with']
    return stopWords.includes(word)
  }
  
  /**
   * Extract keywords from description
   */
  private extractKeywords(description: string): string[] {
    // TODO: Implement more sophisticated keyword extraction
    return description.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !this.isStopWord(word))
      .slice(0, 10)
  }
  
  /**
   * Extract intent from description
   */
  private extractIntent(description: string): string {
    // TODO: Implement intent analysis using sync-engine wrapper
    return description.trim()
  }
  
  /**
   * Generate output file path
   */
  private generateOutputPath(type: string, name: string): string {
    const sanitizedName = name.replace(/[^a-z0-9-]/gi, '-').toLowerCase()
    return `.agent/${type}s/${sanitizedName}.mdc`
  }
  
  /**
   * Generate configuration content based on type and analysis
   */
  private generateConfigurationContent(
    description: string, 
    type: string, 
    template: string, 
    analysis: ConfigurationAnalysis
  ): string {
    // TODO: Use sync-engine wrapper to generate actual configuration content
    // This is a placeholder implementation
    
    const timestamp = new Date().toISOString()
    const { suggestedName, keywords, intent } = analysis
    
    let content = `# ${suggestedName}\n\n`
    content += `> Generated from: "${description}"\n`
    content += `> Type: ${type}\n`
    content += `> Template: ${template}\n`
    content += `> Created: ${timestamp}\n\n`
    
    switch (type) {
      case 'skill':
        content += this.generateSkillContent(intent, keywords)
        break
      case 'subagent':
        content += this.generateSubagentContent(intent, keywords)
        break
      case 'command':
        content += this.generateCommandContent(intent, keywords)
        break
      case 'rule':
        content += this.generateRuleContent(intent, keywords)
        break
      default:
        content += `## Description\n\n${intent}\n\n`
    }
    
    content += `## Keywords\n\n${keywords.map(k => `- ${k}`).join('\n')}\n`
    
    return content
  }
  
  /**
   * Generate skill-specific content
   */
  private generateSkillContent(intent: string, keywords: string[]): string {
    return `## Skill Definition

### Purpose
${intent}

### Capabilities
- TODO: Define specific capabilities
- TODO: Add skill parameters
- TODO: Specify expected outputs

### Usage
\`\`\`
# TODO: Add usage examples
\`\`\`

### Dependencies
- TODO: List required dependencies or other skills

`
  }
  
  /**
   * Generate subagent-specific content
   */
  private generateSubagentContent(intent: string, keywords: string[]): string {
    return `## Subagent Definition

### Role
${intent}

### Goals
- TODO: Define primary objectives
- TODO: Add success criteria
- TODO: Specify constraints

### Behavior
- TODO: Define decision-making rules
- TODO: Add interaction patterns
- TODO: Specify escalation procedures

### Context
- TODO: Required context information
- TODO: Available tools and resources

`
  }
  
  /**
   * Generate command-specific content
   */
  private generateCommandContent(intent: string, keywords: string[]): string {
    return `## Command Definition

### Description
${intent}

### Parameters
- TODO: Define required parameters
- TODO: Add optional parameters
- TODO: Specify validation rules

### Execution
\`\`\`bash
# TODO: Add command implementation
echo "Command not implemented"
\`\`\`

### Validation
- TODO: Define pre-conditions
- TODO: Add post-conditions
- TODO: Specify error handling

`
  }
  
  /**
   * Generate rule-specific content
   */
  private generateRuleContent(intent: string, keywords: string[]): string {
    return `## Rule Definition

### Description
${intent}

### Conditions
- TODO: Define when this rule applies
- TODO: Add triggering conditions
- TODO: Specify context requirements

### Actions
- TODO: Define required actions
- TODO: Add validation steps
- TODO: Specify exceptions

### Examples
- ✅ Good: TODO: Add positive examples
- ❌ Bad: TODO: Add negative examples

`
  }
}

/**
 * Analysis result for natural language description
 */
interface ConfigurationAnalysis {
  suggestedType: 'skill' | 'subagent' | 'command' | 'rule'
  suggestedName: string
  confidence: number
  keywords: string[]
  intent: string
}