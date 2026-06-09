interface SegmentedProps<T extends string | number> {
  options: readonly T[]
  value: T
  onChange: (v: T) => void
  labels?: Record<string, string>
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  labels,
}: SegmentedProps<T>) {
  return (
    <div className="flex bg-surface-card rounded-md p-0.5 gap-0.5">
      {options.map((opt) => (
        <button
          key={String(opt)}
          onClick={() => onChange(opt)}
          className={`flex-1 px-3 py-1.5 rounded-sm text-[13px] transition-colors ${
            value === opt
              ? 'bg-surface-elevated text-ink shadow-sm'
              : 'text-mute hover:text-body'
          }`}
        >
          {labels?.[String(opt)] ?? String(opt)}
        </button>
      ))}
    </div>
  )
}
