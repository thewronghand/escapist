import { useState, useMemo } from 'react'
import type { Question } from '@/types'
import { CATEGORIES, BEHAVIORAL_CATEGORIES_SET } from '@/types'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { EmptyState } from '@/components/ui/EmptyState'
import { QuestionCard } from '@/components/learn/QuestionCard'

interface QuestionSelectProps {
  questions: Question[]
  onSelect: (question: Question) => void
  onAddNew: () => void
  onAutoGenerate: () => void
}

export function QuestionSelect({ questions, onSelect, onAddNew, onAutoGenerate }: QuestionSelectProps) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      if (search && !q.question.toLowerCase().includes(search.toLowerCase()) &&
          !q.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))) return false
      if (categoryFilter && q.category !== categoryFilter) return false
      if (statusFilter && q.status !== statusFilter) return false
      if (typeFilter) {
        const isBehavioral = BEHAVIORAL_CATEGORIES_SET.has(q.category)
        if (typeFilter === 'technical' && isBehavioral) return false
        if (typeFilter === 'behavioral' && !isBehavioral) return false
      }
      return true
    })
  }, [questions, search, categoryFilter, statusFilter, typeFilter])

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-ink text-[22px] font-semibold">학습</h2>
          <div className="flex items-center gap-2">
            <Button variant="tertiary" size="sm" icon="sparkle" onClick={onAutoGenerate}>
              질문 자동 생성
            </Button>
            <Button variant="primary" size="sm" icon="plus" onClick={onAddNew}>
              새 질문 등록
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="질문 또는 태그 검색..."
              className="w-full h-11 bg-surface-elevated border border-hairline rounded-lg pl-9 pr-3 text-[14px] text-body placeholder-stone focus:outline-none focus:border-hairline-strong"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-11 bg-surface-elevated border border-hairline rounded-lg px-3 text-[13px] text-body focus:outline-none appearance-none"
          >
            <option value="">전체 유형</option>
            <option value="technical">기술 면접</option>
            <option value="behavioral">인성 면접</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-11 bg-surface-elevated border border-hairline rounded-lg px-3 text-[13px] text-body focus:outline-none appearance-none"
          >
            <option value="">전체 카테고리</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 bg-surface-elevated border border-hairline rounded-lg px-3 text-[13px] text-body focus:outline-none appearance-none"
          >
            <option value="">전체 상태</option>
            <option value="unlearned">미학습</option>
            <option value="learning">학습중</option>
            <option value="weak">약함</option>
            <option value="master">마스터</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6">
        {filtered.length === 0 ? (
          <EmptyState
            icon="book"
            title="등록된 질문이 없어요"
            description="첫 질문을 추가하거나 자동 생성해보세요!"
            action={{ label: '질문 자동 생성', onClick: onAutoGenerate }}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((q) => (
              <QuestionCard key={q.id} question={q} onClick={() => onSelect(q)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
