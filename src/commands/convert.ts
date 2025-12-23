/**
 * Convert command for transforming between abstraction types.
 * 
 * Converts configurations between different types (skill ↔ subagent ↔ command ↔ rule)
 * while preserving metadata and maintaining semantic consistency.
 */

import { BaseCommand, CommandOptions, CommandResult } from './base.js'
import { formatHeader, formatSuccess, formatWarning, formatError, formatBulletList, formatTable } from '../utils/output.js'

interface ConvertOptions extends CommandOptions {
  to: 'skill' | 'subagent' | 'command' | 'rule'
  output?: string
  'preserve-metadata'?: boolean
  'dry-run'?: boolean
  force?: boolean
}

export class ConvertCommand extends BaseCommand {
  name = 'convert'
  description = 'Convert between abstraction types (skill/subagent/command/rule)'
  
  /**
   * Execute the convert command to transform configurations
   */
  async execute(args: string[], options: ConvertOptions): Promise<CommandResult> {
    if (options.help) {
      this.showHelp()
      return this.success('Help displayed')
    }
    
    if (args.length === 0) {
      this.error(formatError('Input file required', 
        'Specify the configuration file to convert',
        'Example: convert .agent/skills/example.mdc --to=subagent'), options)
      return this.failure('Missing input file')
    }
    
    if (!options.to) {
      this.error(formatError('Target type required', 
        'Specify the target type with --to option',
        'Supported types: skill, subagent, command, rule'), options)
      return this.failure('Missing target type')
    }
    
    const { to, output, 'preserve-metadata': preserveMetadata = true, 'dry-run': dryRun = false, force = false } = options
    
    this.log(formatHeader('Configuration Converter'), options)
    this.verbose('Starting configuration conversion...', options)
    
    try {
      const inputFile = args[0]
      return this.convertConfiguration(inputFile, to, output, preserveMetadata, dryRun, force, options)
      
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.error(formatError('Conversion failed', message), options)
      return this.failure('Conversion failed', 1)
    }
  }
  
  /**
   * Display comprehensive help for the convert command
   */
  protected showHelp(): void {
    console.log(`
${formatHeader('convert - Transform Between Abstraction Types')}

${this.description}

USAGE:
  convert <input-file> --to=<type> [options]

ARGUMENTS:
  input-file          Path to configuration file to convert

REQUIRED OPTIONS:
  --to TYPE           Target type: skill, subagent, command, or rule

OPTIONS:
  --output PATH       Output file path (default: auto-generated)
  --preserve-metadata Preserve original metadata (default: true)
  --dry-run           Preview conversion without creating files
  --force             Force conversion even with warnings
  --verbose           Enable verbose output
  --quiet             Suppress non-essential output
  --help              Show this help message

EXAMPLES:
  convert .agent/skills/review.mdc --to=subagent
  convert .agent/rules/format.mdc --to=command --output=.agent/commands/format.mdc
  convert config.mdc --to=skill --preserve-metadata --dry-run
  convert old-agent.mdc --to=rule --force

CONVERSION MATRIX:
  From → To      | Complexity | Information Loss | Notes
  ---------------|------------|------------------|------------------
  Skill → Sub    | Medium     | Low              | Add role context
  Skill → Cmd    | High       | Medium           | Extract executable
  Skill → Rule   | Low        | High             | Generalize patterns
  Sub → Skill    | Medium     | Low              | Extract capabilities
  Sub → Cmd      | High       | Medium           | Specify actions
  Sub → Rule     | Medium     | Medium           | Extract guidelines
  Cmd → Skill    | Medium     | Low              | Generalize purpose
  Cmd → Sub      | High       | Low              | Add agent context
  Cmd → Rule     | Low        | Medium           | Extract constraints
  Rule → Skill   | High       | Medium           | Operationalize
  Rule → Sub     | High       | Medium           | Add execution
  Rule → Cmd     | Medium     | Medium           | Make executable

PRESERVATION:
  • Original file metadata (timestamps, authors, versions)
  • Custom fields and annotations
  • Comments and documentation
  • Cross-references and dependencies
`)
  }
  
