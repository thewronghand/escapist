function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const
}

function lerpHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const bl = Math.round(ab + (bb - ab) * t)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`
}

const SCORE_STOPS: [number, string][] = [
  [0, '#ff5151'],
  [0.45, '#ffb020'],
  [0.7, '#9bd84e'],
  [1, '#59d499'],
]

export function scoreColor(score: number, max = 10): string {
  const t = Math.max(0, Math.min(1, score / max))
  for (let i = 0; i < SCORE_STOPS.length - 1; i++) {
    const [p0, c0] = SCORE_STOPS[i]
    const [p1, c1] = SCORE_STOPS[i + 1]
    if (t <= p1) return lerpHex(c0, c1, (t - p0) / (p1 - p0))
  }
  return SCORE_STOPS[SCORE_STOPS.length - 1][1]
}

export function gradeFor(pct: number): string {
  if (pct >= 90) return 'S'
  if (pct >= 80) return 'A'
  if (pct >= 70) return 'B'
  if (pct >= 60) return 'C'
  if (pct >= 50) return 'D'
  return 'F'
}

export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * Claude 응답에서 JSON을 추출하고 파싱한다.
 * 마크다운 코드블록(```json ... ```)으로 감싸져 있어도 처리.
 * 파싱 실패 시 원본 텍스트를 반환.
 */
export function parseClaudeJson<T = Record<string, unknown>>(raw: string): { parsed: T | null; text: string } {
  // 마크다운 코드블록 제거
  let cleaned = raw.trim()
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim()
  }

  try {
    const parsed = JSON.parse(cleaned) as T
    return { parsed, text: cleaned }
  } catch {
    // 코드블록 밖에도 JSON이 있을 수 있음
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]) as T
        return { parsed, text: jsonMatch[0] }
      } catch {
        // 파싱 불가
      }
    }
    return { parsed: null, text: raw }
  }
}
