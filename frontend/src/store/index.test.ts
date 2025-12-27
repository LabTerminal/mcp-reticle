import { describe, it, expect, beforeEach } from 'vitest'
import { useReticleStore, parseLogMessage, extractMethod, findCorrelatedRequest, calculateLatency } from './index'
import type { LogEntry } from '@/types'

// Helper to reset store between tests
function resetStore() {
  useReticleStore.setState({
    isConnected: false,
    logs: [],
    selectedLogId: null,
    sessions: [],
    currentSession: null,
    availableServers: [],
    availableTags: [],
    filters: {},
    isCommandOpen: false,
  })
}

// Helper to create a mock log entry
function createMockLog(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    id: `log-${Math.random().toString(36).substr(2, 9)}`,
    session_id: 'session-123',
    timestamp: Date.now() * 1000,
    direction: 'in',
    content: '{"jsonrpc":"2.0","method":"test","id":1}',
    method: 'test',
    token_count: 10,
    ...overrides,
  }
}

describe('useReticleStore', () => {
  beforeEach(() => {
    resetStore()
  })

  describe('connection state', () => {
    it('starts disconnected', () => {
      const { isConnected } = useReticleStore.getState()
      expect(isConnected).toBe(false)
    })

    it('can set connected state', () => {
      useReticleStore.getState().setConnected(true)
      expect(useReticleStore.getState().isConnected).toBe(true)
    })
  })

  describe('logs', () => {
    it('starts with empty logs', () => {
      const { logs } = useReticleStore.getState()
      expect(logs).toEqual([])
    })

    it('can add a log', () => {
      const log = createMockLog()
      useReticleStore.getState().addLog(log)

      const { logs } = useReticleStore.getState()
      expect(logs).toHaveLength(1)
      expect(logs[0]).toEqual(log)
    })

    it('prevents duplicate logs by ID', () => {
      const log = createMockLog({ id: 'duplicate-id' })

      useReticleStore.getState().addLog(log)
      useReticleStore.getState().addLog(log)

      const { logs } = useReticleStore.getState()
      expect(logs).toHaveLength(1)
    })

    it('prevents duplicate logs by content within time window', () => {
      const now = Date.now() * 1000
      const log1 = createMockLog({
        id: 'log-1',
        content: 'same content',
        timestamp: now
      })
      const log2 = createMockLog({
        id: 'log-2',
        content: 'same content',
        timestamp: now + 100 // Within 500ms window
      })

      useReticleStore.getState().addLog(log1)
      useReticleStore.getState().addLog(log2)

      const { logs } = useReticleStore.getState()
      expect(logs).toHaveLength(1)
    })

    it('clears logs', () => {
      useReticleStore.getState().addLog(createMockLog())
      useReticleStore.getState().addLog(createMockLog())

      useReticleStore.getState().clearLogs()

      const { logs } = useReticleStore.getState()
      expect(logs).toHaveLength(0)
    })

    it('clears selectedLogId when clearing logs', () => {
      const log = createMockLog()
      useReticleStore.getState().addLog(log)
      useReticleStore.getState().selectLog(log.id)

      useReticleStore.getState().clearLogs()

      expect(useReticleStore.getState().selectedLogId).toBeNull()
    })
  })

  describe('log selection', () => {
    it('can select a log', () => {
      const log = createMockLog()
      useReticleStore.getState().addLog(log)

      useReticleStore.getState().selectLog(log.id)

      expect(useReticleStore.getState().selectedLogId).toBe(log.id)
    })

    it('can deselect a log', () => {
      const log = createMockLog()
      useReticleStore.getState().addLog(log)
      useReticleStore.getState().selectLog(log.id)

      useReticleStore.getState().selectLog(null)

      expect(useReticleStore.getState().selectedLogId).toBeNull()
    })

    it('getSelectedLog returns the selected log', () => {
      const log = createMockLog()
      useReticleStore.getState().addLog(log)
      useReticleStore.getState().selectLog(log.id)

      const selected = useReticleStore.getState().getSelectedLog()

      expect(selected).toEqual(log)
    })

    it('getSelectedLog returns null when nothing selected', () => {
      const selected = useReticleStore.getState().getSelectedLog()
      expect(selected).toBeNull()
    })
  })

  describe('sessions', () => {
    it('can add a session', () => {
      const session = { id: 'session-1', started_at: Date.now() }

      useReticleStore.getState().addSession(session as any)

      const { sessions, currentSession } = useReticleStore.getState()
      expect(sessions).toHaveLength(1)
      expect(currentSession).toEqual(session)
    })

    it('prevents duplicate sessions', () => {
      const session = { id: 'session-1', started_at: Date.now() }

      useReticleStore.getState().addSession(session as any)
      useReticleStore.getState().addSession(session as any)

      const { sessions } = useReticleStore.getState()
      expect(sessions).toHaveLength(1)
    })

    it('can update session tags', () => {
      const session = { id: 'session-1', started_at: Date.now(), tags: [] }
      useReticleStore.getState().addSession(session as any)

      useReticleStore.getState().updateSessionTags('session-1', ['prod', 'debug'])

      const { sessions, currentSession } = useReticleStore.getState()
      expect(sessions[0].tags).toEqual(['prod', 'debug'])
      expect(currentSession?.tags).toEqual(['prod', 'debug'])
    })
  })

  describe('filters', () => {
    it('starts with empty filters', () => {
      const { filters } = useReticleStore.getState()
      expect(filters).toEqual({})
    })

    it('can set filters', () => {
      useReticleStore.getState().setFilters({ direction: 'in' })

      expect(useReticleStore.getState().filters.direction).toBe('in')
    })

    it('merges filters', () => {
      useReticleStore.getState().setFilters({ direction: 'in' })
      useReticleStore.getState().setFilters({ method: 'tools/call' })

      const { filters } = useReticleStore.getState()
      expect(filters.direction).toBe('in')
      expect(filters.method).toBe('tools/call')
    })

    it('clears filters', () => {
      useReticleStore.getState().setFilters({ direction: 'in', method: 'test' })

      useReticleStore.getState().clearFilters()

      expect(useReticleStore.getState().filters).toEqual({})
    })
  })

  describe('getFilteredLogs', () => {
    beforeEach(() => {
      resetStore()
      useReticleStore.getState().addLog(createMockLog({
        id: 'log-1',
        direction: 'in',
        method: 'tools/call',
        content: '{"method":"tools/call"}'
      }))
      useReticleStore.getState().addLog(createMockLog({
        id: 'log-2',
        direction: 'out',
        method: 'tools/call',
        content: '{"result":{}}'
      }))
      useReticleStore.getState().addLog(createMockLog({
        id: 'log-3',
        direction: 'in',
        method: 'ping',
        content: '{"method":"ping"}'
      }))
    })

    it('returns all logs when no filters', () => {
      const filtered = useReticleStore.getState().getFilteredLogs()
      expect(filtered).toHaveLength(3)
    })

    it('filters by direction', () => {
      useReticleStore.getState().setFilters({ direction: 'in' })

      const filtered = useReticleStore.getState().getFilteredLogs()
      expect(filtered).toHaveLength(2)
      expect(filtered.every(l => l.direction === 'in')).toBe(true)
    })

    it('filters by method', () => {
      useReticleStore.getState().setFilters({ method: 'tools/call' })

      const filtered = useReticleStore.getState().getFilteredLogs()
      expect(filtered).toHaveLength(2)
      expect(filtered.every(l => l.method === 'tools/call')).toBe(true)
    })

    it('filters by search text in content', () => {
      useReticleStore.getState().setFilters({ searchText: 'ping' })

      const filtered = useReticleStore.getState().getFilteredLogs()
      expect(filtered).toHaveLength(1)
      expect(filtered[0].method).toBe('ping')
    })

    it('combines multiple filters', () => {
      useReticleStore.getState().setFilters({ direction: 'in', method: 'tools/call' })

      const filtered = useReticleStore.getState().getFilteredLogs()
      expect(filtered).toHaveLength(1)
    })
  })

  describe('command palette', () => {
    it('starts closed', () => {
      expect(useReticleStore.getState().isCommandOpen).toBe(false)
    })

    it('can open and close', () => {
      useReticleStore.getState().setCommandOpen(true)
      expect(useReticleStore.getState().isCommandOpen).toBe(true)

      useReticleStore.getState().setCommandOpen(false)
      expect(useReticleStore.getState().isCommandOpen).toBe(false)
    })
  })
})

