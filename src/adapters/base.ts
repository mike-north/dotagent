/**
 * Base adapter utilities shared across adapters.
 *
 * @packageDocumentation
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync } from 'fs'
import { join, dirname, basename, extname } from 'path'
import matter from 'gray-matter'
import type { Rule, RuleInclusion } from '../types.js'
import { grayMatterOptions } from '../yaml-parser.js'

/**
 * Ensures a directory exists, creating it if necessary.
 *
 * @internal
 */
export function ensureDir(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true })
  }
}

/**
 * Ensures the parent directory of a file exists.
 *
 * @internal
 */
export function ensureParentDir(filePath: string): void {
  const dir = dirname(filePath)
  ensureDir(dir)
}

/**
 * Writes content to a file, creating parent directories as needed.
 *
 * @internal
 */
export function writeFile(filePath: string, content: string): void {
  ensureParentDir(filePath)
  writeFileSync(filePath, content, 'utf-8')
}

/**
 * Reads a file if it exists, returns undefined otherwise.
 *
 * @internal
 */
export function readFileIfExists(filePath: string): string | undefined {
  if (existsSync(filePath)) {
    return readFileSync(filePath, 'utf-8')
  }
  return undefined
}

/**
 * Lists files in a directory matching a pattern.
 *
 * @internal
 */
export function listFiles(
  dirPath: string,
  extensions: string[] = ['.md', '.mdc']
): string[] {
  if (!existsSync(dirPath)) {
    return []
  }

  const files: string[] = []

  function walk(dir: string): void {
    const entries = readdirSync(dir)
    for (const entry of entries) {
      const fullPath = join(dir, entry)
      const stat = statSync(fullPath)
      if (stat.isDirectory()) {
        walk(fullPath)
      } else if (extensions.some((ext) => entry.endsWith(ext))) {
        files.push(fullPath)
      }
    }
  }

  walk(dirPath)
  return files
}

/**
 * Parses a markdown file with optional YAML frontmatter.
 *
 * @internal
 */
export function parseMarkdownWithFrontmatter(
  content: string
): { data: Record<string, unknown>; content: string } {
  const parsed = matter(content, grayMatterOptions)
  return {
    data: parsed.data as Record<string, unknown>,
    content: parsed.content,
  }
}

/**
 * Serializes a rule to markdown with YAML frontmatter.
 *
 * @internal
 */
export function serializeRuleToMarkdown(rule: Rule): string {
  const frontmatter: Record<string, unknown> = {}

  // Add description if present
  if (rule.description) {
    frontmatter.description = rule.description
  }

  // Translate inclusion to tool-agnostic frontmatter
  switch (rule.inclusion.mode) {
    case 'always':
      frontmatter.alwaysApply = true
      break
    case 'agentRequested':
      // Default in many tools - no special flag needed
      // But we keep description which is required for agent-requested
      break
    case 'fileMatch':
      frontmatter.globs = rule.inclusion.patterns
      break
    case 'manual':
      frontmatter.manual = true
      break
  }

  return matter.stringify('\n' + rule.content, frontmatter, grayMatterOptions)
}

/**
 * Parses frontmatter into a RuleInclusion.
 *
 * @internal
 */
export function parseInclusionFromFrontmatter(
  data: Record<string, unknown>
): RuleInclusion {
  // Check for glob patterns (fileMatch mode)
  const globs = getStringArray(data, 'globs')
  if (globs) {
    return { mode: 'fileMatch', patterns: globs }
  }

  // Check for always apply flag
  if (data.alwaysApply === true) {
    return { mode: 'always' }
  }

  // Check for manual flag
  if (data.manual === true) {
    return { mode: 'manual' }
  }

  // Default: agentRequested (AI decides based on description)
  return { mode: 'agentRequested' }
}

/**
 * Converts a file path to a rule name.
 *
 * @internal
 */
export function filePathToRuleName(filePath: string, baseDir: string): string {
  // Get relative path from base directory
  const relativePath = filePath.startsWith(baseDir)
    ? filePath.slice(baseDir.length + 1)
    : basename(filePath)

  // Remove extension and replace path separators with hyphens
  return relativePath
    .replace(/\.(md|mdc)$/, '')
    .replace(/[/\\]/g, '-')
}

// ============================================================================
// Type-safe parsing helpers
// ============================================================================

/**
 * Safely extracts a string value from frontmatter data.
 *
 * @internal
 */
export function getString(data: Record<string, unknown>, key: string): string | undefined {
  const value = data[key]
  return typeof value === 'string' ? value : undefined
}

/**
 * Safely extracts a boolean value from frontmatter data.
 *
 * @internal
 */
export function getBoolean(data: Record<string, unknown>, key: string): boolean | undefined {
  const value = data[key]
  return typeof value === 'boolean' ? value : undefined
}

/**
 * Safely extracts a string array from frontmatter data.
 *
 * @internal
 */
export function getStringArray(data: Record<string, unknown>, key: string): string[] | undefined {
  const value = data[key]
  if (!Array.isArray(value)) return undefined
  const filtered = value.filter((item): item is string => typeof item === 'string')
  return filtered.length > 0 ? filtered : undefined
}