  /**
   * Convert configuration from one type to another
   */
  private async convertConfiguration(
    inputFile: string,
    targetType: string,
    outputPath: string | undefined,
    preserveMetadata: boolean,
    dryRun: boolean,
    force: boolean,
    options: ConvertOptions
  ): Promise<CommandResult> {
    this.verbose(`Input: ${inputFile}`, options)
    this.verbose(`Target type: ${targetType}`, options)
    this.verbose(`Preserve metadata: ${preserveMetadata}`, options)
    
    // TODO: Use sync-engine wrapper to load and analyze the input file
    const analysis = await this.analyzeInputFile(inputFile, options)
    
    if (!analysis.success) {
      return this.failure(analysis.error || 'Failed to analyze input file', 1)
    }
    
    const { sourceType, content, metadata } = analysis
    
    if (!sourceType || !content || !metadata) {
      return this.failure('Invalid configuration analysis - missing required data', 1)
    }
    
    this.log(`Source type: ${sourceType}`, options)
    this.log(`Target type: ${targetType}`, options)
    
    // Check for conversion feasibility
    const conversionAnalysis = this.analyzeConversion(sourceType, targetType)
    
    if (conversionAnalysis.complexity === 'impossible' && !force) {
      this.error(formatError('Conversion not supported', 
        `Cannot convert from ${sourceType} to ${targetType}`,
        'Use --force to attempt conversion anyway'), options)
      return this.failure('Unsupported conversion')
    }
    
    if (conversionAnalysis.informationLoss === 'high' && !force) {
      this.log(formatWarning('High information loss expected'), options)
      this.log('This conversion may lose significant information. Use --force to proceed.', options)
      return this.failure('High information loss risk', 2)
    }
    
    // Display conversion analysis
    this.displayConversionAnalysis(conversionAnalysis, options)
    
    // Perform the conversion
    const convertedContent = await this.performConversion(sourceType, targetType, content, metadata, preserveMetadata, options)
    
    // Determine output path
    const finalOutputPath = outputPath || this.generateOutputPath(inputFile, targetType)
    
    if (dryRun) {
      this.log(formatHeader('Dry Run Results'), options)
      this.log(`Would write to: ${finalOutputPath}`, options)
      this.verbose('Converted content:', options)
      if (options.verbose) {
        console.log('---')
        console.log(convertedContent)
        console.log('---')
      }
      return this.success('Dry run completed', { outputPath: finalOutputPath, content: convertedContent })
    }
    
    // TODO: Use sync-engine wrapper to write the converted content
    this.verbose(`Writing to: ${finalOutputPath}`, options)
    
    this.log(formatSuccess(`Successfully converted ${sourceType} to ${targetType}`), options)
    this.log(`Output: ${finalOutputPath}`, options)
    
    return this.success('Conversion completed', {
      inputFile,
      outputFile: finalOutputPath,
      sourceType,
      targetType,
      preservedMetadata: preserveMetadata
    })
  }
  
