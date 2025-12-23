/**
 * Base command interface and abstract class for CLI commands.
 * 
 * Provides common functionality for all commands including:
 * - Option handling (verbose, quiet, config, help)
 * - Consistent logging with conditional output
 * - Help display
 * - Result structure
 */

export interface CommandOptions {
  verbose?: boolean
  quiet?: boolean
  config?: string
  help?: boolean
  [key: string]: unknown
}

export interface CommandResult {
  code: number
  message: string
  data?: unknown
}

export abstract class BaseCommand {
  abstract name: string
  abstract description: string
  
  /**
   * Execute the command with given arguments and options
   */
  abstract execute(args: string[], options: CommandOptions): Promise<CommandResult>
  
  /**
   * Display help information for this command
   */
  protected showHelp(): void {
    console.log(`
${this.name} - ${this.description}

Usage: ${this.name} [args...] [options]

Options:
  -h, --help      Show this help message
  --verbose       Enable verbose output
  --quiet         Suppress non-essential output
  --config        Specify config file path
`)
  }
  
  /**
   * Log a message conditionally based on quiet option
   */
  protected log(message: string, options: CommandOptions): void {
    if (!options.quiet) {
      console.log(message)
    }
  }
  
  /**
   * Log a verbose message only when verbose mode is enabled
   */
  protected verbose(message: string, options: CommandOptions): void {
    if (options.verbose && !options.quiet) {
      console.log(message)
    }
  }
  
  /**
   * Log an error message (always shown unless quiet)
   */
  protected error(message: string, options: CommandOptions): void {
    if (!options.quiet) {
      console.error(message)
    }
  }
  
  /**
   * Create a success result
   */
  protected success(message: string, data?: unknown): CommandResult {
    return {
      code: 0,
      message,
      data
    }
  }
  
  /**
   * Create a failure result
   */
  protected failure(message: string, code: number = 1, data?: unknown): CommandResult {
    return {
      code,
      message,
      data
    }
  }
}