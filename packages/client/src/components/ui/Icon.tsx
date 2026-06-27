const ICONS: Record<string, string> = {
  home: 'M3 10.5 12 3l9 7.5 M5.5 9.2V20h13V9.2 M10 20v-5h4v5',
  book: 'M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z M19 18v3H6.5A1.5 1.5 0 0 1 5 19.5',
  mic: 'M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z M6 11a6 6 0 0 0 12 0 M12 17v4 M9 21h6',
  infinity: 'M6.5 9c-2 0-3.5 1.3-3.5 3s1.5 3 3.5 3c3 0 4-6 7-6 2 0 3.5 1.3 3.5 3s-1.5 3-3.5 3c-3 0-4-6-7-6z',
  settings: 'M4 7h10 M18 7h2 M4 12h2 M10 12h10 M4 17h7 M15 17h5 M14 5v4 M6 10v4 M11 15v4',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M20 20l-4.2-4.2',
  plus: 'M12 5v14 M5 12h14',
  send: 'M5 12 19 5l-4 14-3.5-6.5L5 12z',
  arrowup: 'M12 19V6 M6 12l6-6 6 6',
  x: 'M6 6l12 12 M18 6 6 18',
  check: 'M4.5 12.5 9 17 19.5 6.5',
  chevdown: 'M6 9l6 6 6-6',
  chevright: 'M9 6l6 6-6 6',
  chevleft: 'M15 6l-6 6 6 6',
  flame: 'M12 3c1 3-1 4-1 6 0 1 .7 2 1.8 2 1.4 0 2.2-1.2 2.2-2.5 2 1.4 3 3.4 3 5.5a6 6 0 1 1-12 0c0-3 2-5 3-6.5C9.6 8 11 6 12 3z',
  clock: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z M12 8v4.5l3 2',
  target: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z M12 11.5a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1z',
  refresh: 'M4 11a8 8 0 0 1 13.5-4.5L20 9 M20 4v5h-5 M20 13a8 8 0 0 1-13.5 4.5L4 15 M4 20v-5h5',
  lightbulb: 'M9 17h6 M10 21h4 M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z',
  code: 'M9 8l-4 4 4 4 M15 8l4 4-4 4',
  diagram: 'M8 3h8v4H8z M3 17h6v4H3z M15 17h6v4h-6z M12 7v4 M6 17v-2h12v2',
  filter: 'M4 5h16l-6 7v6l-4 2v-8z',
  trophy: 'M7 4h10v4a5 5 0 0 1-10 0z M7 6H4v1a3 3 0 0 0 3 3 M17 6h3v1a3 3 0 0 1-3 3 M10 13h4l.5 4h-5z M8 20h8',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z',
  edit: 'M4 16.5V20h3.5L18 9.5 14.5 6z M13 7.5 16.5 11',
  trash: 'M5 7h14 M9 7V5h6v2 M7 7l1 13h8l1-13',
  question: 'M9.2 9a3 3 0 1 1 4 2.8c-.9.4-1.2 1-1.2 2 M12 17h.01',
  list: 'M8 6h12 M8 12h12 M8 18h12 M4 6h.01 M4 12h.01 M4 18h.01',
  grid: 'M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z',
  user: 'M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M5 20a7 7 0 0 1 14 0',
  globe: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z M4 12h16 M12 4c2.5 2 2.5 14 0 16 M12 4c-2.5 2-2.5 14 0 16',
  chart: 'M5 19V5 M5 19h14 M9 16v-4 M13 16V9 M17 16v-7',
  enter: 'M9 10l-3 3 3 3 M6 13h9a4 4 0 0 0 4-4V6',
}

interface IconProps {
  name: string
  size?: number
  stroke?: string
  strokeWidth?: number
  className?: string
  style?: React.CSSProperties
}

export function Icon({ name, size = 18, stroke, strokeWidth = 1.6, className, style }: IconProps) {
  const d = ICONS[name]
  if (!d) return null

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke ?? 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {d.split(' M').map((seg, i) => (
        <path key={i} d={(i ? 'M' : '') + seg} />
      ))}
    </svg>
  )
}
