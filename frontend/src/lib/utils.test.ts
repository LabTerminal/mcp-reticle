import { describe, it, expect } from 'vitest'
import { cn, formatTimestamp, truncate, formatDuration, syntaxHighlightJSON } from './utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    expect(cn('base', true && 'active', false && 'hidden')).toBe('base active')
  })

  it('merges tailwind classes correctly', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })

  it('handles undefined and null', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar')
  })

  it('handles empty input', () => {
    expect(cn()).toBe('')
  })
})

describe('formatTimestamp', () => {
  it('formats timestamp with hours, minutes, seconds, and milliseconds', () => {
    // Create a timestamp for a known time
    const date = new Date('2024-01-15T14:30:45.123Z')
    const timestampMicros = date.getTime() * 1000 // Convert to microseconds

    const result = formatTimestamp(timestampMicros)

    // Should be in format HH:MM:SS.mmm
    expect(result).toMatch(/^\d{2}:\d{2}:\d{2}\.\d{3}$/)
  })

  it('pads single digit values with zeros', () => {
    const date = new Date('2024-01-15T01:02:03.004Z')
    const timestampMicros = date.getTime() * 1000

    const result = formatTimestamp(timestampMicros)

    // Should have proper padding
    expect(result).toMatch(/^\d{2}:\d{2}:\d{2}\.\d{3}$/)
  })
})

describe('truncate', () => {
  it('returns original string if shorter than length', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })

  it('returns original string if equal to length', () => {
    expect(truncate('hello', 5)).toBe('hello')
  })

  it('truncates and adds ellipsis if longer than length', () => {
    expect(truncate('hello world', 5)).toBe('hello...')
  })

  it('handles empty string', () => {
    expect(truncate('', 5)).toBe('')
  })

  it('handles zero length', () => {
    expect(truncate('hello', 0)).toBe('...')
  })
})

describe('formatDuration', () => {
  it('formats microseconds', () => {
    expect(formatDuration(500)).toBe('500μs')
    expect(formatDuration(1)).toBe('1μs')
    expect(formatDuration(999)).toBe('999μs')
  })

  it('formats milliseconds', () => {
    expect(formatDuration(1000)).toBe('1.00ms')
    expect(formatDuration(1500)).toBe('1.50ms')
    expect(formatDuration(999999)).toBe('1000.00ms')
  })

  it('formats seconds', () => {
    expect(formatDuration(1000000)).toBe('1.00s')
    expect(formatDuration(1500000)).toBe('1.50s')
    expect(formatDuration(5000000)).toBe('5.00s')
  })

  it('handles zero', () => {
    expect(formatDuration(0)).toBe('0μs')
  })
})

describe('syntaxHighlightJSON', () => {
  it('highlights string values', () => {
    const json = '"hello"'
    const result = syntaxHighlightJSON(json)
    expect(result).toContain('json-string')
    expect(result).toContain('"hello"')
  })

  it('highlights numbers', () => {
    const json = '123'
    const result = syntaxHighlightJSON(json)
    expect(result).toContain('json-number')
  })

  it('highlights booleans', () => {
    const json = 'true'
    const result = syntaxHighlightJSON(json)
    expect(result).toContain('json-boolean')
  })

  it('highlights null', () => {
    const json = 'null'
    const result = syntaxHighlightJSON(json)
    expect(result).toContain('json-null')
  })

  it('highlights object keys', () => {
    const json = '{"key": "value"}'
    const result = syntaxHighlightJSON(json)
    expect(result).toContain('json-key')
    expect(result).toContain('json-string')
  })

  it('escapes HTML entities', () => {
    const json = '"<script>"'
    const result = syntaxHighlightJSON(json)
    expect(result).toContain('&lt;script&gt;')
    expect(result).not.toContain('<script>')
  })

  it('handles complex JSON', () => {
    const json = '{"method": "tools/call", "params": {"name": "test"}, "id": 1}'
    const result = syntaxHighlightJSON(json)
    expect(result).toContain('json-key')
    expect(result).toContain('json-string')
    expect(result).toContain('json-number')
  })
})
