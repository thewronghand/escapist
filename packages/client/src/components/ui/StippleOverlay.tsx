import { useEffect, useRef, useCallback } from 'react'

interface StippleOverlayProps {
  src: string
  density?: number
  dotSize?: number
  colorStart?: string
  colorEnd?: string
  invert?: boolean
  className?: string
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function lerpColor(start: [number, number, number], end: [number, number, number], t: number): string {
  const r = Math.round(start[0] + (end[0] - start[0]) * t)
  const g = Math.round(start[1] + (end[1] - start[1]) * t)
  const b = Math.round(start[2] + (end[2] - start[2]) * t)
  return `${r}, ${g}, ${b}`
}

export function StippleOverlay({
  src,
  density = 3,
  dotSize = 1.5,
  colorStart = '#ff5757',
  colorEnd = '#a1131a',
  invert = false,
  className,
}: StippleOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const dpr = window.devicePixelRatio || 1
      const w = canvas.parentElement?.clientWidth ?? window.innerWidth
      const h = canvas.parentElement?.clientHeight ?? window.innerHeight

      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`

      // 오프스크린: 이미지 → 픽셀 밝기 추출
      const offscreen = document.createElement('canvas')
      const sampleW = Math.floor(w / density)
      const sampleH = Math.floor(h / density)
      offscreen.width = sampleW
      offscreen.height = sampleH

      const offCtx = offscreen.getContext('2d')
      if (!offCtx) return

      const imgAspect = img.width / img.height
      const canvasAspect = sampleW / sampleH
      let drawW: number, drawH: number, drawX: number, drawY: number

      const scale = 2
      if (imgAspect > canvasAspect) {
        drawW = sampleW * scale
        drawH = (sampleW / imgAspect) * scale
      } else {
        drawH = sampleH * scale
        drawW = (sampleH * imgAspect) * scale
      }
      drawX = (sampleW - drawW) / 2
      drawY = (sampleH - drawH) / 2

      offCtx.drawImage(img, drawX, drawY, drawW, drawH)
      const imageData = offCtx.getImageData(0, 0, sampleW, sampleH)
      const pixels = imageData.data

      // 점 찍기 — 위치 기반 그라디언트 컬러
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, w, h)

      const rgbStart = hexToRgb(colorStart)
      const rgbEnd = hexToRgb(colorEnd)

      // 알파 맵 + 박스 블러로 산포 영역 생성
      const alphaMap: number[] = new Array(sampleW * sampleH)
      for (let j = 0; j < alphaMap.length; j++) {
        alphaMap[j] = pixels[j * 4 + 3]
      }

      const spread = 30
      const blurred = new Float32Array(sampleW * sampleH)
      for (let y = 0; y < sampleH; y++) {
        for (let x = 0; x < sampleW; x++) {
          let sum = 0, count = 0
          const yMin = Math.max(0, y - spread), yMax = Math.min(sampleH - 1, y + spread)
          const xMin = Math.max(0, x - spread), xMax = Math.min(sampleW - 1, x + spread)
          for (let ny = yMin; ny <= yMax; ny++) {
            for (let nx = xMin; nx <= xMax; nx++) {
              sum += alphaMap[ny * sampleW + nx]
              count++
            }
          }
          blurred[y * sampleW + x] = sum / count
        }
      }

      // 점 찍기
      for (let y = 0; y < sampleH; y++) {
        for (let x = 0; x < sampleW; x++) {
          const idx = y * sampleW + x
          const i = idx * 4
          const r = pixels[i]
          const g = pixels[i + 1]
          const b = pixels[i + 2]
          const a = pixels[i + 3]
          const ba = blurred[idx]

          if (a < 10 && ba < 5) continue

          let prob: number
          let dotR: number

          if (a >= 10) {
            const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255
            const threshold = invert ? brightness : 1 - brightness
            prob = threshold * 0.8
            dotR = dotSize * (0.3 + threshold * 0.7)
          } else {
            // 거리 기반 감쇠: 블러값이 높을수록(가까울수록) 확률 높고 점 큼
            const falloff = ba / 255
            prob = falloff * 0.3
            dotR = dotSize * (0.2 + falloff * 0.5)
          }

          if (Math.random() < prob) {
            const dotX = x * density
            const dotY = y * density
            const gradientT = y / sampleH
            const rgb = lerpColor(rgbStart, rgbEnd, gradientT)

            ctx.beginPath()
            ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2)
            ctx.fillStyle = `rgb(${rgb})`
            ctx.fill()
          }
        }
      }
    }
    img.src = src
  }, [src, density, dotSize, colorStart, colorEnd, invert])

  useEffect(() => {
    draw()
    window.addEventListener('resize', draw)
    return () => window.removeEventListener('resize', draw)
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className ?? ''}`}
    />
  )
}
