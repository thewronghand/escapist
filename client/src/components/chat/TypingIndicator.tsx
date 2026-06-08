interface TypingIndicatorProps {
  agent?: string
}

export function TypingIndicator({ agent = '면접관' }: TypingIndicatorProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-mute"
            style={{
              animation: 'esc-blink 1.2s infinite',
              animationDelay: `${i * 0.18}s`,
            }}
          />
        ))}
      </div>
      <span className="text-mute text-[12px]">{agent}이 평가 중...</span>
    </div>
  )
}
