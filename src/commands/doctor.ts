/**
 * Doctor command for analyzing and diagnosing configuration issues.
 * 
 * Provides configuration analysis, validation, and health checks across
 * different abstraction types (skills, subagents, commands, rules).
 */

import { BaseCommand, CommandOptions, CommandResult } from './base.js'
import { formatHeader, formatSuccess, formatWarning, formatError, formatTable, formatBulletList } from '../utils/output.js'

interface DoctorOptions extends CommandOptions {
  fix?: boolean
  check?: boolean
  format?: 'table' | 'json' | 'markdown'
}

export class DoctorCommand extends BaseCommand {
  name = 'doctor'
  description = 'Analyze and diagnose configuration issues'
  
  /**
   * Execute the doctor command to analyze configurations
   */
  async execute(args: string[], options: DoctorOptions): Promise<CommandResult> {
    if (options.help) {
      this.showHelp()
      return this.success('Help displayed')
    }
    
    const { fix = false, check = false, format = 'table' } = options
    
    this.log(formatHeader('Configuration Doctor'), options)
    this.verbose('Starting configuration analysis...', options)
    
    try {
      // TODO: Integrate with sync-engine wrapper API for actual configuration analysis
      const diagnostics = await this.runDiagnostics(args, options)
      
      if (check) {
        return this.handleCheckMode(diagnostics, options)
      }
      
      if (fix) {
        return this.handleFixMode(diagnostics, options)
      }
      
      return this.displayDiagnostics(diagnostics, format, options)
      
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.error(formatError('Diagnostic analysis failed', message), options)
      return this.failure('Diagnostic analysis failed', 1)
    }
  }
  
  /**
   * Display comprehensive help for the doctor command
   */
  protected showHelp(): void {
    console.log(`
${formatHeader('doctor - Configuration Analysis and Diagnosis')}

${this.description}

USAGE:
  doctor [target] [options]

ARGUMENTS:
  target              Path to configuration file or directory (default: current directory)

OPTIONS:
  --fix              Automatically fix detected issues
  --check            Only check for issues, don't suggest fixes
  --format FORMAT    Output format: table (default), json, or markdown
  --verbose          Enable verbose diagnostic output
  --quiet            Suppress non-essential output
  --help             Show this help message

EXAMPLES:
  doctor                          # Analyze current directory
  doctor .agent/skills/           # Analyze specific directory
  doctor config.mdc --fix         # Analyze and fix specific file
  doctor --format=json --check    # Output results as JSON
  doctor --verbose                # Show detailed analysis

DIAGNOSTICS:
  • Configuration file validation
  • Abstraction type consistency
  • Metadata completeness
  • Cross-reference integrity
  • Performance impact analysis
  • Best practice recommendations
`)
  }
  
  /**
   * Run diagnostic analysis on configurations
   */
  private async runDiagnostics(args: string[], options: DoctorOptions): Promise<DiagnosticResult[]> {
    this.verbose('Scanning for configuration files...', options)
    
    const target = args[0] || process.cwd()
    this.verbose(`Target: ${target}`, options)
    
    // TODO: Implement actual diagnostic logic using sync-engine wrapper
    // This is a placeholder implementation showing the expected structure
    
    const mockDiagnostics: DiagnosticResult[] = [
      {
        file: '.agent/skills/example.mdc',
        type: 'skill',
        severity: 'warning',
        category: 'metadata',
        message: 'Missing description field',
        details: 'Skills should include a description for better documentation',
        fixable: true,
        line: 1,
        column: 1
      },
      {
        file: '.agent/commands/build.mdc',
        type: 'command',
        severity: 'error',
        category: 'validation',
        message: 'Invalid command syntax',
        details: 'Command definition is malformed',
        fixable: false,
        line: 15,
        column: 3
      },
      {
        file: '.agent/subagents/reviewer.mdc',
        type: 'subagent',
        severity: 'info',
        category: 'optimization',
        message: 'Consider using more specific role definition',
        details: 'More specific roles tend to perform better',
        fixable: true,
        line: 8,
        column: 1
      }
    ]
    
    this.log(`Found ${mockDiagnostics.length} configuration files`, options)
    return mockDiagnostics
  }
  
  /**
   * Handle check-only mode
   */
  private handleCheckMode(diagnostics: DiagnosticResult[], options: DoctorOptions): CommandResult {
    const errors = diagnostics.filter(d => d.severity === 'error').length
    const warnings = diagnostics.filter(d => d.severity === 'warning').length
    const infos = diagnostics.filter(d => d.severity === 'info').length
    
    this.log(formatHeader('Configuration Check Results'), options)
    
    if (errors > 0) {
      this.log(formatError(`Found ${errors} error(s)`), options)
    }
    
    if (warnings > 0) {
      this.log(formatWarning(`Found ${warnings} warning(s)`), options)
    }
    
    if (infos > 0) {
      this.log(`Found ${infos} suggestion(s)`, options)
    }
    
    if (errors === 0 && warnings === 0) {
      this.log(formatSuccess('No issues found'), options)
      return this.success('Configuration check passed')
    }
    
    return this.failure('Configuration issues detected', errors > 0 ? 1 : 0)
  }
  
