import { useState } from 'react'
import CheckPanel from './components/CheckPanel'
import CorpusPanel from './components/CorpusPanel'

export default function App() {
  const [tab, setTab] = useState('check')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-lg font-semibold text-gray-900">PlagiarismCheck</span>
          </div>
          <nav className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {[
              { id: 'check', label: 'Check text' },
              { id: 'corpus', label: 'Corpus' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  tab === id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {tab === 'check' ? <CheckPanel /> : <CorpusPanel />}
      </main>
    </div>
  )
}
