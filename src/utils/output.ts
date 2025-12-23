/**
 * Enhanced CLI output utilities for command infrastructure.
 * 
 * Provides colored output, progress indicators, and status displays.
 * Built on top of the existing colors.ts utility.
 * 
 * Note: For more advanced interactive CLI features, consider adding suds-cli:
 * https://github.com/mike-north/suds-cli
 */

import { color, colorize, formatList, header } from './colors.js'

// Color constants for consistent theming
export const COLORS = {
  PRIMARY: 'blue',
  SUCCESS: 'green',
  WARNING: 'yellow',
  ERROR: 'red',
  INFO: 'cyan',
  MUTED: 'gray',
  HIGHLIGHT: 'magenta'
} as const

/**
 * Format a header with consistent styling
 */
export function formatHeader(text: string, options?: { 
  style?: 'box' | 'line' | 'minimal'
  width?: number
}): string {
  const { style = 'line', width = text.length + 4 } = options || {}
  
  switch (style) {
    case 'box': {
      const border = '─'.repeat(width)
      return `\n┌${border}┐\n│ ${color.bold(text.padEnd(width - 2))} │\n└${border}┘\n`
    }
    
    case 'minimal':
      return `\n${color.bold(text)}\n`
    
    case 'line':
    default:
      return header(text)
  }
}

/**
 * Format success message with consistent styling
 */
export function formatSuccess(message: string, details?: string): string {
  const base = color.success(message)
  return details ? `${base}\n${color.dim(details)}` : base
}

/**
 * Format warning message with consistent styling
 */
export function formatWarning(message: string, details?: string): string {
  const base = color.warning(message)
  return details ? `${base}\n${color.dim(details)}` : base
}

/**
 * Format error message with consistent styling
 */
export function formatError(message: string, details?: string, hint?: string): string {
  const base = color.error(message)
  let result = base
  
  if (details) {
    result += `\n${color.dim(details)}`
  }
  
  if (hint) {
    result += `\n${color.dim(`Hint: ${hint}`)}`
  }
  
  return result
}

/**
 * Format information message with consistent styling
 */
export function formatInfo(message: string, details?: string): string {
  const base = color.info(message)
  return details ? `${base}\n${color.dim(details)}` : base
}

/**
 * Create a simple progress indicator
 */
export class ProgressIndicator {
  private current = 0
  private total: number
  private prefix: string
  
  constructor(total: number, prefix = 'Progress') {
    this.total = total
    this.prefix = prefix
  }
  
  /**
   * Update progress and display current status
   */
  update(current: number, message?: string): void {
    this.current = current
    const percentage = Math.round((current / this.total) * 100)
    const progressBar = this.createProgressBar(percentage)
    const status = message ? ` - ${message}` : ''
    
    process.stdout.write(`\r${this.prefix}: ${progressBar} ${percentage}%${status}`)
  }
  
  /**
   * Mark progress as complete
   */
  complete(message = 'Done'): void {
    this.update(this.total, message)
    console.log() // New line after completion
  }
  
  private createProgressBar(percentage: number, width = 20): string {
    const filled = Math.round((percentage / 100) * width)
    const empty = width - filled
    
    const bar = color.green('█'.repeat(filled)) + color.gray('░'.repeat(empty))
    return `[${bar}]`
  }
}

/**
 * Display status with optional spinner (basic version)
 */
export class StatusDisplay {
  private frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
  private frameIndex = 0
  private interval?: NodeJS.Timeout
  private message: string
  
  constructor(message: string) {
    this.message = message
  }
  
  /**
   * Start showing spinning status
   */
  start(): void {
    this.interval = setInterval(() => {
      process.stdout.write(`\r${color.blue(this.frames[this.frameIndex])} ${this.message}`)
      this.frameIndex = (this.frameIndex + 1) % this.frames.length
    }, 80)
  }
  
  /**
   * Stop spinner and show success
   */
  succeed(message?: string): void {
    this.stop()
    console.log(color.success(message || this.message))
  }
  
  /**
   * Stop spinner and show failure
   */
  fail(message?: string): void {
    this.stop()
    console.log(color.error(message || this.message))
  }
  
  /**
   * Stop spinner and show warning
   */
  warn(message?: string): void {
    this.stop()
    console.log(color.warning(message || this.message))
  }
  
  /**
   * Stop spinner without additional output
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = undefined
      process.stdout.write('\r' + ' '.repeat(this.message.length + 5) + '\r')
    }
  }
}

/**
 * Format a command for display
 */
export function formatCommand(command: string): string {
  return color.command(command)
}

/**
 * Format a file path for display
 */
export function formatPath(path: string): string {
  return color.path(path)
}

/**
 * Format a number for display
 */
export function formatNumber(num: number | string): string {
  return color.number(num.toString())
}

/**
 * Format a list with consistent bullet styling
 */
export function formatBulletList(items: string[], options?: {
  bullet?: string
  indent?: string
  style?: 'bullet' | 'number' | 'check'
}): string {
  const { bullet = '•', indent = '  ', style = 'bullet' } = options || {}
  
  return items.map((item, index) => {
    let prefix: string
    
    switch (style) {
      case 'number':
        prefix = `${index + 1}.`
        break
      case 'check':
        prefix = '✓'
        break
      case 'bullet':
      default:
        prefix = bullet
    }
    
    return `${indent}${color.dim(prefix)} ${item}`
  }).join('\n')
}

/**
 * Create a table-like output (simple version)
 */
export function formatTable(data: Array<Record<string, string>>, options?: {
  headers?: string[]
  maxWidth?: number
}): string {
  if (data.length === 0) return ''
  
  const { headers = Object.keys(data[0]), maxWidth = 80 } = options || {}
  
  // Calculate column widths
  const colWidths: Record<string, number> = {}
  
  headers.forEach(header => {
    const values = [header, ...data.map(row => row[header] || '')]
    colWidths[header] = Math.min(
      Math.max(...values.map(v => v.length)),
      Math.floor(maxWidth / headers.length) - 2
    )
  })
  
  // Format rows
  const formatRow = (row: Record<string, string>, isHeader = false): string => {
    const cells = headers.map(header => {
      const value = row[header] || ''
      const width = colWidths[header]
      const truncated = value.length > width ? value.slice(0, width - 1) + '…' : value
      const padded = truncated.padEnd(width)
      return isHeader ? color.bold(padded) : padded
    })
    return cells.join(' │ ')
  }
  
  // Header
  const headerRow = formatRow(
    Object.fromEntries(headers.map(h => [h, h])), 
    true
  )
  
  // Separator
  const separator = headers.map(header => '─'.repeat(colWidths[header])).join('─┼─')
  
  // Data rows
  const dataRows = data.map(row => formatRow(row))
  
  return [headerRow, separator, ...dataRows].join('\n')
}

/**
 * Re-export existing utilities for convenience
 */
export { color, colorize, formatList, header }