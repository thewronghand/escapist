interface DifficultyStarsProps {
  value: number
  max?: number
  size?: number
  onChange?: (v: number) => void
}

export function DifficultyStars({ value, max = 5, size = 14, onChange }: DifficultyStarsProps) {
  return (
    <div className="inline-flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 16 16"
          className={onChange ? 'cursor-pointer' : ''}
          onClick={() => onChange?.(i + 1)}
        >
          <path
            d="M8 1.5l2 4.1 4.5.6-3.2 3.2.8 4.5L8 11.7 3.9 13.9l.8-4.5L1.5 6.2 6 5.6z"
            fill={i < value ? 'var(--accent-yellow)' : 'none'}
            stroke={i < value ? 'var(--accent-yellow)' : 'var(--stone)'}
            strokeWidth={1.2}
          />
        </svg>
      ))}
    </div>
  )
}
