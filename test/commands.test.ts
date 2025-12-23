import { describe, it, expect, beforeEach } from 'vitest'
import { 
  registerCoreCommands, 
  getCoreCommands, 
  initializeCommandSystem, 
  verifyCoreCommandsRegistered,
  DoctorCommand,
  CreateCommand,
  ConvertCommand,
  ExplainCommand
} from '../src/commands/index.js'
import { commandRegistry } from '../src/command-registry.js'

describe('Core Commands', () => {
  beforeEach(() => {
    commandRegistry.clear()
  })

  describe('Command Registration', () => {
    it('should register all core commands', () => {
      registerCoreCommands()
      
      expect(commandRegistry.has('doctor')).toBe(true)
      expect(commandRegistry.has('create')).toBe(true)
      expect(commandRegistry.has('convert')).toBe(true)
      expect(commandRegistry.has('explain')).toBe(true)
    })

    it('should register command aliases', () => {
      registerCoreCommands()
      
      // Doctor aliases
      expect(commandRegistry.has('doc')).toBe(true)
      expect(commandRegistry.has('check')).toBe(true)
      expect(commandRegistry.has('diagnose')).toBe(true)
      
      // Create aliases
      expect(commandRegistry.has('generate')).toBe(true)
      expect(commandRegistry.has('new')).toBe(true)
      
      // Convert aliases
      expect(commandRegistry.has('transform')).toBe(true)
      expect(commandRegistry.has('migrate')).toBe(true)
      
      // Explain aliases
      expect(commandRegistry.has('describe')).toBe(true)
      expect(commandRegistry.has('analyze')).toBe(true)
    })

    it('should return correct command instances', () => {
      registerCoreCommands()
      
      const doctor = commandRegistry.get('doctor')
      const create = commandRegistry.get('create')
      const convert = commandRegistry.get('convert')
      const explain = commandRegistry.get('explain')
      
      expect(doctor).toBeInstanceOf(DoctorCommand)
      expect(create).toBeInstanceOf(CreateCommand)
      expect(convert).toBeInstanceOf(ConvertCommand)
      expect(explain).toBeInstanceOf(ExplainCommand)
    })
  })

  describe('Command System Initialization', () => {
    it('should initialize the command system', () => {
      initializeCommandSystem()
      expect(verifyCoreCommandsRegistered()).toBe(true)
    })

    it('should clear existing commands before initializing', () => {
      // Add a dummy command first
      commandRegistry.register({
        name: 'dummy',
        description: 'test',
        execute: async () => ({ code: 0, message: 'ok' })
      } as any)
      
      expect(commandRegistry.has('dummy')).toBe(true)
      
      initializeCommandSystem()
      
      expect(commandRegistry.has('dummy')).toBe(false)
      expect(verifyCoreCommandsRegistered()).toBe(true)
    })
  })

  describe('Core Commands List', () => {
    it('should return correct command information', () => {
      const commands = getCoreCommands()
      
      expect(commands).toHaveLength(4)
      
      const commandNames = commands.map(cmd => cmd.name)
      expect(commandNames).toContain('doctor')
      expect(commandNames).toContain('create')
      expect(commandNames).toContain('convert')
      expect(commandNames).toContain('explain')
      
      // Check specific command details
      const doctorCmd = commands.find(cmd => cmd.name === 'doctor')
      expect(doctorCmd).toBeDefined()
      expect(doctorCmd!.description).toBe('Analyze and diagnose configuration issues')
      expect(doctorCmd!.aliases).toEqual(['doc', 'check', 'diagnose'])
      expect(doctorCmd!.category).toBe('Analysis')
    })
  })

  describe('Individual Command Instances', () => {
    it('should create doctor command with correct properties', () => {
      const doctor = new DoctorCommand()
      expect(doctor.name).toBe('doctor')
      expect(doctor.description).toBe('Analyze and diagnose configuration issues')
    })

    it('should create create command with correct properties', () => {
      const create = new CreateCommand()
      expect(create.name).toBe('create')
      expect(create.description).toBe('Generate configurations from natural language intent')
    })

    it('should create convert command with correct properties', () => {
      const convert = new ConvertCommand()
      expect(convert.name).toBe('convert')
      expect(convert.description).toBe('Convert between abstraction types (skill/subagent/command/rule)')
    })

    it('should create explain command with correct properties', () => {
      const explain = new ExplainCommand()
      expect(explain.name).toBe('explain')
      expect(explain.description).toBe('Explain what a configuration does in natural language')
    })
  })

  describe('Command Help', () => {
    it('should execute help for doctor command', async () => {
      const doctor = new DoctorCommand()
      const result = await doctor.execute([], { help: true })
      
      expect(result.code).toBe(0)
      expect(result.message).toBe('Help displayed')
    })

    it('should execute help for create command', async () => {
      const create = new CreateCommand()
      const result = await create.execute([], { help: true })
      
      expect(result.code).toBe(0)
      expect(result.message).toBe('Help displayed')
    })

    it('should execute help for convert command', async () => {
      const convert = new ConvertCommand()
      const result = await convert.execute([], { help: true })
      
      expect(result.code).toBe(0)
      expect(result.message).toBe('Help displayed')
    })

    it('should execute help for explain command', async () => {
      const explain = new ExplainCommand()
      const result = await explain.execute([], { help: true })
      
      expect(result.code).toBe(0)
      expect(result.message).toBe('Help displayed')
    })
  })

  describe('Command Error Handling', () => {
    it('should handle missing arguments in create command', async () => {
      const create = new CreateCommand()
      const result = await create.execute([], { interactive: false })
      
      expect(result.code).toBe(1)
      expect(result.message).toBe('Missing description')
    })

    it('should handle missing arguments in convert command', async () => {
      const convert = new ConvertCommand()
      const result = await convert.execute([], {})
      
      expect(result.code).toBe(1)
      expect(result.message).toBe('Missing input file')
    })

    it('should handle missing target type in convert command', async () => {
      const convert = new ConvertCommand()
      const result = await convert.execute(['test.mdc'], {})
      
      expect(result.code).toBe(1)
      expect(result.message).toBe('Missing target type')
    })

    it('should handle missing arguments in explain command', async () => {
      const explain = new ExplainCommand()
      const result = await explain.execute([], {})
      
      expect(result.code).toBe(1)
      expect(result.message).toBe('Missing input file')
    })
  })
})