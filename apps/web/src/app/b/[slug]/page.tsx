'use client'

import { useState } from 'react'
import { ThumbsUp, Plus, X, ChevronDown } from 'lucide-react'

// Sprint 2.5 — Public Board UI — Wren
// Public-facing board for submitting and voting on feature requests

// ─── Types ─────────────────────────────────────────────────────────────────────

type RequestStatus = 'under_review' | 'planned' | 'in_progress' | 'shipped' | 'wont_do'

interface FeedbackRequest {
  id: string
  title: string
  description: string
  status: RequestStatus
  voteCount: number
  hasVoted: boolean
  createdAt: string
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<RequestStatus, { label: string; color: string; dot: string }> = {
  under_review: { label: 'Under Review', color: 'text-gray-500 bg-gray-100',     dot: 'bg-gray-400' },
  planned:      { label: 'Planned',      color: 'text-blue-700 bg-blue-50',      dot: 'bg-blue-500' },
  in_progress:  { label: 'In Progress',  color: 'text-amber-700 bg-amber-50',    dot: 'bg-amber-500' },
  shipped:      { label: 'Shipped',      color: 'text-emerald-700 bg-emerald-50',dot: 'bg-emerald-500' },
  wont_do:      { label: "Won't Do",     color: 'text-red-600 bg-red-50',        dot: 'bg-red-500' },
}

const STATUS_FILTERS: { label: string; value: RequestStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Under Review', value: 'under_review' },
  { label: 'Planned', value: 'planned' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Shipped', value: 'shipped' },
]

const MOCK_REQUESTS: FeedbackRequest[] = [
  {
    id: '1',
    title: 'Dark mode support across all pages',
    description: 'Would love to see a system-level dark mode toggle that persists across sessions and respects the OS preference.',
    status: 'planned',
    voteCount: 94,
    hasVoted: false,
    createdAt: '3 days ago',
  },
  {
    id: '2',
    title: 'CSV export for all feedback requests',
    description: "Need to export feedback data to CSV for sharing with stakeholders who don't have access to the dashboard.",
    status: 'in_progress',
    voteCount: 67,
    hasVoted: true,
    createdAt: '1 week ago',
  },
  {
    id: '3',
    title: 'Slack integration for new requests',
    description: 'Get notified in Slack when new feedback is submitted or status changes. Would save checking the dashboard manually.',
    status: 'planned',
    voteCount: 52,
    hasVoted: false,
    createdAt: '2 weeks ago',
  },
  {
    id: '4',
    title: 'Keyboard shortcuts for status changes',
    description: 'Power users would benefit from keyboard shortcuts to quickly change request statuses without using the mouse.',
    status: 'under_review',
    voteCount: 38,
    hasVoted: false,
    createdAt: '3 weeks ago',
  },
  {
    id: '5',
    title: 'Custom categories / labels',
    description: 'Allow us to create custom labels like "bug", "enhancement", "question" for better organization.',
    status: 'under_review',
    voteCount: 29,
    hasVoted: false,
    createdAt: '1 month ago',
  },
  {
    id: '6',
    title: 'Email digest for weekly summary',
    description: 'A weekly email digest summarizing top voted requests, status changes, and new submissions.',
    status: 'shipped',
    voteCount: 21,
    hasVoted: false,
    createdAt: '2 months ago',
  },
]

// ─── Submit Modal ──────────────────────────────────────────────────────────────

function SubmitModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (title: string, desc: string, email: string) => void }) {
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [email, setEmail] = useState('')
  const [step, setStep] = useState<'form' | 'success'>('form')

  const handleSubmit = () => {
    if (!title.trim() || !email.trim()) return
    setStep('success')
  }

  if (step === 'success') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
        <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 text-center">
          <div className="w-14 h-14 rounded-full bg-[#7c3bed]/10 flex items-center justify-center mx-auto mb-4">
            <ThumbsUp className="w-7 h-7 text-[#7c3bed]" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Thanks for your idea! 🎉</h2>
          <p className="text-sm text-gray-500 mb-6">We'll review your submission and notify you when the status changes.</p>
          <button onClick={onClose} className="px-6 py-2 rounded-lg text-sm font-medium text-white bg-[#7c3bed] hover:bg-[#6d28d9] transition-colors">
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">Share your idea</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Your idea <span className="text-red-500">*</span></label>
            <input
              type="text"
              placeholder="e.g. Dark mode support"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#7c3bed]/50 focus:bg-white transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Details <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea
              rows={3}
              placeholder="Describe your idea in more detail..."
              value={desc}
              onChange={e => setDesc(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#7c3bed]/50 focus:bg-white transition-colors resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Your email <span className="text-red-500">*</span></label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#7c3bed]/50 focus:bg-white transition-colors"
            />
            <p className="text-[10px] text-gray-400 mt-1">We'll notify you of status updates. No spam, ever.</p>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !email.trim()}
            className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-white bg-[#7c3bed] hover:bg-[#6d28d9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Submit Idea
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Vote Email Modal ──────────────────────────────────────────────────────────

function VoteEmailModal({ requestId, onClose, onVote }: { requestId: string; onClose: () => void; onVote: (id: string) => void }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const handleVote = () => {
    if (!email.trim()) return
    setSent(true)
    setTimeout(() => {
      onVote(requestId)
      onClose()
    }, 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 text-center">
        {sent ? (
          <>
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
              <ThumbsUp className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">Check your email!</p>
            <p className="text-xs text-gray-500">We sent a confirmation link to {email}</p>
          </>
        ) : (
          <>
            <ThumbsUp className="w-8 h-8 text-[#7c3bed] mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900 mb-1">Vote on this idea</h3>
            <p className="text-xs text-gray-500 mb-4">Enter your email to verify your vote. No account needed.</p>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#7c3bed]/50 mb-3"
            />
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 px-3 py-2 rounded-lg text-sm text-gray-500 bg-gray-100 hover:bg-gray-200">Cancel</button>
              <button
                onClick={handleVote}
                disabled={!email.trim()}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-white bg-[#7c3bed] hover:bg-[#6d28d9] disabled:opacity-50"
              >
                Send link
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Request Card ──────────────────────────────────────────────────────────────

function PublicRequestCard({ request, onVote }: { request: FeedbackRequest; onVote: (id: string) => void }) {
  const status = STATUS_CONFIG[request.status]

  return (
    <div className="flex items-start gap-4 p-5 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
      {/* Upvote */}
      <button
        onClick={() => onVote(request.id)}
        className={`flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-lg border transition-all flex-shrink-0 ${
          request.hasVoted
            ? 'bg-[#7c3bed] border-[#7c3bed] text-white'
            : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-[#7c3bed]/40 hover:text-[#7c3bed] hover:bg-[#7c3bed]/5'
        }`}
      >
        <ThumbsUp className="w-4 h-4" />
        <span className="text-xs font-semibold">{request.voteCount}</span>
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-1.5">
          <h3 className="text-sm font-semibold text-gray-900 leading-snug">{request.title}</h3>
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${status.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{request.description}</p>
        <p className="text-[10px] text-gray-400 mt-2">{request.createdAt}</p>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PublicBoardPage({ params }: { params: { slug: string } }) {
  const [activeFilter, setActiveFilter] = useState<RequestStatus | 'all'>('all')
  const [sortBy, setSortBy] = useState<'votes' | 'newest'>('votes')
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [voteModalId, setVoteModalId] = useState<string | null>(null)
  const [requests, setRequests] = useState<FeedbackRequest[]>(MOCK_REQUESTS)

  const boardName = 'Product Roadmap'
  const companyName = 'Acme Inc.'

  const handleVote = (id: string) => {
    setRequests(prev =>
      prev.map(r =>
        r.id === id
          ? { ...r, hasVoted: !r.hasVoted, voteCount: r.hasVoted ? r.voteCount - 1 : r.voteCount + 1 }
          : r
      )
    )
  }

  const handleVoteClick = (id: string) => {
    const req = requests.find(r => r.id === id)
    if (req?.hasVoted) {
      handleVote(id)
    } else {
      setVoteModalId(id)
    }
  }

  const filtered = requests
    .filter(r => activeFilter === 'all' || r.status === activeFilter)
    .sort((a, b) => sortBy === 'votes' ? b.voteCount - a.voteCount : 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {showSubmitModal && <SubmitModal onClose={() => setShowSubmitModal(false)} onSubmit={() => {}} />}
      {voteModalId && (
        <VoteEmailModal
          requestId={voteModalId}
          onClose={() => setVoteModalId(null)}
          onVote={id => { handleVote(id); setVoteModalId(null) }}
        />
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-gray-900">{companyName}</span>
            <span className="text-sm text-gray-400 mx-1.5">·</span>
            <span className="text-sm text-gray-600">{boardName}</span>
          </div>
          <button
            onClick={() => setShowSubmitModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-white bg-[#7c3bed] hover:bg-[#6d28d9] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Post an idea
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Board title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{boardName}</h1>
          <p className="text-sm text-gray-500">Share your ideas and vote on what matters most to you</p>
        </div>

        {/* Quick submit bar */}
        <button
          onClick={() => setShowSubmitModal(true)}
          className="w-full flex items-center gap-3 px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-400 hover:border-[#7c3bed]/30 hover:text-gray-600 transition-colors mb-6 text-left"
        >
          <Plus className="w-4 h-4 text-gray-400" />
          Share your idea or feature request...
        </button>

        <div className="flex gap-6">
          {/* Left sidebar - filters */}
          <aside className="w-44 flex-shrink-0 hidden sm:block">
            <div className="sticky top-24">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">Status</p>
              <div className="space-y-0.5">
                {STATUS_FILTERS.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setActiveFilter(f.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeFilter === f.value
                        ? 'bg-[#7c3bed]/8 text-[#7c3bed] font-medium'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Request list */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500">{filtered.length} ideas</span>
              <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors">
                Sort: Most Votes <ChevronDown className="w-3 h-3" />
              </button>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-2">
              {filtered.map(req => (
                <PublicRequestCard key={req.id} request={req} onVote={handleVoteClick} />
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-16">
                <p className="text-sm text-gray-400">No ideas in this category yet.</p>
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="mt-3 text-sm text-[#7c3bed] hover:underline"
                >
                  Be the first to submit one →
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Powered by footer */}
      <footer className="mt-16 py-6 border-t border-gray-100 text-center">
        <a href="https://feedbackkit.threestack.io" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
          Powered by <span className="font-medium">FeedbackKit</span>
        </a>
      </footer>
    </div>
  )
}
