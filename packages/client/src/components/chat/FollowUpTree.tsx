import { useMemo, useCallback } from 'react'
import {
  ReactFlow,
  type Node,
  type Edge,
  Position,
  Handle,
  useNodesState,
  useEdgesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { FollowUpNode } from '@/types'
import { ScoreRing } from '@/components/ui/ScoreRing'

interface TreeNodeData {
  question: string
  score?: number
  status: 'answered' | 'unanswered' | 'current'
  [key: string]: unknown
}

function TreeNodeComponent({ data }: { data: TreeNodeData }) {
  const isCurrent = data.status === 'current'
  const isUnanswered = data.status === 'unanswered'

  return (
    <div
      className={`px-3 py-2.5 rounded-lg border max-w-[200px] ${
        isCurrent
          ? 'border-accent-blue bg-surface-elevated'
          : isUnanswered
            ? 'border-dashed border-hairline bg-surface'
            : 'border-hairline bg-surface'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-hairline !w-2 !h-2 !border-0" />
      <div className="flex items-start gap-2">
        {data.score != null ? (
          <ScoreRing score={data.score} size={30} className="shrink-0" />
        ) : (
          <div className="w-[30px] h-[30px] rounded-full border border-dashed border-hairline flex items-center justify-center shrink-0">
            <span className="text-stone text-[10px]">?</span>
          </div>
        )}
        <p className="text-[11px] text-body leading-snug line-clamp-3">{data.question}</p>
      </div>
      {isCurrent && (
        <span className="text-[9px] text-accent-blue mt-1 block">진행 중</span>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-hairline !w-2 !h-2 !border-0" />
    </div>
  )
}

const nodeTypes = { treeNode: TreeNodeComponent }

interface FollowUpTreeProps {
  tree: FollowUpNode
  onNodeClick?: (node: FollowUpNode) => void
  className?: string
}

export function FollowUpTree({ tree, onNodeClick, className }: FollowUpTreeProps) {
  const { nodes: flowNodes, edges: flowEdges } = useMemo(() => {
    const nodes: Node<TreeNodeData>[] = []
    const edges: Edge[] = []

    function traverse(node: FollowUpNode, x: number, y: number, parentId?: string) {
      const nodeId = node.id
      nodes.push({
        id: nodeId,
        type: 'treeNode',
        position: { x, y },
        data: {
          question: node.question,
          score: node.score,
          status: node.status,
        },
      })

      if (parentId) {
        edges.push({
          id: `${parentId}-${nodeId}`,
          source: parentId,
          target: nodeId,
          style: { stroke: 'var(--hairline)', strokeWidth: 1 },
        })
      }

      const childWidth = 240
      const totalWidth = node.children.length * childWidth
      const startX = x - totalWidth / 2 + childWidth / 2

      node.children.forEach((child, i) => {
        traverse(child, startX + i * childWidth, y + 120, nodeId)
      })
    }

    traverse(tree, 300, 40)
    return { nodes, edges }
  }, [tree])

  const [nodes, , onNodesChange] = useNodesState(flowNodes)
  const [edges, , onEdgesChange] = useEdgesState(flowEdges)

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    function findNode(root: FollowUpNode, id: string): FollowUpNode | null {
      if (root.id === id) return root
      for (const child of root.children) {
        const found = findNode(child, id)
        if (found) return found
      }
      return null
    }
    const found = findNode(tree, node.id)
    if (found) onNodeClick?.(found)
  }, [tree, onNodeClick])

  return (
    <div className={`w-full h-full ${className ?? ''}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        style={{ background: 'var(--canvas)' }}
      />
    </div>
  )
}