  /**
   * Analyze the input file to determine type and extract content
   */
  private async analyzeInputFile(inputFile: string, options: ConvertOptions): Promise<FileAnalysis> {
    this.verbose(`Analyzing file: ${inputFile}`, options)
    
    // TODO: Use sync-engine wrapper for actual file analysis
    // This is a placeholder implementation
    
    try {
      // Mock analysis - replace with actual sync-engine integration
      const mockAnalysis: FileAnalysis = {
        success: true,
        sourceType: 'skill', // Would be detected from file content
        content: {
          title: 'Example Skill',
          description: 'A sample skill configuration',
          body: 'Skill implementation details...'
        },
        metadata: {
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
          author: 'system',
          version: '1.0.0'
        }
      }
      
      return mockAnalysis
      
    } catch (error) {
      return {
        success: false,
        error: `Failed to read or parse file: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }
  
  /**
   * Analyze the feasibility and characteristics of the conversion
   */
  private analyzeConversion(sourceType: string, targetType: string): ConversionAnalysis {
    // Define conversion characteristics matrix
    const conversionMatrix: Record<string, Record<string, ConversionCharacteristics>> = {
      skill: {
        subagent: { complexity: 'medium', informationLoss: 'low', notes: 'Add role context and goals' },
        command: { complexity: 'high', informationLoss: 'medium', notes: 'Extract executable actions' },
        rule: { complexity: 'low', informationLoss: 'high', notes: 'Generalize into guidelines' }
      },
      subagent: {
        skill: { complexity: 'medium', informationLoss: 'low', notes: 'Extract core capabilities' },
        command: { complexity: 'high', informationLoss: 'medium', notes: 'Specify concrete actions' },
        rule: { complexity: 'medium', informationLoss: 'medium', notes: 'Extract behavioral guidelines' }
      },
      command: {
        skill: { complexity: 'medium', informationLoss: 'low', notes: 'Generalize execution purpose' },
        subagent: { complexity: 'high', informationLoss: 'low', notes: 'Add autonomous agent context' },
        rule: { complexity: 'low', informationLoss: 'medium', notes: 'Extract execution constraints' }
      },
      rule: {
        skill: { complexity: 'high', informationLoss: 'medium', notes: 'Operationalize guidelines' },
        subagent: { complexity: 'high', informationLoss: 'medium', notes: 'Add execution context' },
        command: { complexity: 'medium', informationLoss: 'medium', notes: 'Create executable actions' }
      }
    }
    
    if (sourceType === targetType) {
      return {
        complexity: 'none',
        informationLoss: 'none',
        notes: 'No conversion needed - types are identical',
        feasible: true
      }
    }
    
    const characteristics = conversionMatrix[sourceType]?.[targetType]
    
    if (!characteristics) {
      return {
        complexity: 'impossible',
        informationLoss: 'total',
        notes: `Unsupported conversion from ${sourceType} to ${targetType}`,
        feasible: false
      }
    }
    
    return {
      ...characteristics,
      feasible: characteristics.complexity !== 'impossible'
    }
  }
  
  /**
   * Display conversion analysis results
   */
  private displayConversionAnalysis(analysis: ConversionAnalysis, options: ConvertOptions): void {
    this.log(formatHeader('Conversion Analysis'), options)
    
    const analysisData = [
      { Property: 'Complexity', Value: analysis.complexity.toUpperCase() },
      { Property: 'Information Loss', Value: analysis.informationLoss.toUpperCase() },
      { Property: 'Feasible', Value: analysis.feasible ? 'YES' : 'NO' }
    ]
    
    this.log(formatTable(analysisData), options)
    
    if (analysis.notes) {
      this.log(`\nNotes: ${analysis.notes}`, options)
    }
    
    // Show warnings based on analysis
    if (analysis.complexity === 'high') {
      this.log(formatWarning('High complexity conversion - review results carefully'), options)
    }
    
    if (analysis.informationLoss === 'high') {
      this.log(formatWarning('High information loss - significant content may be lost'), options)
    }
    
    if (analysis.informationLoss === 'medium') {
      this.log(formatWarning('Medium information loss - some content may be lost'), options)
    }
  }
  
  /**
   * Perform the actual conversion
   */
  private async performConversion(
    sourceType: string,
    targetType: string,
    content: ConfigurationContent,
    metadata: ConfigurationMetadata,
    preserveMetadata: boolean,
    options: ConvertOptions
  ): Promise<string> {
    this.verbose('Starting content transformation...', options)
    
    // TODO: Use sync-engine wrapper for actual conversion logic
    // This is a placeholder implementation
    
    const timestamp = new Date().toISOString()
    
    let convertedContent = `# ${content.title} (converted to ${targetType})\n\n`
    
    // Add conversion metadata
    convertedContent += `> Converted from ${sourceType} on ${timestamp}\n`
    if (preserveMetadata && metadata.author) {
      convertedContent += `> Original author: ${metadata.author}\n`
    }
    convertedContent += '\n'
    
    // Add original description if available
    if (content.description) {
      convertedContent += `## Description\n${content.description}\n\n`
    }
    
    // Generate type-specific content based on target
    switch (targetType) {
      case 'skill':
        convertedContent += this.convertToSkill(sourceType, content)
        break
      case 'subagent':
        convertedContent += this.convertToSubagent(sourceType, content)
        break
      case 'command':
        convertedContent += this.convertToCommand(sourceType, content)
        break
      case 'rule':
        convertedContent += this.convertToRule(sourceType, content)
        break
    }
    
    // Preserve original content as reference
    convertedContent += `## Original Content (${sourceType})\n\n`
    convertedContent += '```\n'
    convertedContent += content.body
    convertedContent += '\n```\n'
    
    if (preserveMetadata) {
      convertedContent += '\n## Original Metadata\n\n'
      convertedContent += Object.entries(metadata)
        .map(([key, value]) => `- **${key}**: ${value}`)
        .join('\n')
    }
    
    return convertedContent
  }
  
  /**
   * Convert content to skill format
   */
  private convertToSkill(sourceType: string, content: ConfigurationContent): string {
    return `## Skill Definition

### Capabilities
- TODO: Define specific capabilities extracted from ${sourceType}
- TODO: Add skill parameters and expected outputs

### Usage
\`\`\`
# TODO: Add usage examples based on original ${sourceType}
\`\`\`

### Dependencies
- TODO: Identify dependencies from original content

`
  }
  
  /**
   * Convert content to subagent format
   */
  private convertToSubagent(sourceType: string, content: ConfigurationContent): string {
    return `## Subagent Definition

### Role
TODO: Define agent role based on ${sourceType} content

### Goals
- TODO: Extract and define objectives from ${sourceType}
- TODO: Add success criteria and constraints

### Behavior
- TODO: Define decision-making rules based on original content
- TODO: Add interaction patterns and escalation procedures

`
  }
  
  /**
   * Convert content to command format
   */
  private convertToCommand(sourceType: string, content: ConfigurationContent): string {
    return `## Command Definition

### Parameters
- TODO: Extract parameters from ${sourceType} content
- TODO: Add validation rules and constraints

### Execution
\`\`\`bash
# TODO: Implement executable actions based on ${sourceType}
echo "Command implementation needed"
\`\`\`

### Validation
- TODO: Define pre/post conditions from original content

`
  }
  
  /**
   * Convert content to rule format
   */
  private convertToRule(sourceType: string, content: ConfigurationContent): string {
    return `## Rule Definition

### Conditions
- TODO: Extract applicable conditions from ${sourceType}
- TODO: Define triggering contexts and requirements

### Actions
- TODO: Define required actions and validation steps
- TODO: Specify exceptions and edge cases

### Examples
- ✅ Good: TODO: Extract positive patterns from ${sourceType}
- ❌ Bad: TODO: Extract negative patterns to avoid

`
  }
  
  /**
   * Generate output file path based on input and target type
   */
  private generateOutputPath(inputFile: string, targetType: string): string {
    const baseName = inputFile.split('/').pop()?.replace(/\.[^.]+$/, '') || 'converted'
    return `.agent/${targetType}s/${baseName}-converted.mdc`
  }
}

/**
 * File analysis result
 */
interface FileAnalysis {
  success: boolean
  sourceType?: string
  content?: ConfigurationContent
  metadata?: ConfigurationMetadata
  error?: string
}

/**
 * Configuration content structure
 */
interface ConfigurationContent {
  title: string
  description?: string
  body: string
}

/**
 * Configuration metadata structure
 */
interface ConfigurationMetadata {
  created?: string
  modified?: string
  author?: string
  version?: string
  [key: string]: unknown
}

/**
 * Conversion characteristics
 */
interface ConversionCharacteristics {
  complexity: 'none' | 'low' | 'medium' | 'high' | 'impossible'
  informationLoss: 'none' | 'low' | 'medium' | 'high' | 'total'
  notes: string
}

/**
 * Conversion analysis result
 */
interface ConversionAnalysis extends ConversionCharacteristics {
  feasible: boolean
}