export function parseClaudeJson<T = Record<string, unknown>>(raw: string): { parsed: T | null; text: string } {
  let cleaned = raw.trim()
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim()
  }

  try {
    const parsed = JSON.parse(cleaned) as T
    return { parsed, text: cleaned }
  } catch {
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

export function stripCodeBlock(raw: string): string {
  const cleaned = raw.trim()
  const match = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
  return match ? match[1].trim() : cleaned
}
