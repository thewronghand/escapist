import { useState, useCallback } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { DifficultyStars } from '@/components/ui/DifficultyStars'
import { CATEGORIES } from '@/types'

interface QuestionFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: {
    question: string
    category: string
    tags: string[]
    difficulty: number
  }) => void
}

export function QuestionFormModal({ open, onClose, onSubmit }: QuestionFormModalProps) {
  const [question, setQuestion] = useState('')
  const [category, setCategory] = useState<string>(CATEGORIES[0])
  const [difficulty, setDifficulty] = useState(3)
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  const handleTagKey = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault()
      const tag = tagInput.trim().replace(',', '')
      if (tag && !tags.includes(tag)) {
        setTags([...tags, tag])
      }
      setTagInput('')
    }
    if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1))
    }
  }

  const handleSubmit = useCallback(() => {
    if (!question.trim()) return
    onSubmit({ question: question.trim(), category, tags, difficulty })
    setQuestion('')
    setCategory(CATEGORIES[0])
    setDifficulty(3)
    setTags([])
    onClose()
  }, [question, category, tags, difficulty, onSubmit, onClose])

  return (
    <Modal open={open} onClose={onClose} title="새 질문 등록" subtitle="면접에서 나올 수 있는 질문을 추가하세요">
      <div className="flex flex-col gap-4">
        <div>
          <label className="text-[13px] text-mute mb-1.5 block">질문 *</label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="예: var, let, const의 차이를 설명해주세요"
            rows={3}
            className="w-full bg-surface-elevated border border-hairline rounded-md px-3 py-2.5 text-[14px] text-body placeholder-stone resize-y focus:outline-none focus:border-hairline-strong"
          />
        </div>

        <div>
          <label className="text-[13px] text-mute mb-1.5 block">카테고리 *</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-surface-elevated border border-hairline rounded-md px-3 py-2.5 text-[14px] text-body focus:outline-none focus:border-hairline-strong appearance-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[13px] text-mute mb-1.5 block">난이도</label>
          <DifficultyStars value={difficulty} onChange={setDifficulty} size={18} />
        </div>

        <div>
          <label className="text-[13px] text-mute mb-1.5 block">태그</label>
          <div className="flex flex-wrap gap-1.5 bg-surface-elevated border border-hairline rounded-md px-3 py-2 min-h-[40px] focus-within:border-hairline-strong">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-surface-card text-[12px] text-mute"
              >
                {tag}
                <button onClick={() => setTags(tags.filter((t) => t !== tag))} className="text-ash hover:text-body">
                  &times;
                </button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKey}
              placeholder={tags.length ? '' : 'Enter로 추가'}
              className="flex-1 min-w-[80px] bg-transparent text-[14px] text-body placeholder-stone outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <Button variant="secondary" onClick={onClose}>취소</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!question.trim()}>등록</Button>
        </div>
      </div>
    </Modal>
  )
}
