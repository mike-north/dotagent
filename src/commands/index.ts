/**
 * Command exports for easy importing and registration.
 * 
 * Provides all core commands and utilities for command system integration.
 */

// Base command infrastructure
export { BaseCommand, type CommandOptions, type CommandResult } from './base.js'

// Core command implementations
export { DoctorCommand } from './doctor.js'
export { CreateCommand } from './create.js'
export { ConvertCommand } from './convert.js'
export { ExplainCommand } from './explain.js'

// Command registry integration
import { registerCommand, commandRegistry } from '../command-registry.js'
import { DoctorCommand } from './doctor.js'
import { CreateCommand } from './create.js'
import { ConvertCommand } from './convert.js'
import { ExplainCommand } from './explain.js'

/**
 * Register all core commands with the command registry
 */
export function registerCoreCommands(): void {
  // Doctor command for configuration analysis and diagnosis
  registerCommand(new DoctorCommand(), {
    aliases: ['doc', 'check', 'diagnose'],
    category: 'Analysis',
    hidden: false
  })
  
  // Create command for generating configurations from natural language
  registerCommand(new CreateCommand(), {
    aliases: ['generate', 'new'],
    category: 'Generation',
    hidden: false
  })
  
  // Convert command for transforming between abstraction types
  registerCommand(new ConvertCommand(), {
    aliases: ['transform', 'migrate'],
    category: 'Transformation',
    hidden: false
  })
  
  // Explain command for describing configurations in natural language
  registerCommand(new ExplainCommand(), {
    aliases: ['describe', 'analyze'],
    category: 'Analysis',
    hidden: false
  })
}

/**
 * Get a list of all available core commands with descriptions
 */
export function getCoreCommands(): Array<{
  name: string
  description: string
  aliases: string[]
  category: string
}> {
  return [
    {
      name: 'doctor',
      description: 'Analyze and diagnose configuration issues',
      aliases: ['doc', 'check', 'diagnose'],
      category: 'Analysis'
    },
    {
      name: 'create',
      description: 'Generate configurations from natural language intent',
      aliases: ['generate', 'new'],
      category: 'Generation'
    },
    {
      name: 'convert',
      description: 'Convert between abstraction types (skill/subagent/command/rule)',
      aliases: ['transform', 'migrate'],
      category: 'Transformation'
    },
    {
      name: 'explain',
      description: 'Explain what a configuration does in natural language',
      aliases: ['describe', 'analyze'],
      category: 'Analysis'
    }
  ]
}

/**
 * Initialize the command system with all core commands
 */
export function initializeCommandSystem(): void {
  // Clear any existing commands to ensure clean state
  commandRegistry.clear()
  
  // Register all core commands
  registerCoreCommands()
}

/**
 * Convenience function to check if all core commands are registered
 */
export function verifyCoreCommandsRegistered(): boolean {
  const requiredCommands = ['doctor', 'create', 'convert', 'explain']
  return requiredCommands.every(cmd => commandRegistry.has(cmd))
}