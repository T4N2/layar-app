import type { Title } from '../types'
import { Card } from './Card'

interface RowProps {
  title: string
  items: Title[]
  progressOf?: (id: string) => number
  showProgress?: boolean
  onOpen: (item: Title) => void
  onPlay: (item: Title) => void
}

export function Row({ title, items, progressOf, showProgress, onOpen, onPlay }: RowProps) {
  if (items.length === 0) return null

  return (
    <section className="row">
      <div className="row-head">
        <h2 className="row-title">{title}</h2>
        <span className="row-count">{items.length} judul</span>
      </div>
      <div className="scroller">
        {items.map((item) => (
          <Card
            key={item.id}
            item={item}
            progress={showProgress && progressOf ? progressOf(item.id) : undefined}
            onOpen={onOpen}
            onPlay={onPlay}
          />
        ))}
      </div>
    </section>
  )
}
