import { describe, it, expect } from 'vitest'
import { SyncManager } from '../index.js'

describe('SyncManager Integration', () => {
  it('should be importable from wrapper index', () => {
    const manager = new SyncManager()
    expect(manager).toBeInstanceOf(SyncManager)
  })

  it('should have all required methods', () => {
    const manager = new SyncManager()
    
    expect(typeof manager.importProject).toBe('function')
    expect(typeof manager.importFile).toBe('function')
    expect(typeof manager.exportProject).toBe('function')
    expect(typeof manager.exportFile).toBe('function')
    expect(typeof manager.analyzeProject).toBe('function')
    expect(typeof manager.analyzeFile).toBe('function')
    expect(typeof manager.validateConfig).toBe('function')
    expect(typeof manager.suggestImprovements).toBe('function')
  })

  it('should accept configuration', () => {
    const manager = new SyncManager({
      skipValidation: true,
      includePrivate: true,
      autoDetectTypes: false,
      strictMode: true
    })
    expect(manager).toBeInstanceOf(SyncManager)
  })
})