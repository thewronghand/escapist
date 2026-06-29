import { useState } from 'react'
import { useAdmin } from '@/hooks/useAdmin'
import { useWorkerStatus } from '@/hooks/useWorkerStatus'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'

const CUSTOM_COMMANDS = [
  'pm2 status',
  'pm2 logs',
  'pm2 list',
  'git status',
  'git log',
  'git pull',
  'node --version',
  'pnpm --version',
] as const

interface AdminPageProps {
  onBack: () => void
}

export function AdminPage({ onBack }: AdminPageProps) {
  const workerConnected = useWorkerStatus()
  const {
    adminSessionConnected,
    statusLoading,
    logs,
    logsLoading,
    recentCommands,
    sendCommand,
    isSending,
    refetchLogs,
  } = useAdmin()

  const [customCmd, setCustomCmd] = useState<string>(CUSTOM_COMMANDS[0])

  const handleCustom = () => {
    sendCommand('custom', customCmd)
  }

  return (
    <div className="max-w-[800px] mx-auto px-4 sm:px-10 pt-6 sm:pt-10 pb-16 overflow-auto h-full">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onBack} className="text-ash hover:text-body transition-colors">
          <Icon name="chevleft" size={18} />
        </button>
        <h1 className="text-ink text-[22px] font-semibold">관리자</h1>
      </div>

      {/* 연결 상태 */}
      <section className="mb-8">
        <h2 className="text-[13px] text-mute uppercase tracking-wider mb-3">연결 상태</h2>
        <div className="flex flex-col gap-2">
          <StatusRow
            label="CLI Worker (맥북에어 ↔ 서버)"
            connected={workerConnected ?? false}
            loading={workerConnected === null}
          />
          <StatusRow
            label="관리 세션 (SSE 대기)"
            connected={adminSessionConnected}
            loading={statusLoading}
          />
        </div>
      </section>

      {/* 명령 버튼 */}
      <section className="mb-8">
        <h2 className="text-[13px] text-mute uppercase tracking-wider mb-3">원격 명령</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant="secondary"
            onClick={() => sendCommand('restart')}
            disabled={isSending || !adminSessionConnected}
          >
            <Icon name="refresh" size={14} />
            Restart
          </Button>
          <Button
            variant="secondary"
            onClick={() => sendCommand('update')}
            disabled={isSending || !adminSessionConnected}
          >
            <Icon name="arrowup" size={14} />
            Update (git pull + restart)
          </Button>
        </div>

        <div className="flex gap-2">
          <select
            value={customCmd}
            onChange={(e) => setCustomCmd(e.target.value)}
            className="flex-1 bg-surface-elevated border border-hairline rounded-md px-3 py-2 text-[14px] text-body focus:outline-none focus:border-hairline-strong"
            disabled={!adminSessionConnected}
          >
            {CUSTOM_COMMANDS.map((cmd) => (
              <option key={cmd} value={cmd}>{cmd}</option>
            ))}
          </select>
          <Button
            variant="primary"
            onClick={handleCustom}
            disabled={isSending || !adminSessionConnected}
          >
            실행
          </Button>
        </div>

        {!adminSessionConnected && (
          <p className="mt-2 text-[12px] text-accent-red">관리 세션이 연결되어 있지 않습니다. 맥북에어에서 admin-session을 시작해주세요.</p>
        )}
      </section>

      {/* 최근 명령 결과 */}
      {recentCommands.length > 0 && (
        <section className="mb-8">
          <h2 className="text-[13px] text-mute uppercase tracking-wider mb-3">최근 명령</h2>
          <div className="flex flex-col gap-2">
            {[...recentCommands].reverse().map((entry) => (
              <div key={entry.commandId} className="bg-surface-card border border-hairline rounded-md px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] font-medium text-body">
                    {entry.command}{entry.payload ? `: ${entry.payload}` : ''}
                  </span>
                  {entry.result ? (
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                      entry.result.success
                        ? 'bg-accent-green/10 text-accent-green'
                        : 'bg-accent-red/10 text-accent-red'
                    }`}>
                      {entry.result.success ? '성공' : '실패'}
                    </span>
                  ) : (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-elevated text-mute animate-pulse">대기 중</span>
                  )}
                </div>
                <p className="text-[11px] text-mute">{new Date(entry.issuedAt).toLocaleString('ko-KR')}</p>
                {entry.result?.output && (
                  <pre className="mt-2 text-[11px] text-body bg-surface-elevated rounded px-3 py-2 overflow-x-auto whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                    {entry.result.output}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PM2 로그 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] text-mute uppercase tracking-wider">CLI Worker 로그</h2>
          <button
            onClick={() => refetchLogs()}
            className="text-[12px] text-ash hover:text-body transition-colors flex items-center gap-1"
          >
            <Icon name="refresh" size={12} />
            새로고침
          </button>
        </div>
        {logsLoading ? (
          <div className="text-[13px] text-mute">로딩 중...</div>
        ) : logs.length === 0 ? (
          <div className="text-[13px] text-mute">로그 없음 — CLI Worker가 연결되면 자동으로 전송됩니다.</div>
        ) : (
          <pre className="bg-surface-card border border-hairline rounded-md px-4 py-3 text-[11px] text-body overflow-x-auto whitespace-pre-wrap max-h-[400px] overflow-y-auto">
            {logs.join('\n')}
          </pre>
        )}
      </section>
    </div>
  )
}

function StatusRow({ label, connected, loading }: { label: string; connected: boolean; loading: boolean }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-3 bg-surface-card border border-hairline rounded-md">
      <span className={`w-2 h-2 rounded-full shrink-0 ${
        loading ? 'bg-ash animate-pulse' : connected ? 'bg-accent-green' : 'bg-accent-red'
      }`} />
      <span className="text-[14px] text-body">{label}</span>
      <span className="ml-auto text-[12px] text-mute">
        {loading ? '확인 중' : connected ? '연결됨' : '오프라인'}
      </span>
    </div>
  )
}