describe('parseLogMessage', () => {
  it('parses valid JSON-RPC message', () => {
    const log = createMockLog({
      content: '{"jsonrpc":"2.0","method":"test","id":1}'
    })

    const parsed = parseLogMessage(log)

    expect(parsed).toEqual({
      jsonrpc: '2.0',
      method: 'test',
      id: 1
    })
  })

  it('returns null for invalid JSON', () => {
    const log = createMockLog({ content: 'not json' })

    const parsed = parseLogMessage(log)

    expect(parsed).toBeNull()
  })

  it('returns null for empty content', () => {
    const log = createMockLog({ content: '' })

    const parsed = parseLogMessage(log)

    expect(parsed).toBeNull()
  })
})

describe('extractMethod', () => {
  it('extracts method from log', () => {
    const log = createMockLog({
      content: '{"jsonrpc":"2.0","method":"tools/call","id":1}'
    })

    const method = extractMethod(log)

    expect(method).toBe('tools/call')
  })

  it('returns undefined for response without method', () => {
    const log = createMockLog({
      content: '{"jsonrpc":"2.0","result":{},"id":1}'
    })

    const method = extractMethod(log)

    expect(method).toBeUndefined()
  })

  it('returns undefined for invalid JSON', () => {
    const log = createMockLog({ content: 'invalid' })

    const method = extractMethod(log)

    expect(method).toBeUndefined()
  })
})

