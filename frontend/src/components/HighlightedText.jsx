// One color per source document (up to 5, then wraps)
const DOC_PALETTES = [
  { bg: 'bg-yellow-200', border: 'border-yellow-400', dot: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { bg: 'bg-blue-200',   border: 'border-blue-400',   dot: 'bg-blue-400',   badge: 'bg-blue-100 text-blue-800 border-blue-300' },
  { bg: 'bg-rose-200',   border: 'border-rose-400',   dot: 'bg-rose-400',   badge: 'bg-rose-100 text-rose-800 border-rose-300' },
  { bg: 'bg-emerald-200',border: 'border-emerald-400',dot: 'bg-emerald-400',badge: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { bg: 'bg-purple-200', border: 'border-purple-400', dot: 'bg-purple-400', badge: 'bg-purple-100 text-purple-800 border-purple-300' },
]

/**
 * Split text into segments based on passage positions.
 * Returns [{text, start, end, passages}] where passages is an array of
 * matching passage objects that overlap this segment.
 */
function buildSegments(text, passages) {
  if (!passages.length) return [{ text, start: 0, end: text.length, passages: [] }]

  const bounds = new Set([0, text.length])
  for (const p of passages) {
    if (p.query_start >= 0 && p.query_start <= text.length) bounds.add(p.query_start)
    if (p.query_end   >= 0 && p.query_end   <= text.length) bounds.add(p.query_end)
  }

  const sorted = [...bounds].sort((a, b) => a - b)
  return sorted.slice(0, -1).map((start, i) => {
    const end = sorted[i + 1]
    return {
      text: text.slice(start, end),
      start,
      end,
      passages: passages.filter(p => p.query_start <= start && p.query_end >= end),
    }
  })
}

export default function HighlightedText({ text, passages, matches }) {
  // Build stable doc_id → palette index map ordered by first appearance
  const docOrder = []
  for (const m of matches) {
    if (!docOrder.includes(m.document_id)) docOrder.push(m.document_id)
  }
  const docPalette = (id) => DOC_PALETTES[docOrder.indexOf(id) % DOC_PALETTES.length]

  const segments = buildSegments(text, passages)

  return (
    <div className="space-y-3">
      {/* Legend – only show when multiple source docs */}
      {matches.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {matches.map(m => {
            const p = docPalette(m.document_id)
            return (
              <span key={m.document_id}
                className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${p.badge}`}>
                <span className={`w-2 h-2 rounded-full ${p.dot}`} />
                {m.document_title} — {(m.similarity * 100).toFixed(1)}%
              </span>
            )
          })}
        </div>
      )}

      {/* Annotated text */}
      <div className="text-sm leading-relaxed whitespace-pre-wrap font-mono text-gray-800 bg-gray-50 rounded-lg p-4 border border-gray-200">
        {segments.map((seg, i) => {
          if (!seg.passages.length) return <span key={i}>{seg.text}</span>

          const primary = seg.passages[0]
          const p = docPalette(primary.document_id)
          const titles = seg.passages.map(pa => pa.document_title).join(', ')

          return (
            <mark
              key={i}
              title={`Matched in: ${titles}`}
              className={`${p.bg} border-b-2 ${p.border} rounded-sm cursor-help`}
            >
              {seg.text}
            </mark>
          )
        })}
      </div>

      {/* Key */}
      <p className="text-xs text-gray-400">
        Hover highlighted text to see source document name.
      </p>
    </div>
  )
}
