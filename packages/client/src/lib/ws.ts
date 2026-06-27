type MessageHandler = (data: Record<string, unknown>) => void

let socket: WebSocket | null = null
let handlers: MessageHandler[] = []
let onOpenCallbacks: (() => void)[] = []
let reconnectTimer: ReturnType<typeof setTimeout> | null = null

function getWsUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/ws`
}

export function connect() {
  if (socket?.readyState === WebSocket.OPEN) return

  socket = new WebSocket(getWsUrl())

  socket.onopen = () => {
    console.log('[WS] connected')
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    // 연결 대기 중이던 콜백 실행
    const cbs = [...onOpenCallbacks]
    onOpenCallbacks = []
    cbs.forEach((cb) => cb())
  }

  socket.onmessage = (event) => {
    if (typeof event.data !== 'string') {
      console.warn('[WS] non-string message ignored', typeof event.data)
      return
    }
    try {
      const data = JSON.parse(event.data) as Record<string, unknown>
      handlers.forEach((h) => h(data))
    } catch {
      console.error('[WS] parse error', event.data)
    }
  }

  socket.onclose = () => {
    console.log('[WS] disconnected, reconnecting...')
    reconnectTimer = setTimeout(connect, 2000)
  }
}

export function send(data: Record<string, unknown>) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    // 연결 안 됐으면 큐에 넣고 연결 후 전송
    onOpenCallbacks.push(() => {
      socket?.send(JSON.stringify(data))
    })
    connect()
    return
  }
  socket.send(JSON.stringify(data))
}

export function subscribe(handler: MessageHandler) {
  handlers.push(handler)
  return () => {
    handlers = handlers.filter((h) => h !== handler)
  }
}
