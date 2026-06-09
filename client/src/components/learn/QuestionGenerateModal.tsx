import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { CategoryTag } from '@/components/ui/CategoryTag'
import { useQuestionGenerator } from '@/hooks/useQuestionGenerator'

interface QuestionGenerateModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
}

export function QuestionGenerateModal({ open, onClose, onSaved }: QuestionGenerateModalProps) {
  const { generating, generatedQuestions, generate, saveQuestion, saveAll, clear } = useQuestionGenerator()
  const [type, setType] = useState<'technical' | 'behavioral' | 'both'>('both')
  const [count, setCount] = useState(5)
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set())

  const handleGenerate = () => {
    setSavedIds(new Set())
    generate(type, count)
  }

  const handleSaveOne = async (idx: number) => {
    const q = generatedQuestions[idx]
    await saveQuestion(q)
    setSavedIds((prev) => new Set(prev).add(idx))
  }

  const handleSaveAll = async () => {
    await saveAll()
    setSavedIds(new Set(generatedQuestions.map((_, i) => i)))
    onSaved()
  }

  const handleClose = () => {
    clear()
    setSavedIds(new Set())
    onClose()
    if (savedIds.size > 0) onSaved()
  }

  return (
    <Modal open={open} onClose={handleClose} title="질문 자동 생성" subtitle="Claude가 웹에서 면접 질문을 검색해서 생성합니다">
      {generatedQuestions.length === 0 ? (
        <div className="flex flex-col gap-4">
          {/* 유형 선택 */}
          <div>
            <label className="text-[13px] text-mute mb-2 block">면접 유형</label>
            <div className="flex bg-surface-card rounded-md p-0.5 gap-0.5">
              {[
                { value: 'both', label: '기술+인성' },
                { value: 'technical', label: '기술 면접' },
                { value: 'behavioral', label: '인성 면접' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setType(opt.value as typeof type)}
                  className={`flex-1 px-3 py-1.5 rounded-sm text-[13px] transition-colors ${
                    type === opt.value ? 'bg-surface-elevated text-ink shadow-sm' : 'text-mute hover:text-body'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 개수 */}
          <div>
            <label className="text-[13px] text-mute mb-2 block">생성 개수</label>
            <div className="flex bg-surface-card rounded-md p-0.5 gap-0.5">
              {[3, 5, 10].map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`flex-1 px-3 py-1.5 rounded-sm text-[13px] transition-colors ${
                    count === n ? 'bg-surface-elevated text-ink shadow-sm' : 'text-mute hover:text-body'
                  }`}
                >
                  {n}개
                </button>
              ))}
            </div>
          </div>

          <Button
            variant="primary"
            full
            icon="sparkle"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? '생성 중...' : '질문 생성하기'}
          </Button>

          {generating && (
            <div className="flex items-center justify-center gap-2 py-4">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-accent-purple"
                    style={{ animation: 'esc-blink 1.2s infinite', animationDelay: `${i * 0.18}s` }}
                  />
                ))}
              </div>
              <span className="text-mute text-[13px]">면접 질문을 검색하고 있어요...</span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-mute">{generatedQuestions.length}개 생성됨</span>
            <Button variant="primary" size="sm" onClick={handleSaveAll} disabled={savedIds.size === generatedQuestions.length}>
              전부 저장
            </Button>
          </div>

          <div className="max-h-[400px] overflow-auto flex flex-col gap-2">
            {generatedQuestions.map((q, i) => (
              <div key={i} className="bg-surface-elevated border border-hairline rounded-lg p-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] text-ink">{q.question}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <CategoryTag category={q.category} />
                    <span className="text-[11px] text-stone px-1.5 py-0.5 rounded bg-surface-card">
                      {q.interviewType === 'behavioral' ? '인성' : '기술'}
                    </span>
                    <span className="text-[11px] text-stone">난이도 {q.difficulty}</span>
                  </div>
                </div>
                {savedIds.has(i) ? (
                  <Icon name="check" size={16} stroke="var(--accent-green)" className="shrink-0 mt-1" />
                ) : (
                  <Button variant="tertiary" size="sm" onClick={() => handleSaveOne(i)}>저장</Button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-2">
            <Button variant="secondary" size="sm" onClick={handleGenerate} disabled={generating}>
              다시 생성
            </Button>
            <Button variant="secondary" size="sm" onClick={handleClose}>닫기</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
