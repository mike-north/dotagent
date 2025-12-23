/**
 * Explain command for describing what a configuration does in natural language.
 * 
 * Analyzes configuration files and generates human-readable explanations
 * of their purpose, behavior, and relationships.
 */

import { BaseCommand, CommandOptions, CommandResult } from './base.js'
import { formatHeader, formatSuccess, formatWarning, formatError, formatBulletList } from '../utils/output.js'

interface ExplainOptions extends CommandOptions {
  detailed?: boolean
  format?: 'plain' | 'markdown'
  'show-metadata'?: boolean
  'include-examples'?: boolean
}

export class ExplainCommand extends BaseCommand {
  name = 'explain'
  description = 'Explain what a configuration does in natural language'
  
  /**
   * Execute the explain command to analyze and describe configurations
   */
  async execute(args: string[], options: ExplainOptions): Promise<CommandResult> {
    if (options.help) {
      this.showHelp()
      return this.success('Help displayed')
    }
    
    if (args.length === 0) {
      this.error(formatError('Input file required', 
        'Specify the configuration file to explain',
        'Example: explain .agent/skills/example.mdc'), options)
      return this.failure('Missing input file')
    }
    
    const { detailed = false, format = 'plain', 'show-metadata': showMetadata = false, 'include-examples': includeExamples = false } = options
    
    this.log(formatHeader('Configuration Explainer'), options)
    this.verbose('Starting configuration analysis...', options)
    
    try {
      const inputFile = args[0]
      return this.explainConfiguration(inputFile, detailed, format, showMetadata, includeExamples, options)
      
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.error(formatError('Explanation failed', message), options)
      return this.failure('Explanation failed', 1)
    }
  }
  
  /**
   * Display comprehensive help for the explain command
   */
  protected showHelp(): void {
    console.log(`
${formatHeader('explain - Explain Configuration in Natural Language')}

${this.description}

USAGE:
  explain <config-file> [options]

ARGUMENTS:
  config-file         Path to configuration file to explain

OPTIONS:
  --detailed          Provide detailed analysis with technical details
  --format FORMAT     Output format: plain (default) or markdown
  --show-metadata     Include metadata information in explanation
  --include-examples  Include usage examples and patterns
  --verbose           Enable verbose analysis output
  --quiet             Suppress non-essential output
  --help              Show this help message

EXAMPLES:
  explain .agent/skills/review.mdc
  explain .agent/subagents/docs.mdc --detailed
  explain .agent/commands/build.mdc --format=markdown
  explain .agent/rules/format.mdc --show-metadata --include-examples

OUTPUT SECTIONS:
  • Purpose and description
  • Configuration type and structure
  • Key capabilities or behaviors
  • Dependencies and relationships
  • Usage patterns and examples (optional)
  • Metadata information (optional)
  • Technical details (detailed mode)

SUPPORTED FORMATS:
  plain               Human-readable text output (default)
  markdown            Structured markdown with headers and formatting
`)
  }
  
  /**
   * Explain a configuration file
   */
  private async explainConfiguration(
    inputFile: string,
    detailed: boolean,
    format: string,
    showMetadata: boolean,
    includeExamples: boolean,
    options: ExplainOptions
  ): Promise<CommandResult> {
    this.verbose(`Analyzing: ${inputFile}`, options)
    this.verbose(`Detail level: ${detailed ? 'detailed' : 'summary'}`, options)
    this.verbose(`Output format: ${format}`, options)
    
    // TODO: Use sync-engine wrapper to load and analyze the configuration
    const analysis = await this.analyzeConfiguration(inputFile, options)
    
    if (!analysis.success) {
      return this.failure(analysis.error || 'Failed to analyze configuration', 1)
    }
    
    const explanation = this.generateExplanation(analysis, detailed, format, showMetadata, includeExamples)
    
    this.log(explanation, options)
    
    return this.success('Configuration explained successfully', {
      file: inputFile,
      type: analysis.type,
      format: format
    })
  }
  