describe('findCorrelatedRequest', () => {
  it('finds the matching request for a response', () => {
    const request = createMockLog({
      id: 'log-1',
      direction: 'in',
      content: '{"jsonrpc":"2.0","method":"tools/call","id":42}',
      timestamp: 1000
    })
    const response = createMockLog({
      id: 'log-2',
      direction: 'out',
      content: '{"jsonrpc":"2.0","result":{},"id":42}',
      timestamp: 2000
    })

    const allLogs = [request, response]
    const correlated = findCorrelatedRequest(response, allLogs)

    expect(correlated).toEqual(request)
  })

  it('returns null for requests (not responses)', () => {
    const request = createMockLog({
      direction: 'in',
      content: '{"jsonrpc":"2.0","method":"test","id":1}'
    })

    const correlated = findCorrelatedRequest(request, [request])

    expect(correlated).toBeNull()
  })

  it('returns null when no matching request found', () => {
    const response = createMockLog({
      direction: 'out',
      content: '{"jsonrpc":"2.0","result":{},"id":999}'
    })

    const correlated = findCorrelatedRequest(response, [response])

    expect(correlated).toBeNull()
  })
})

describe('calculateLatency', () => {
  it('calculates latency between request and response', () => {
    const request = createMockLog({ timestamp: 1000000 })
    const response = createMockLog({ timestamp: 1500000 })

    const latency = calculateLatency(request, response)

    expect(latency).toBe(500000) // 500ms in microseconds
  })

  it('handles same timestamp', () => {
    const request = createMockLog({ timestamp: 1000000 })
    const response = createMockLog({ timestamp: 1000000 })

    const latency = calculateLatency(request, response)

    expect(latency).toBe(0)
  })
})
