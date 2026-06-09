import { useState } from 'react'
import { StippleOverlay } from '@/components/ui/StippleOverlay'
import { Icon } from '@/components/ui/Icon'

const SHAPES = [
  '/1.png',
  '/3.png',
  '/6.png',
  '/7.png',
  '/16.png',
  '/20.png',
  '/42.png',
]

export function BackgroundShapes() {
  const [current, setCurrent] = useState(0)

  const next = () => setCurrent((prev) => (prev + 1) % SHAPES.length)

  return (
    <>
      {/* 배경 레이어 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <StippleOverlay
          key={current}
          src={SHAPES[current]}
          density={4}
          dotSize={2}
          colorStart="#ff8888"
          colorEnd="#ff2222"
        />
      </div>

      {/* 전환 버튼 — 샌드박스 옆 */}
      <button
        onClick={next}
        className="fixed bottom-5 right-[76px] w-12 h-12 rounded-full bg-surface/60 backdrop-blur-md border border-hairline/50 flex items-center justify-center text-ash hover:text-body hover:scale-105 transition-all z-50"
        title="배경 변경"
      >
        <Icon name="refresh" size={18} />
      </button>
    </>
  )
}