  /**
   * Analyze configuration file to extract structure and meaning
   */
  private async analyzeConfiguration(inputFile: string, options: ExplainOptions): Promise<ConfigurationAnalysis> {
    this.verbose(`Reading file: ${inputFile}`, options)
    
    // TODO: Use sync-engine wrapper for actual file analysis
    // This is a placeholder implementation
    
    try {
      // Mock analysis - replace with actual sync-engine integration
      const mockAnalysis: ConfigurationAnalysis = {
        success: true,
        type: 'skill',
        title: 'Code Review Assistant',
        description: 'A skill for performing automated code reviews with best practices validation',
        structure: {
          sections: ['Purpose', 'Capabilities', 'Parameters', 'Usage Examples'],
          complexity: 'medium',
          completeness: 0.8
        },
        capabilities: [
          'Analyze code quality and style consistency',
          'Check for common security vulnerabilities',
          'Validate adherence to team coding standards',
          'Suggest improvements and optimizations'
        ],
        dependencies: [
          'ESLint configuration',
          'TypeScript compiler',
          'Security scanning tools'
        ],
        metadata: {
          author: 'Development Team',
          created: '2024-01-15',
          modified: '2024-01-20',
          version: '2.1.0',
          tags: ['code-quality', 'automation', 'review']
        },
        relationships: [
          {
            type: 'uses',
            target: '.agent/rules/typescript-standards.mdc',
            description: 'References TypeScript coding standards'
          },
          {
            type: 'triggers',
            target: '.agent/commands/run-tests.mdc',
            description: 'Executes tests after review completion'
          }
        ],
        examples: [
          {
            scenario: 'Pull Request Review',
            usage: 'Automatically triggered on PR creation',
            outcome: 'Generates review comments and suggestions'
          },
          {
            scenario: 'Pre-commit Hook',
            usage: 'Validates changes before commit',
            outcome: 'Prevents commit if critical issues found'
          }
        ],
        technicalDetails: {
          implementation: 'Node.js with plugin architecture',
          performance: 'Typical analysis time: 2-5 seconds',
          limitations: ['Limited to TypeScript/JavaScript files', 'Requires ESLint configuration'],
          configuration: ['configurable rule sets', 'adjustable severity levels']
        }
      }
      
      return mockAnalysis
      
    } catch (error) {
      return {
        success: false,
        error: `Failed to read or analyze file: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }
  
  /**
   * Generate human-readable explanation from analysis
   */
  private generateExplanation(
    analysis: ConfigurationAnalysis,
    detailed: boolean,
    format: string,
    showMetadata: boolean,
    includeExamples: boolean
  ): string {
    if (format === 'markdown') {
      return this.generateMarkdownExplanation(analysis, detailed, showMetadata, includeExamples)
    }
    
    return this.generatePlainExplanation(analysis, detailed, showMetadata, includeExamples)
  }
  
  /**
   * Generate plain text explanation
   */
  private generatePlainExplanation(
    analysis: ConfigurationAnalysis,
    detailed: boolean,
    showMetadata: boolean,
    includeExamples: boolean
  ): string {
    let explanation = ''
    
    // Header
    explanation += `Configuration Type: ${analysis.type?.toUpperCase() || 'UNKNOWN'}\n`
    explanation += `Title: ${analysis.title || 'Unnamed Configuration'}\n\n`
    
    // Main description
    if (analysis.description) {
      explanation += `Purpose:\n${analysis.description}\n\n`
    }
    
    // Key capabilities
    if (analysis.capabilities && analysis.capabilities.length > 0) {
      explanation += 'Key Capabilities:\n'
      explanation += analysis.capabilities.map(cap => `• ${cap}`).join('\n')
      explanation += '\n\n'
    }
    
    // Dependencies
    if (analysis.dependencies && analysis.dependencies.length > 0) {
      explanation += 'Dependencies:\n'
      explanation += analysis.dependencies.map(dep => `• ${dep}`).join('\n')
      explanation += '\n\n'
    }
    
    // Relationships
    if (analysis.relationships && analysis.relationships.length > 0) {
      explanation += 'Related Configurations:\n'
      explanation += analysis.relationships
        .map(rel => `• ${rel.type.toUpperCase()}: ${rel.target} - ${rel.description}`)
        .join('\n')
      explanation += '\n\n'
    }
    
    // Examples
    if (includeExamples && analysis.examples && analysis.examples.length > 0) {
      explanation += 'Usage Examples:\n'
      for (const example of analysis.examples) {
        explanation += `\n${example.scenario}:\n`
        explanation += `  Usage: ${example.usage}\n`
        explanation += `  Outcome: ${example.outcome}\n`
      }
      explanation += '\n'
    }
    
    // Structure analysis (detailed mode)
    if (detailed && analysis.structure) {
      explanation += 'Structure Analysis:\n'
      explanation += `• Sections: ${analysis.structure.sections?.join(', ') || 'Unknown'}\n`
      explanation += `• Complexity: ${analysis.structure.complexity || 'Unknown'}\n`
      explanation += `• Completeness: ${Math.round((analysis.structure.completeness || 0) * 100)}%\n\n`
    }
    
    // Technical details (detailed mode)
    if (detailed && analysis.technicalDetails) {
      const tech = analysis.technicalDetails
      explanation += 'Technical Details:\n'
      
      if (tech.implementation) {
        explanation += `• Implementation: ${tech.implementation}\n`
      }
      
      if (tech.performance) {
        explanation += `• Performance: ${tech.performance}\n`
      }
      
      if (tech.configuration && tech.configuration.length > 0) {
        explanation += `• Configuration Options: ${tech.configuration.join(', ')}\n`
      }
      
      if (tech.limitations && tech.limitations.length > 0) {
        explanation += '• Limitations:\n'
        explanation += tech.limitations.map(limit => `  - ${limit}`).join('\n')
      }
      
      explanation += '\n'
    }
    
    // Metadata
    if (showMetadata && analysis.metadata) {
      explanation += 'Metadata:\n'
      explanation += Object.entries(analysis.metadata)
        .map(([key, value]) => `• ${key}: ${value}`)
        .join('\n')
      explanation += '\n'
    }
    
    return explanation.trim()
  }
  
  /**
   * Generate markdown explanation
   */
  private generateMarkdownExplanation(
    analysis: ConfigurationAnalysis,
    detailed: boolean,
    showMetadata: boolean,
    includeExamples: boolean
  ): string {
    let explanation = ''
    
    // Header
    explanation += `# ${analysis.title || 'Configuration Explanation'}\n\n`
    explanation += `**Type:** ${analysis.type?.charAt(0).toUpperCase()}${analysis.type?.slice(1)} || 'Unknown'}\n\n`
    
    // Main description
    if (analysis.description) {
      explanation += `## Purpose\n\n${analysis.description}\n\n`
    }
    
    // Key capabilities
    if (analysis.capabilities && analysis.capabilities.length > 0) {
      explanation += '## Key Capabilities\n\n'
      explanation += analysis.capabilities.map(cap => `- ${cap}`).join('\n')
      explanation += '\n\n'
    }
    
    // Dependencies
    if (analysis.dependencies && analysis.dependencies.length > 0) {
      explanation += '## Dependencies\n\n'
      explanation += analysis.dependencies.map(dep => `- ${dep}`).join('\n')
      explanation += '\n\n'
    }
    
    // Relationships
    if (analysis.relationships && analysis.relationships.length > 0) {
      explanation += '## Related Configurations\n\n'
      for (const rel of analysis.relationships) {
        explanation += `- **${rel.type.toUpperCase()}**: \`${rel.target}\` - ${rel.description}\n`
      }
      explanation += '\n'
    }
    
    // Examples
    if (includeExamples && analysis.examples && analysis.examples.length > 0) {
      explanation += '## Usage Examples\n\n'
      for (const example of analysis.examples) {
        explanation += `### ${example.scenario}\n\n`
        explanation += `**Usage:** ${example.usage}\n\n`
        explanation += `**Outcome:** ${example.outcome}\n\n`
      }
    }
    
    // Structure analysis (detailed mode)
    if (detailed && analysis.structure) {
      explanation += '## Structure Analysis\n\n'
      explanation += `- **Sections:** ${analysis.structure.sections?.join(', ') || 'Unknown'}\n`
      explanation += `- **Complexity:** ${analysis.structure.complexity || 'Unknown'}\n`
      explanation += `- **Completeness:** ${Math.round((analysis.structure.completeness || 0) * 100)}%\n\n`
    }
    
    // Technical details (detailed mode)
    if (detailed && analysis.technicalDetails) {
      const tech = analysis.technicalDetails
      explanation += '## Technical Details\n\n'
      
      if (tech.implementation) {
        explanation += `**Implementation:** ${tech.implementation}\n\n`
      }
      
      if (tech.performance) {
        explanation += `**Performance:** ${tech.performance}\n\n`
      }
      
      if (tech.configuration && tech.configuration.length > 0) {
        explanation += `**Configuration Options:** ${tech.configuration.join(', ')}\n\n`
      }
      
      if (tech.limitations && tech.limitations.length > 0) {
        explanation += '**Limitations:**\n\n'
        explanation += tech.limitations.map(limit => `- ${limit}`).join('\n')
        explanation += '\n\n'
      }
    }
    
    // Metadata
    if (showMetadata && analysis.metadata) {
      explanation += '## Metadata\n\n'
      explanation += '| Property | Value |\n'
      explanation += '|----------|-------|\n'
      explanation += Object.entries(analysis.metadata)
        .map(([key, value]) => `| ${key} | ${value} |`)
        .join('\n')
      explanation += '\n\n'
    }
    
    return explanation.trim()
  }
}

/**
 * Configuration analysis result
 */
interface ConfigurationAnalysis {
  success: boolean
  type?: 'skill' | 'subagent' | 'command' | 'rule'
  title?: string
  description?: string
  structure?: {
    sections?: string[]
    complexity?: 'low' | 'medium' | 'high'
    completeness?: number // 0-1
  }
  capabilities?: string[]
  dependencies?: string[]
  metadata?: Record<string, unknown>
  relationships?: ConfigurationRelationship[]
  examples?: UsageExample[]
  technicalDetails?: TechnicalDetails
  error?: string
}

/**
 * Configuration relationship
 */
interface ConfigurationRelationship {
  type: 'uses' | 'triggers' | 'depends-on' | 'extends' | 'implements'
  target: string
  description: string
}

/**
 * Usage example
 */
interface UsageExample {
  scenario: string
  usage: string
  outcome: string
}

/**
 * Technical implementation details
 */
interface TechnicalDetails {
  implementation?: string
  performance?: string
  limitations?: string[]
  configuration?: string[]
}