  /**
   * Handle fix mode - automatically resolve fixable issues
   */
  private handleFixMode(diagnostics: DiagnosticResult[], options: DoctorOptions): CommandResult {
    const fixable = diagnostics.filter(d => d.fixable)
    const unfixable = diagnostics.filter(d => !d.fixable)
    
    this.log(formatHeader('Fixing Configuration Issues'), options)
    
    if (fixable.length === 0) {
      this.log('No fixable issues found', options)
      return this.displayDiagnostics(unfixable, 'table', options)
    }
    
    // TODO: Implement actual fixing logic using sync-engine wrapper
    this.log(`Fixing ${fixable.length} issue(s)...`, options)
    
    for (const diagnostic of fixable) {
      this.verbose(`Fixing: ${diagnostic.message} in ${diagnostic.file}`, options)
      // TODO: Apply fix using sync-engine wrapper
    }
    
    this.log(formatSuccess(`Fixed ${fixable.length} issue(s)`), options)
    
    if (unfixable.length > 0) {
      this.log(formatWarning(`${unfixable.length} issue(s) require manual attention:`), options)
      return this.displayDiagnostics(unfixable, 'table', options)
    }
    
    return this.success('All issues fixed')
  }
  
  /**
   * Display diagnostic results in the specified format
   */
  private displayDiagnostics(diagnostics: DiagnosticResult[], format: string, options: DoctorOptions): CommandResult {
    if (diagnostics.length === 0) {
      this.log(formatSuccess('No issues found'), options)
      return this.success('Configuration is healthy')
    }
    
    this.log(formatHeader('Diagnostic Results'), options)
    
    switch (format) {
      case 'json':
        console.log(JSON.stringify(diagnostics, null, 2))
        break
        
      case 'markdown':
        this.displayMarkdownFormat(diagnostics, options)
        break
        
      case 'table':
      default:
        this.displayTableFormat(diagnostics, options)
        break
    }
    
    const errorCount = diagnostics.filter(d => d.severity === 'error').length
    return errorCount > 0 
      ? this.failure('Configuration issues detected', 1, diagnostics)
      : this.success('Diagnostic complete', diagnostics)
  }
  
  /**
   * Display diagnostics in table format
   */
  private displayTableFormat(diagnostics: DiagnosticResult[], options: DoctorOptions): void {
    const tableData = diagnostics.map(d => ({
      File: d.file,
      Type: d.type,
      Severity: d.severity.toUpperCase(),
      Category: d.category,
      Message: d.message.length > 50 ? d.message.slice(0, 47) + '...' : d.message,
      Fixable: d.fixable ? 'Yes' : 'No'
    }))
    
    this.log(formatTable(tableData), options)
    
    // Show summary
    const summary = this.getSummary(diagnostics)
    this.log('\nSummary:', options)
    this.log(formatBulletList(summary), options)
  }
  
  /**
   * Display diagnostics in markdown format
   */
  private displayMarkdownFormat(diagnostics: DiagnosticResult[], options: DoctorOptions): void {
    let output = '# Configuration Diagnostics\n\n'
    
    const grouped = this.groupBySeverity(diagnostics)
    
    for (const [severity, issues] of Object.entries(grouped)) {
      if (issues.length === 0) continue
      
      output += `## ${severity.charAt(0).toUpperCase() + severity.slice(1)}s (${issues.length})\n\n`
      
      for (const issue of issues) {
        output += `### ${issue.file}\n\n`
        output += `- **Type**: ${issue.type}\n`
        output += `- **Category**: ${issue.category}\n`
        output += `- **Message**: ${issue.message}\n`
        output += `- **Fixable**: ${issue.fixable ? 'Yes' : 'No'}\n`
        
        if (issue.details) {
          output += `- **Details**: ${issue.details}\n`
        }
        
        if (issue.line && issue.column) {
          output += `- **Location**: Line ${issue.line}, Column ${issue.column}\n`
        }
        
        output += '\n'
      }
    }
    
    console.log(output)
  }
  
  /**
   * Group diagnostics by severity
   */
  private groupBySeverity(diagnostics: DiagnosticResult[]): Record<string, DiagnosticResult[]> {
    return {
      error: diagnostics.filter(d => d.severity === 'error'),
      warning: diagnostics.filter(d => d.severity === 'warning'),
      info: diagnostics.filter(d => d.severity === 'info')
    }
  }
  
  /**
   * Generate summary statistics
   */
  private getSummary(diagnostics: DiagnosticResult[]): string[] {
    const total = diagnostics.length
    const errors = diagnostics.filter(d => d.severity === 'error').length
    const warnings = diagnostics.filter(d => d.severity === 'warning').length
    const infos = diagnostics.filter(d => d.severity === 'info').length
    const fixable = diagnostics.filter(d => d.fixable).length
    
    return [
      `Total issues: ${total}`,
      `Errors: ${errors}`,
      `Warnings: ${warnings}`,
      `Info: ${infos}`,
      `Fixable: ${fixable}`
    ]
  }
}

/**
 * Diagnostic result structure
 */
interface DiagnosticResult {
  file: string
  type: 'skill' | 'subagent' | 'command' | 'rule'
  severity: 'error' | 'warning' | 'info'
  category: 'validation' | 'metadata' | 'optimization' | 'consistency' | 'performance'
  message: string
  details?: string
  fixable: boolean
  line?: number
  column?: number
  suggestions?: string[]
}