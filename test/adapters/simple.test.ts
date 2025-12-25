/**
 * Simple adapters tests (single-file rules only)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import {
  zedAdapter,
  clineAdapter,
  aiderAdapter,
  codexAdapter,
  opencodeAdapter,
  geminiAdapter,
  qodoAdapter,
  junieAdapter,
} from '../../src/adapters/simple-rules.js'
import { copilotAdapter } from '../../src/adapters/copilot.js'
import { windsurfAdapter } from '../../src/adapters/windsurf.js'

describe('Simple Rules Adapters', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'simple-adapter-test-'))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  describe('zedAdapter', () => {
    it('should have only rules capability', () => {
      expect(zedAdapter.capabilities.rules).toBe(true)
      expect(zedAdapter.capabilities.commands).toBe(false)
      expect(zedAdapter.capabilities.skills).toBe(false)
    })

    it('should detect .rules file', () => {
      writeFileSync(join(tempDir, '.rules'), 'Zed rules')
      const result = zedAdapter.detect(tempDir)
      expect(result.exists).toBe(true)
    })

    it('should read rules from .rules', () => {
      writeFileSync(join(tempDir, '.rules'), 'Zed rules content')
      const rules = zedAdapter.readRules(tempDir)
      expect(rules).toHaveLength(1)
      expect(rules[0]?.name).toBe('zed-rules')
      expect(rules[0]?.content).toBe('Zed rules content')
      expect(rules[0]?.inclusion.mode).toBe('always')
    })

    it('should write rules to .rules', () => {
      zedAdapter.writeRule(
        { name: 'test', content: 'Test content', inclusion: { mode: 'always' } },
        tempDir
      )
      expect(existsSync(join(tempDir, '.rules'))).toBe(true)
      expect(readFileSync(join(tempDir, '.rules'), 'utf-8')).toBe('Test content')
    })
  })

  describe('clineAdapter', () => {
    it('should detect .clinerules file', () => {
      writeFileSync(join(tempDir, '.clinerules'), 'Cline rules')
      const result = clineAdapter.detect(tempDir)
      expect(result.exists).toBe(true)
    })

    it('should read/write rules', () => {
      clineAdapter.writeRule(
        { name: 'test', content: 'Content', inclusion: { mode: 'always' } },
        tempDir
      )
      const rules = clineAdapter.readRules(tempDir)
      expect(rules).toHaveLength(1)
      expect(rules[0]?.content).toBe('Content')
    })
  })

  describe('aiderAdapter', () => {
    it('should detect CONVENTIONS.md', () => {
      writeFileSync(join(tempDir, 'CONVENTIONS.md'), 'Conventions')
      const result = aiderAdapter.detect(tempDir)
      expect(result.exists).toBe(true)
    })

    it('should read/write rules to CONVENTIONS.md', () => {
      aiderAdapter.writeRule(
        { name: 'test', content: 'Content', inclusion: { mode: 'always' } },
        tempDir
      )
      expect(existsSync(join(tempDir, 'CONVENTIONS.md'))).toBe(true)
    })
  })

  describe('codexAdapter', () => {
    it('should detect AGENTS.md', () => {
      writeFileSync(join(tempDir, 'AGENTS.md'), 'Agents')
      const result = codexAdapter.detect(tempDir)
      expect(result.exists).toBe(true)
    })

    it('should read/write rules to AGENTS.md', () => {
      codexAdapter.writeRule(
        { name: 'test', content: 'Content', inclusion: { mode: 'always' } },
        tempDir
      )
      expect(existsSync(join(tempDir, 'AGENTS.md'))).toBe(true)
    })
  })

  describe('opencodeAdapter', () => {
    it('should detect AGENTS.md', () => {
      writeFileSync(join(tempDir, 'AGENTS.md'), 'Agents')
      const result = opencodeAdapter.detect(tempDir)
      expect(result.exists).toBe(true)
    })
  })

  describe('geminiAdapter', () => {
    it('should detect GEMINI.md', () => {
      writeFileSync(join(tempDir, 'GEMINI.md'), 'Gemini')
      const result = geminiAdapter.detect(tempDir)
      expect(result.exists).toBe(true)
    })

    it('should read/write rules', () => {
      geminiAdapter.writeRule(
        { name: 'test', content: 'Gemini content', inclusion: { mode: 'always' } },
        tempDir
      )
      const rules = geminiAdapter.readRules(tempDir)
      expect(rules).toHaveLength(1)
      expect(rules[0]?.content).toBe('Gemini content')
    })
  })

  describe('qodoAdapter', () => {
    it('should detect best_practices.md', () => {
      writeFileSync(join(tempDir, 'best_practices.md'), 'Practices')
      const result = qodoAdapter.detect(tempDir)
      expect(result.exists).toBe(true)
    })
  })

  describe('junieAdapter', () => {
    it('should detect .junie/guidelines.md', () => {
      mkdirSync(join(tempDir, '.junie'), { recursive: true })
      writeFileSync(join(tempDir, '.junie', 'guidelines.md'), 'Guidelines')
      const result = junieAdapter.detect(tempDir)
      expect(result.exists).toBe(true)
    })

    it('should read/write rules', () => {
      junieAdapter.writeRule(
        { name: 'test', content: 'Guidelines', inclusion: { mode: 'always' } },
        tempDir
      )
      expect(existsSync(join(tempDir, '.junie', 'guidelines.md'))).toBe(true)
      const rules = junieAdapter.readRules(tempDir)
      expect(rules).toHaveLength(1)
    })
  })

  describe('copilotAdapter', () => {
    it('should detect .github/copilot-instructions.md', () => {
      mkdirSync(join(tempDir, '.github'), { recursive: true })
      writeFileSync(join(tempDir, '.github', 'copilot-instructions.md'), 'Instructions')
      const result = copilotAdapter.detect(tempDir)
      expect(result.exists).toBe(true)
    })

    it('should read/write rules', () => {
      copilotAdapter.writeRule(
        { name: 'test', content: 'Instructions', inclusion: { mode: 'always' } },
        tempDir
      )
      expect(existsSync(join(tempDir, '.github', 'copilot-instructions.md'))).toBe(true)
    })
  })

  describe('windsurfAdapter', () => {
    it('should detect .windsurfrules', () => {
      writeFileSync(join(tempDir, '.windsurfrules'), 'Rules')
      const result = windsurfAdapter.detect(tempDir)
      expect(result.exists).toBe(true)
    })

    it('should read/write rules', () => {
      windsurfAdapter.writeRule(
        { name: 'test', content: 'Windsurf content', inclusion: { mode: 'always' } },
        tempDir
      )
      const rules = windsurfAdapter.readRules(tempDir)
      expect(rules).toHaveLength(1)
    })

    it('should detect .windsurf/workflows directory', () => {
      // Note: windsurf adapter detects .windsurfrules and .windsurf/workflows/
      // It doesn't have a .windsurf/rules/ - rules are in the single .windsurfrules file
      mkdirSync(join(tempDir, '.windsurf', 'workflows'), { recursive: true })
      const result = windsurfAdapter.detect(tempDir)
      expect(result.exists).toBe(true)
      expect(result.paths).toContain('.windsurf/workflows/')
    })
  })
})
