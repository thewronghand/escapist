import { CATEGORIES } from '@/types'

interface CategoryPickerProps {
  selected: string[]
  onChange: (categories: string[]) => void
}

export function CategoryPicker({ selected, onChange }: CategoryPickerProps) {
  const toggle = (cat: string) => {
    onChange(
      selected.includes(cat)
        ? selected.filter((c) => c !== cat)
        : [...selected, cat],
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => toggle(cat)}
          className={`px-3 py-1.5 rounded-full text-[12px] border transition-colors ${
            selected.includes(cat) || selected.length === 0
              ? 'border-hairline-strong bg-surface-elevated text-ink'
              : 'border-hairline text-stone hover:text-mute'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}
