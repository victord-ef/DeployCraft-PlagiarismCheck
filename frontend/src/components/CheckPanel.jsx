import { useState, useRef } from 'react'
import { checkText, checkFile } from '../api'
import HighlightedText from './HighlightedText'
import MatchCard from './MatchCard'

const VERDICT = {
  original:   { label: 'Original',   cls: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
  suspicious: { label: 'Suspicious', cls: 'bg-amber-50 border-amber-200 text-amber-800' },
  plagiarized:{ label: 'Plagiarized',cls: 'bg-red-50 border-red-200 text-red-800' },
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export default function CheckPanel() {
  const [text, setText]       = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)
  const [error, setError]     = useState(null)
  const fileRef = useRef(null)

  async function run(apiCall, textToShow) {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await apiCall()
      setResult(res)
      if (textToShow !== undefined) setText(textToShow)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    // For .txt read client-side so we can annotate; .docx shows match cards only
    let textToShow = ''
    if (file.name.endsWith('.txt')) textToShow = await file.text()
    await run(() => checkFile(file), textToShow)
    e.target.value = ''
  }

  const vc = result ? VERDICT[result.verdict] : null

  // Flatten all passages, annotated with their source doc, for HighlightedText
  const allPassages = result?.matches.flatMap(m =>
    m.matched_passages.map(p => ({ ...p, document_id: m.document_id, document_title: m.document_title }))
  ) ?? []

  return (
    <div className="space-y-6">

      {/* Input card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <label className="block text-sm font-semibold text-gray-700">Text to check</label>
        <textarea
          value={text}
          onChange={e => { setText(e.target.value); setResult(null); setError(null) }}
          rows={8}
          placeholder="Paste text here to check for plagiarism…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
        />
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 text-sm text-gray-500 border border-gray-300 rounded-lg px-3 py-2 hover:border-gray-400 hover:text-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            Upload .txt / .docx
          </button>
          <input ref={fileRef} type="file" accept=".txt,.docx" className="hidden" onChange={handleFile} />

          <button
            onClick={() => run(() => checkText(text))}
            disabled={!text.trim() || loading}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading && <Spinner />}
            {loading ? 'Checking…' : 'Check for Plagiarism'}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-start gap-2">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">

          {/* Verdict banner */}
          <div className={`border rounded-xl px-5 py-4 flex items-center justify-between ${vc.cls}`}>
            <div>
              <span className="text-lg font-bold uppercase tracking-wide">{vc.label}</span>
              <span className="ml-3 text-sm opacity-70">{result.word_count.toLocaleString()} words</span>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold tabular-nums">
                {(result.highest_similarity * 100).toFixed(1)}%
              </div>
              <div className="text-xs opacity-60">similarity</div>
            </div>
          </div>

          {/* Annotated text — only when we have the source text client-side */}
          {text && allPassages.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Annotated text</h3>
              <HighlightedText text={text} passages={allPassages} matches={result.matches} />
            </div>
          )}

          {/* Per-document match cards */}
          {result.matches.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">
                {result.matches.length} matching {result.matches.length === 1 ? 'document' : 'documents'} in corpus
              </h3>
              {result.matches.map(m => <MatchCard key={m.document_id} match={m} />)}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <svg className="w-10 h-10 text-emerald-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-gray-500">No matching documents found in the corpus.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
