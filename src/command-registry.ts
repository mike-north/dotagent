/**
 * Command registration system for the CLI.
 * 
 * Provides dynamic command registration, discovery, and execution.
 * Handles command name conflicts and provides command listing functionality.
 */

import { BaseCommand, CommandOptions, CommandResult } from './commands/base.js'
import { formatError, formatInfo, formatBulletList } from './utils/output.js'

export interface RegisteredCommand {
  instance: BaseCommand
  aliases?: string[]
  category?: string
  hidden?: boolean
}

export class CommandRegistry {
  private commands = new Map<string, RegisteredCommand>()
  private aliases = new Map<string, string>()
  
  /**
   * Register a command instance
   */
  register(command: BaseCommand, options?: {
    aliases?: string[]
    category?: string
    hidden?: boolean
  }): void {
    const { aliases = [], category, hidden = false } = options || {}
    
    // Check for name conflicts
    if (this.commands.has(command.name)) {
      throw new Error(`Command '${command.name}' is already registered`)
    }
    
    // Check for alias conflicts
    for (const alias of aliases) {
      if (this.commands.has(alias) || this.aliases.has(alias)) {
        throw new Error(`Alias '${alias}' conflicts with existing command or alias`)
      }
    }
    
    // Register the command
    this.commands.set(command.name, {
      instance: command,
      aliases,
      category,
      hidden
    })
    
    // Register aliases
    for (const alias of aliases) {
      this.aliases.set(alias, command.name)
    }
  }
  
  /**
   * Get a command by name or alias
   */
  get(nameOrAlias: string): BaseCommand | undefined {
    // Try direct name lookup first
    const registered = this.commands.get(nameOrAlias)
    if (registered) {
      return registered.instance
    }
    
    // Try alias lookup
    const realName = this.aliases.get(nameOrAlias)
    if (realName) {
      const command = this.commands.get(realName)
      return command?.instance
    }
    
    return undefined
  }
  
  /**
   * Check if a command exists
   */
  has(nameOrAlias: string): boolean {
    return this.commands.has(nameOrAlias) || this.aliases.has(nameOrAlias)
  }
  
  /**
   * Get all registered command names (excluding hidden commands unless specified)
   */
  list(includeHidden = false): string[] {
    return Array.from(this.commands.entries())
      .filter(([, registered]) => includeHidden || !registered.hidden)
      .map(([name]) => name)
      .sort()
  }
  
  /**
   * Get commands organized by category
   */
  listByCategory(includeHidden = false): Record<string, string[]> {
    const categories: Record<string, string[]> = {}
    
    for (const [name, registered] of this.commands.entries()) {
      if (!includeHidden && registered.hidden) continue
      
      const category = registered.category || 'General'
      if (!categories[category]) {
        categories[category] = []
      }
      categories[category].push(name)
    }
    
    // Sort commands within each category
    for (const category in categories) {
      categories[category].sort()
    }
    
    return categories
  }
  
  /**
   * Get command information including aliases
   */
  getInfo(nameOrAlias: string): {
    name: string
    description: string
    aliases: string[]
    category?: string
    hidden: boolean
  } | undefined {
    // Resolve to real name if it's an alias
    let realName = nameOrAlias
    if (this.aliases.has(nameOrAlias)) {
      realName = this.aliases.get(nameOrAlias)!
    }
    
    const registered = this.commands.get(realName)
    if (!registered) return undefined
    
    return {
      name: realName,
      description: registered.instance.description,
      aliases: registered.aliases || [],
      category: registered.category,
      hidden: registered.hidden || false
    }
  }
  
  /**
   * Find similar command names (for "did you mean" functionality)
   */
  findSimilar(input: string, maxDistance = 2): string[] {
    const allNames = [
      ...Array.from(this.commands.keys()),
      ...Array.from(this.aliases.keys())
    ]
    
    return allNames
      .filter(name => this.levenshteinDistance(input, name) <= maxDistance)
      .sort((a, b) => {
        const distA = this.levenshteinDistance(input, a)
        const distB = this.levenshteinDistance(input, b)
        return distA - distB
      })
      .slice(0, 3) // Limit suggestions
  }
  
  /**
   * Execute a command by name
   */
  async execute(
    nameOrAlias: string, 
    args: string[], 
    options: CommandOptions
  ): Promise<CommandResult> {
    const command = this.get(nameOrAlias)
    
    if (!command) {
      const similar = this.findSimilar(nameOrAlias)
      let errorMessage = `Unknown command: '${nameOrAlias}'`
      
      if (similar.length > 0) {
        errorMessage += `\n\nDid you mean one of these?\n${formatBulletList(similar)}`
      }
      
      errorMessage += `\n\nUse --help to see available commands.`
      
      return {
        code: 1,
        message: errorMessage
      }
    }
    
    try {
      return await command.execute(args, options)
    } catch (error) {
      return {
        code: 1,
        message: `Command execution failed: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }
  
  /**
   * Generate help text for all commands
   */
  generateHelp(includeHidden = false): string {
    const categories = this.listByCategory(includeHidden)
    const sections: string[] = []
    
    for (const [category, commands] of Object.entries(categories)) {
      sections.push(`\n${category}:`)
      
      const commandInfos = commands.map(name => {
        const info = this.getInfo(name)!
        const aliasText = info.aliases.length > 0 ? ` (${info.aliases.join(', ')})` : ''
        return `  ${name}${aliasText.padEnd(20 - name.length)} ${info.description}`
      })
      
      sections.push(commandInfos.join('\n'))
    }
    
    return sections.join('\n')
  }
  
  /**
   * Remove a command from the registry
   */
  unregister(nameOrAlias: string): boolean {
    // Resolve to real name if it's an alias
    let realName = nameOrAlias
    if (this.aliases.has(nameOrAlias)) {
      realName = this.aliases.get(nameOrAlias)!
    }
    
    const registered = this.commands.get(realName)
    if (!registered) return false
    
    // Remove aliases
    if (registered.aliases) {
      for (const alias of registered.aliases) {
        this.aliases.delete(alias)
      }
    }
    
    // Remove the command
    this.commands.delete(realName)
    
    return true
  }
  
  /**
   * Clear all registered commands
   */
  clear(): void {
    this.commands.clear()
    this.aliases.clear()
  }
  
  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(a: string, b: string): number {
    if (a.length === 0) return b.length
    if (b.length === 0) return a.length
    
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null))
    
    for (let i = 0; i <= a.length; i++) matrix[0][i] = i
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j
    
    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,      // deletion
          matrix[j - 1][i] + 1,      // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        )
      }
    }
    
    return matrix[b.length][a.length]
  }
}

// Global registry instance
export const commandRegistry = new CommandRegistry()

/**
 * Convenience function to register a command
 */
export function registerCommand(
  command: BaseCommand, 
  options?: {
    aliases?: string[]
    category?: string
    hidden?: boolean
  }
): void {
  commandRegistry.register(command, options)
}

/**
 * Convenience function to execute a command
 */
export async function executeCommand(
  nameOrAlias: string, 
  args: string[], 
  options: CommandOptions
): Promise<CommandResult> {
  return commandRegistry.execute(nameOrAlias, args, options)
}