/**
 * Cursor Adapter
 *
 * Handles import/export for Cursor IDE rules.
 *
 * Cursor supports:
 * - Commands: .cursor/commands/
 * - Hooks: hooks.json
 * - Rules: .cursorrules (legacy single file) + .cursor/rules/ (MDC files with frontmatter)
 *
 * @packageDocumentation
 */

import { existsSync, readdirSync } from 'fs'
import { join, basename } from 'path'
import type { ToolAdapter, DetectionResult } from './types.js'
import type { Command, Rule, Hook, RuleInclusion } from '../types.js'
import {
  ensureDir,
  writeFile,
  readFileIfExists,
  listFiles,
  parseMarkdownWithFrontmatter,
  filePathToRuleName,
  getString,
  getStringArray,
} from './base.js'
import matter from 'gray-matter'
import { grayMatterOptions } from '../yaml-parser.js'

/**
 * Cursor IDE adapter.
 *
 * @public
 */
export const cursorAdapter: ToolAdapter = {
  name: 'cursor',

  capabilities: {
    commands: true,
    skills: false,
    subagents: false,
    hooks: true,
    rules: true,
  },

  paths: {
    commands: '.cursor/commands/',
    hooks: 'hooks.json',
    rules: ['.cursorrules', '.cursor/rules/'],
  },

  // ========== DETECTION ==========

  detect(projectDir: string): DetectionResult {
    const paths: string[] = []

    // Check for .cursorrules
    const cursorrules = join(projectDir, '.cursorrules')
    if (existsSync(cursorrules)) {
      paths.push('.cursorrules')
    }

    // Check for .cursor/rules/
    const rulesDir = join(projectDir, '.cursor', 'rules')
    if (existsSync(rulesDir)) {
      paths.push('.cursor/rules/')
    }

    return {
      exists: paths.length > 0,
      paths,
    }
  },

  // ========== READ ==========

  readCommands(projectDir: string): Command[] {
    const commandsDir = join(projectDir, '.cursor', 'commands')
    if (!existsSync(commandsDir)) {
      return []
    }

    const commands: Command[] = []
    const files = listFiles(commandsDir, ['.md'])

    for (const file of files) {
      const content = readFileIfExists(file)
      if (!content) continue

      const name = basename(file, '.md')
      commands.push({
        name,
        content,
      })
    }

    return commands
  },

  readHooks(_projectDir: string): Hook[] {
    // TODO: Implement hooks.json parsing
    return []
  },

  readRules(projectDir: string): Rule[] {
    const rules: Rule[] = []

    // Read .cursorrules (single file, always-apply)
    const cursorrules = join(projectDir, '.cursorrules')
    const legacyContent = readFileIfExists(cursorrules)
    if (legacyContent) {
      rules.push({
        name: 'cursor-rules-legacy',
        content: legacyContent,
        inclusion: { mode: 'always' },
      })
    }

    // Read .cursor/rules/*.mdc (frontmatter determines inclusion mode)
    const rulesDir = join(projectDir, '.cursor', 'rules')
    const files = listFiles(rulesDir, ['.mdc', '.md'])

    for (const file of files) {
      const content = readFileIfExists(file)
      if (!content) continue

      const { data, content: body } = parseMarkdownWithFrontmatter(content)

      // Determine inclusion mode from Cursor frontmatter
      let inclusion: RuleInclusion
      const globs = getStringArray(data, 'globs')
      if (globs) {
        inclusion = { mode: 'fileMatch', patterns: globs }
      } else if (data.alwaysApply === true) {
        inclusion = { mode: 'always' }
      } else {
        // Default in Cursor = "apply intelligently" (agent decides)
        inclusion = { mode: 'agentRequested' }
      }

      rules.push({
        name: getString(data, 'id') || filePathToRuleName(file, rulesDir),
        description: getString(data, 'description'),
        content: body.trim(),
        inclusion,
      })
    }

    return rules
  },

  // ========== WRITE ==========

  writeCommand(cmd: Command, projectDir: string): void {
    const commandsDir = join(projectDir, '.cursor', 'commands')
    ensureDir(commandsDir)
    const filePath = join(commandsDir, `${cmd.name}.md`)
    writeFile(filePath, cmd.content)
  },

  writeHook(_hook: Hook, _projectDir: string): void {
    // TODO: Implement hooks.json writing
  },

  writeRule(rule: Rule, projectDir: string): void {
    const rulesDir = join(projectDir, '.cursor', 'rules')
    ensureDir(rulesDir)
    const filePath = join(rulesDir, `${rule.name}.mdc`)

    // Build frontmatter based on inclusion mode
    const frontmatter: Record<string, unknown> = {}

    if (rule.description) {
      frontmatter.description = rule.description
    }

    switch (rule.inclusion.mode) {
      case 'always':
        frontmatter.alwaysApply = true
        break
      case 'agentRequested':
        // Default in Cursor - no special flag needed
        break
      case 'fileMatch':
        frontmatter.globs = rule.inclusion.patterns
        break
      case 'manual':
        // Cursor doesn't have native manual mode, but we can add a flag
        frontmatter.manual = true
        break
    }

    const content = matter.stringify('\n' + rule.content, frontmatter, grayMatterOptions)
    writeFile(filePath, content)
  },

  writeAllRules(rules: Rule[], projectDir: string): void {
    // Separate legacy single-file rules from structured rules
    const legacyRules = rules.filter(
      (r) => r.inclusion.mode === 'always' && r.name === 'cursor-rules-legacy'
    )
    const structuredRules = rules.filter(
      (r) => !(r.inclusion.mode === 'always' && r.name === 'cursor-rules-legacy')
    )

    // Write legacy rules to .cursorrules
    if (legacyRules.length > 0) {
      const legacyContent = legacyRules.map((r) => r.content).join('\n\n---\n\n')
      writeFile(join(projectDir, '.cursorrules'), legacyContent)
    }

    // Write structured rules to .cursor/rules/
    for (const rule of structuredRules) {
      this.writeRule(rule, projectDir)
    }
  },
}
