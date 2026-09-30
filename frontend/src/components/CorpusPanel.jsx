import { useState, useEffect, useRef } from 'react'
import { listDocuments, addDocument, uploadDocument, deleteDocument } from '../api'

function fmt(n) { return n.toLocaleString() }
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function CorpusPanel() {
  const [docs, setDocs]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [mode, setMode]         = useState('text')   // 'text' | 'file'
  const [title, setTitle]       = useState('')
  const [content, setContent]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const fileRef = useRef(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { setDocs(await listDocuments()) } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!title.trim()) { setError('Title is required'); return }

    setSubmitting(true)
    try {
      if (mode === 'text') {
        if (!content.trim()) { setError('Content is required'); setSubmitting(false); return }
        await addDocument(title.trim(), content.trim())
        setContent('')
      } else {
        const file = fileRef.current?.files?.[0]
        if (!file) { setError('Select a file'); setSubmitting(false); return }
        await uploadDocument(title.trim(), file)
        if (fileRef.current) fileRef.current.value = ''
      }
      setTitle('')
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    setDeleteId(id)
    try {
      await deleteDocument(id)
      setDocs(prev => prev.filter(d => d.id !== id))
    } catch { /* ignore */ }
    finally { setDeleteId(null) }
  }

  return (
    <div className="space-y-6">

      {/* Add document card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Add document to corpus</h2>

        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          {[{ id: 'text', label: 'Paste text' }, { id: 'file', label: 'Upload file' }].map(({ id, label }) => (
            <button key={id} onClick={() => setMode(id)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                mode === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Document title *"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {mode === 'text' ? (
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={5}
              placeholder="Paste document content here…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
            />
          ) : (
            <label className="flex items-center gap-3 border border-dashed border-gray-300 rounded-lg px-4 py-4 cursor-pointer hover:border-indigo-400 transition-colors">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span className="text-sm text-gray-500">Choose .txt or .docx file</span>
              <input ref={fileRef} type="file" accept=".txt,.docx" className="hidden" />
            </label>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={submitting}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Adding…' : 'Add document'}
          </button>
        </form>
      </div>

      {/* Document list */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">
            Corpus
            {!loading && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                {docs.length} {docs.length === 1 ? 'document' : 'documents'}
              </span>
            )}
          </h2>
        </div>

        {loading ? (
          <div className="px-6 py-10 text-center text-sm text-gray-400">Loading…</div>
        ) : docs.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm text-gray-400">No documents yet.</p>
            <p className="text-xs text-gray-400 mt-1">Add source documents above to enable plagiarism detection.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {docs.map(doc => (
              <li key={doc.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 group">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {fmt(doc.word_count)} words · {fmt(doc.char_count)} chars · Added {fmtDate(doc.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(doc.id)}
                  disabled={deleteId === doc.id}
                  title="Remove from corpus"
                  className="ml-4 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                >
                  {deleteId === doc.id ? (
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
