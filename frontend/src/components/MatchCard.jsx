import { useState } from 'react'

function SimilarityBar({ pct }) {
  const color = pct >= 50 ? 'bg-red-500' : pct >= 15 ? 'bg-amber-500' : 'bg-emerald-500'
  return (
    <div className="flex items-center gap-2">
      <div className="w-28 bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-sm font-semibold text-gray-700 w-12 text-right tabular-nums">{pct.toFixed(1)}%</span>
    </div>
  )
}

export default function MatchCard({ match }) {
  const [open, setOpen] = useState(false)
  const pct = match.similarity * 100
  const count = match.matched_passages.length

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header row — always visible */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{match.document_title}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {count} matched passage{count !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <SimilarityBar pct={pct} />
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded passage view */}
      {open && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {match.matched_passages.map((p, i) => (
            <div key={i} className="px-5 py-4 grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Your text</p>
                <p className="text-xs text-gray-700 font-mono bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
                  &ldquo;{p.query_text}&rdquo;
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Source</p>
                <p className="text-xs text-gray-700 font-mono bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 leading-relaxed">
                  &ldquo;{p.source_text}&rdquo;
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
