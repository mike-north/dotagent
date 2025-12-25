/**
 * Kiro Adapter
 *
 * Handles import/export for AWS Kiro.
 *
 * Kiro supports:
 * - Commands: .kiro/steering/ with `inclusion: manual` (called "Steering")
 * - Skills: .kiro/steering/ + POWER.md (called "Powers")
 * - Hooks: .kiro/hooks/
 * - Rules: AGENTS.md + .kiro/steering/ with `inclusion: always`
 *
 * Note: Kiro's "steering files" are similar to Cursor's rule files with frontmatter.
 *
 * @packageDocumentation
 */

import { existsSync } from 'fs'
import { join, basename } from 'path'
import matter from 'gray-matter'
import type { ToolAdapter, DetectionResult } from './types.js'
import type { Command, Skill, Hook, Rule, RuleInclusion } from '../types.js'
import {
  writeFile,
  readFileIfExists,
  listFiles,
  ensureDir,
  parseMarkdownWithFrontmatter,
  filePathToRuleName,
  getString,
  getStringArray,
} from './base.js'
import { grayMatterOptions } from '../yaml-parser.js'

/**
 * Kiro adapter.
 *
 * @public
 */
export const kiroAdapter: ToolAdapter = {
  name: 'kiro',

  capabilities: {
    commands: true,
    skills: true,
    subagents: false,
    hooks: true,
    rules: true,
  },

  paths: {
    commands: '.kiro/steering/',
    skills: '.kiro/steering/',
    hooks: '.kiro/hooks/',
    rules: ['AGENTS.md', '.kiro/steering/'],
  },

  detect(projectDir: string): DetectionResult {
    const paths: string[] = []

    if (existsSync(join(projectDir, 'AGENTS.md'))) {
      paths.push('AGENTS.md')
    }

    if (existsSync(join(projectDir, '.kiro'))) {
      if (existsSync(join(projectDir, '.kiro', 'steering'))) {
        paths.push('.kiro/steering/')
      }
      if (existsSync(join(projectDir, '.kiro', 'hooks'))) {
        paths.push('.kiro/hooks/')
      }
    }

    return {
      exists: paths.length > 0,
      paths,
    }
  },

  readCommands(projectDir: string): Command[] {
    const steeringDir = join(projectDir, '.kiro', 'steering')
    if (!existsSync(steeringDir)) {
      return []
    }

    const commands: Command[] = []
    const files = listFiles(steeringDir, ['.md'])

    for (const file of files) {
      const content = readFileIfExists(file)
      if (!content) continue

      const { data, content: body } = parseMarkdownWithFrontmatter(content)

      // Only include files with inclusion: manual as commands
      if (data.inclusion !== 'manual') continue

      commands.push({
        name: filePathToRuleName(file, steeringDir),
        content: body.trim(),
        description: getString(data, 'description'),
      })
    }

    return commands
  },

  readSkills(projectDir: string): Skill[] {
    const steeringDir = join(projectDir, '.kiro', 'steering')
    if (!existsSync(steeringDir)) {
      return []
    }

    const skills: Skill[] = []
    const files = listFiles(steeringDir, ['.md'])

    for (const file of files) {
      // Look for POWER.md files which indicate skills
      if (!basename(file).includes('POWER')) continue

      const content = readFileIfExists(file)
      if (!content) continue

      const { data, content: body } = parseMarkdownWithFrontmatter(content)

      skills.push({
        name: filePathToRuleName(file, steeringDir).replace('-POWER', ''),
        description: getString(data, 'description') || '',
        content: body.trim(),
      })
    }

    return skills
  },

  readHooks(_projectDir: string): Hook[] {
    // TODO: Implement Kiro hooks parsing
    return []
  },

  readRules(projectDir: string): Rule[] {
    const rules: Rule[] = []

    // Read AGENTS.md (single file, always-apply)
    const agentsMd = join(projectDir, 'AGENTS.md')
    const agentsContent = readFileIfExists(agentsMd)
    if (agentsContent) {
      rules.push({
        name: 'agents-md',
        content: agentsContent,
        inclusion: { mode: 'always' },
      })
    }

    // Read .kiro/steering/ files with inclusion: always
    const steeringDir = join(projectDir, '.kiro', 'steering')
    if (existsSync(steeringDir)) {
      const files = listFiles(steeringDir, ['.md'])

      for (const file of files) {
        // Skip POWER.md files (those are skills)
        if (basename(file).includes('POWER')) continue

        const content = readFileIfExists(file)
        if (!content) continue

        const { data, content: body } = parseMarkdownWithFrontmatter(content)

        // Skip manual inclusion (those are commands)
        if (data.inclusion === 'manual') continue

        // Determine inclusion mode from Kiro frontmatter
        let inclusion: RuleInclusion
        const fileMatchPattern = getString(data, 'fileMatchPattern')
        if (fileMatchPattern) {
          inclusion = { mode: 'fileMatch', patterns: [fileMatchPattern] }
        } else if (data.inclusion === 'always') {
          inclusion = { mode: 'always' }
        } else {
          // Default = agent requested
          inclusion = { mode: 'agentRequested' }
        }

        rules.push({
          name: filePathToRuleName(file, steeringDir),
          description: getString(data, 'description'),
          content: body.trim(),
          inclusion,
        })
      }
    }

    return rules
  },

  writeCommand(cmd: Command, projectDir: string): void {
    const steeringDir = join(projectDir, '.kiro', 'steering')
    ensureDir(steeringDir)
    const filePath = join(steeringDir, `${cmd.name}.md`)

    const frontmatter: Record<string, unknown> = {
      inclusion: 'manual',
    }
    if (cmd.description) frontmatter.description = cmd.description

    const content = matter.stringify('\n' + cmd.content, frontmatter, grayMatterOptions)
    writeFile(filePath, content)
  },

  writeSkill(skill: Skill, projectDir: string): void {
    const steeringDir = join(projectDir, '.kiro', 'steering')
    ensureDir(steeringDir)
    const filePath = join(steeringDir, `${skill.name}-POWER.md`)

    const frontmatter: Record<string, unknown> = {
      description: skill.description,
    }

    const content = matter.stringify('\n' + skill.content, frontmatter, grayMatterOptions)
    writeFile(filePath, content)
  },

  writeHook(_hook: Hook, _projectDir: string): void {
    // TODO: Implement Kiro hook writing
  },

  writeRule(rule: Rule, projectDir: string): void {
    // For 'always' mode with name 'agents-md', write to AGENTS.md
    if (rule.inclusion.mode === 'always' && rule.name === 'agents-md') {
      writeFile(join(projectDir, 'AGENTS.md'), rule.content)
      return
    }

    // Otherwise write to .kiro/steering/
    const steeringDir = join(projectDir, '.kiro', 'steering')
    ensureDir(steeringDir)
    const filePath = join(steeringDir, `${rule.name}.md`)

    const frontmatter: Record<string, unknown> = {}
    if (rule.description) frontmatter.description = rule.description

    switch (rule.inclusion.mode) {
      case 'always':
        frontmatter.inclusion = 'always'
        break
      case 'agentRequested':
        // Default in Kiro - no special flag needed
        break
      case 'fileMatch':
        frontmatter.fileMatchPattern = rule.inclusion.patterns[0] || '*'
        break
      case 'manual':
        frontmatter.inclusion = 'manual'
        break
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
