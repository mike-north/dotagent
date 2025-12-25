/**
 * Claude Code Adapter
 *
 * Handles import/export for Claude Code.
 *
 * Claude Code supports all customization types:
 * - Commands: .claude/commands/
 * - Skills: .claude/skills/
 * - SubAgents: .claude/agents/
 * - Hooks: settings.json or .claude/settings.json
 * - Rules: CLAUDE.md + .claude/rules/
 *
 * @packageDocumentation
 */

import { existsSync, readdirSync, statSync } from 'fs'
import { join, basename } from 'path'
import type { ToolAdapter, DetectionResult } from './types.js'
import type { Command, Skill, SubAgent, Hook, Rule, RuleInclusion, SkillResource } from '../types.js'
import {
  ensureDir,
  writeFile,
  readFileIfExists,
  listFiles,
  parseMarkdownWithFrontmatter,
  filePathToRuleName,
  getString,
  getStringArray,
  getBoolean,
} from './base.js'
import matter from 'gray-matter'
import { grayMatterOptions } from '../yaml-parser.js'

/**
 * Claude Code adapter.
 *
 * @public
 */
export const claudeCodeAdapter: ToolAdapter = {
  name: 'claude-code',

  capabilities: {
    commands: true,
    skills: true,
    subagents: true,
    hooks: true,
    rules: true,
  },

  paths: {
    commands: '.claude/commands/',
    skills: '.claude/skills/',
    subagents: '.claude/agents/',
    hooks: ['.claude/settings.json', 'settings.json'],
    rules: ['CLAUDE.md', '.claude/rules/'],
  },

  // ========== DETECTION ==========

  detect(projectDir: string): DetectionResult {
    const paths: string[] = []

    // Check for CLAUDE.md
    if (existsSync(join(projectDir, 'CLAUDE.md'))) {
      paths.push('CLAUDE.md')
    }

    // Check for .claude/ directory
    const claudeDir = join(projectDir, '.claude')
    if (existsSync(claudeDir)) {
      if (existsSync(join(claudeDir, 'commands'))) paths.push('.claude/commands/')
      if (existsSync(join(claudeDir, 'skills'))) paths.push('.claude/skills/')
      if (existsSync(join(claudeDir, 'agents'))) paths.push('.claude/agents/')
      if (existsSync(join(claudeDir, 'rules'))) paths.push('.claude/rules/')
    }

    return {
      exists: paths.length > 0,
      paths,
    }
  },

  // ========== READ ==========

  readCommands(projectDir: string): Command[] {
    const commandsDir = join(projectDir, '.claude', 'commands')
    if (!existsSync(commandsDir)) {
      return []
    }

    const commands: Command[] = []
    const files = listFiles(commandsDir, ['.md'])

    for (const file of files) {
      const content = readFileIfExists(file)
      if (!content) continue

      const { data, content: body } = parseMarkdownWithFrontmatter(content)
      const name = basename(file, '.md')

      commands.push({
        name,
        content: body.trim(),
        description: getString(data, 'description'),
        allowedTools: getStringArray(data, 'allowed-tools'),
        argumentHint: getString(data, 'argument-hint'),
        model: getString(data, 'model'),
        disableModelInvocation: getBoolean(data, 'disable-model-invocation'),
      })
    }

    return commands
  },

  readSkills(projectDir: string): Skill[] {
    const skillsDir = join(projectDir, '.claude', 'skills')
    if (!existsSync(skillsDir)) {
      return []
    }

    const skills: Skill[] = []
    const entries = readdirSync(skillsDir)

    for (const entry of entries) {
      const skillPath = join(skillsDir, entry)
      if (!statSync(skillPath).isDirectory()) continue

      const skillMd = join(skillPath, 'SKILL.md')
      const content = readFileIfExists(skillMd)
      if (!content) continue

      const { data, content: body } = parseMarkdownWithFrontmatter(content)

      // Read additional resources
      const resources: SkillResource[] = []
      const resourceFiles = readdirSync(skillPath).filter(
        (f) => f !== 'SKILL.md' && !statSync(join(skillPath, f)).isDirectory()
      )

      for (const resourceFile of resourceFiles) {
        const resourceContent = readFileIfExists(join(skillPath, resourceFile))
        if (!resourceContent) continue

        // Default to documentation - resource type is best declared via the resource itself
        // or inferred at a higher level by the consumer
        const resourceType: SkillResource['type'] = 'documentation'

        resources.push({
          filename: resourceFile,
          content: resourceContent,
          type: resourceType,
        })
      }

      skills.push({
        name: entry,
        description: getString(data, 'description') || entry,
        content: body.trim(),
        allowedTools: getStringArray(data, 'allowed-tools'),
        resources: resources.length > 0 ? resources : undefined,
      })
    }

    return skills
  },

  readSubAgents(projectDir: string): SubAgent[] {
    const agentsDir = join(projectDir, '.claude', 'agents')
    if (!existsSync(agentsDir)) {
      return []
    }

    const agents: SubAgent[] = []
    const files = listFiles(agentsDir, ['.md'])

    for (const file of files) {
      const content = readFileIfExists(file)
      if (!content) continue

      const { data, content: body } = parseMarkdownWithFrontmatter(content)
      const name = basename(file, '.md')

      // Type-safe extraction of model and permissionMode
      const modelValue = getString(data, 'model')
      const validModels = ['sonnet', 'opus', 'haiku', 'inherit'] as const
      const model = modelValue && validModels.includes(modelValue as (typeof validModels)[number])
        ? (modelValue as SubAgent['model'])
        : undefined

      const permValue = getString(data, 'permissionMode')
      const validPerms = ['default', 'acceptEdits', 'bypassPermissions', 'plan', 'ignore'] as const
      const permissionMode = permValue && validPerms.includes(permValue as (typeof validPerms)[number])
        ? (permValue as SubAgent['permissionMode'])
        : undefined

      agents.push({
        name,
        description: getString(data, 'description') || name,
        systemPrompt: body.trim(),
        tools: getStringArray(data, 'tools'),
        model,
        permissionMode,
        skills: getStringArray(data, 'skills'),
      })
    }

    return agents
  },

  readHooks(_projectDir: string): Hook[] {
    // TODO: Implement settings.json hooks parsing
    return []
  },

  readRules(projectDir: string): Rule[] {
    const rules: Rule[] = []

    // Read CLAUDE.md (single file, always-apply)
    const claudeMd = join(projectDir, 'CLAUDE.md')
    const claudeContent = readFileIfExists(claudeMd)
    if (claudeContent) {
      rules.push({
        name: 'claude-md',
        content: claudeContent,
        inclusion: { mode: 'always' },
      })
    }

    // Read .claude/rules/*.md
    const rulesDir = join(projectDir, '.claude', 'rules')
    const files = listFiles(rulesDir, ['.md'])

    for (const file of files) {
      const content = readFileIfExists(file)
      if (!content) continue

      const { data, content: body } = parseMarkdownWithFrontmatter(content)

      // Determine inclusion mode from Claude Code frontmatter
      let inclusion: RuleInclusion
      const globs = getStringArray(data, 'globs')
      if (globs) {
        inclusion = { mode: 'fileMatch', patterns: globs }
      } else {
        // Default in Claude Code = always apply
        inclusion = { mode: 'always' }
      }

      rules.push({
        name: filePathToRuleName(file, rulesDir),
        description: getString(data, 'description'),
        content: body.trim(),
        inclusion,
      })
    }

    return rules
  },

  // ========== WRITE ==========

  writeCommand(cmd: Command, projectDir: string): void {
    const commandsDir = join(projectDir, '.claude', 'commands')
    ensureDir(commandsDir)
    const filePath = join(commandsDir, `${cmd.name}.md`)

    const frontmatter: Record<string, unknown> = {}
    if (cmd.description) frontmatter.description = cmd.description
    if (cmd.allowedTools) frontmatter['allowed-tools'] = cmd.allowedTools
    if (cmd.argumentHint) frontmatter['argument-hint'] = cmd.argumentHint
    if (cmd.model) frontmatter.model = cmd.model
    if (cmd.disableModelInvocation) frontmatter['disable-model-invocation'] = cmd.disableModelInvocation

    const content = matter.stringify('\n' + cmd.content, frontmatter, grayMatterOptions)
    writeFile(filePath, content)
  },

  writeSkill(skill: Skill, projectDir: string): void {
    const skillDir = join(projectDir, '.claude', 'skills', skill.name)
    ensureDir(skillDir)

    // Write SKILL.md
    const frontmatter: Record<string, unknown> = {
      description: skill.description,
    }
    if (skill.allowedTools) frontmatter['allowed-tools'] = skill.allowedTools

    const skillContent = matter.stringify('\n' + skill.content, frontmatter, grayMatterOptions)
    writeFile(join(skillDir, 'SKILL.md'), skillContent)

    // Write resources
    if (skill.resources) {
      for (const resource of skill.resources) {
        writeFile(join(skillDir, resource.filename), resource.content)
      }
    }
  },

  writeSubAgent(agent: SubAgent, projectDir: string): void {
    const agentsDir = join(projectDir, '.claude', 'agents')
    ensureDir(agentsDir)
    const filePath = join(agentsDir, `${agent.name}.md`)

    const frontmatter: Record<string, unknown> = {
      description: agent.description,
    }
    if (agent.tools) frontmatter.tools = agent.tools
    if (agent.model) frontmatter.model = agent.model
    if (agent.permissionMode) frontmatter.permissionMode = agent.permissionMode
    if (agent.skills) frontmatter.skills = agent.skills

    const content = matter.stringify('\n' + agent.systemPrompt, frontmatter, grayMatterOptions)
    writeFile(filePath, content)
  },

  writeHook(_hook: Hook, _projectDir: string): void {
    // TODO: Implement settings.json hook writing
  },

  writeRule(rule: Rule, projectDir: string): void {
    // For 'always' mode with name 'claude-md', write to CLAUDE.md
    if (rule.inclusion.mode === 'always' && rule.name === 'claude-md') {
      writeFile(join(projectDir, 'CLAUDE.md'), rule.content)
      return
    }

    // Otherwise write to .claude/rules/
    const rulesDir = join(projectDir, '.claude', 'rules')
    ensureDir(rulesDir)
    const filePath = join(rulesDir, `${rule.name}.md`)

    const frontmatter: Record<string, unknown> = {}
    if (rule.description) frontmatter.description = rule.description
    if (rule.inclusion.mode === 'fileMatch') {
      frontmatter.globs = rule.inclusion.patterns
    }

    const content = matter.stringify('\n' + rule.content, frontmatter, grayMatterOptions)
    writeFile(filePath, content)
  },

  writeAllRules(rules: Rule[], projectDir: string): void {
    for (const rule of rules) {
      this.writeRule(rule, projectDir)
    }
  },
}
