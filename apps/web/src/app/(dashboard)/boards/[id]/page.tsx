'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  ThumbsUp,
  Eye,
  Plus,
  Search,
  SlidersHorizontal,
  ExternalLink,
  ChevronDown,
} from 'lucide-react'

// Sprint 2.4 — Admin Board View: request list with status management — Wren

// ─── Types ─────────────────────────────────────────────────────────────────────

type RequestStatus = 'under_review' | 'planned' | 'in_progress' | 'shipped' | 'wont_do'

interface FeedbackRequest {
  id: string
  title: string
  description: string
  status: RequestStatus
  voteCount: number
  watcherCount: number
  submittedBy: string
  createdAt: string
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<RequestStatus, { label: string; color: string; bg: string; border: string }> = {
  under_review: { label: 'Under Review', color: 'text-gray-400',   bg: 'bg-gray-500/15',   border: 'border-gray-500/25' },
  planned:      { label: 'Planned',      color: 'text-blue-400',   bg: 'bg-blue-500/15',   border: 'border-blue-500/25' },
  in_progress:  { label: 'In Progress',  color: 'text-amber-400',  bg: 'bg-amber-500/15',  border: 'border-amber-500/25' },
  shipped:      { label: 'Shipped',      color: 'text-emerald-400',bg: 'bg-emerald-500/15',border: 'border-emerald-500/25' },
  wont_do:      { label: "Won't Do",     color: 'text-red-400',    bg: 'bg-red-500/15',    border: 'border-red-500/25' },
}

const FILTER_TABS: { label: string; value: RequestStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Under Review', value: 'under_review' },
  { label: 'Planned', value: 'planned' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Shipped', value: 'shipped' },
  { label: "Won't Do", value: 'wont_do' },
]

const SORT_OPTIONS = [
  { label: 'Most Votes', value: 'votes' },
  { label: 'Newest', value: 'newest' },
  { label: 'Oldest', value: 'oldest' },
]

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const MOCK_REQUESTS: FeedbackRequest[] = [
  {
    id: '1',
    title: 'Dark mode support across all pages',
    description: 'Would love to see a system-level dark mode toggle that persists across sessions and respects the OS preference.',
    status: 'planned',
    voteCount: 94,
    watcherCount: 31,
    submittedBy: 'alex@example.com',
    createdAt: '3 days ago',
  },
  {
    id: '2',
    title: 'CSV export for all feedback requests',
    description: 'Need to export feedback data to CSV for sharing with stakeholders who don\'t have access to the dashboard.',
    status: 'in_progress',
    voteCount: 67,
    watcherCount: 18,
    submittedBy: 'sam@example.com',
    createdAt: '1 week ago',
  },
  {
    id: '3',
    title: 'Slack integration for new requests',
    description: 'Get notified in Slack when new feedback is submitted or status changes. Would save checking the dashboard manually.',
    status: 'planned',
    voteCount: 52,
    watcherCount: 24,
    submittedBy: 'maria@example.com',
    createdAt: '2 weeks ago',
  },
  {
    id: '4',
    title: 'Keyboard shortcuts for status changes',
    description: 'Power users would benefit from keyboard shortcuts to quickly change request statuses without using the mouse.',
    status: 'under_review',
    voteCount: 38,
    watcherCount: 12,
    submittedBy: 'dev@example.com',
    createdAt: '3 weeks ago',
  },
  {
    id: '5',
    title: 'Custom categories / labels',
    description: 'Allow us to create custom labels like "bug", "enhancement", "question" for better organization.',
    status: 'under_review',
    voteCount: 29,
    watcherCount: 9,
    submittedBy: 'hello@example.com',
    createdAt: '1 month ago',
  },
  {
    id: '6',
    title: 'Email digest for weekly summary',
    description: 'A weekly email digest summarizing top voted requests, status changes, and new submissions.',
    status: 'shipped',
    voteCount: 21,
    watcherCount: 7,
    submittedBy: 'team@example.com',
    createdAt: '2 months ago',
  },
  {
    id: '7',
    title: 'Mobile app or PWA',
    description: 'A mobile-optimised experience or PWA would make it easier to check feedback on the go.',
    status: 'wont_do',
    voteCount: 14,
    watcherCount: 5,
    submittedBy: 'user@example.com',
    createdAt: '2 months ago',
  },
]

// ─── StatusBadge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: RequestStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color} ${cfg.bg} border ${cfg.border}`}>
      {cfg.label}
    </span>
  )
}

// ─── Status Dropdown ───────────────────────────────────────────────────────────

function StatusDropdown({ current, onChange }: { current: RequestStatus; onChange: (s: RequestStatus) => void }) {
  const [open, setOpen] = useState(false)
  const cfg = STATUS_CONFIG[current]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color} ${cfg.bg} ${cfg.border} hover:brightness-110 transition-all`}
      >
        {cfg.label}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-7 z-20 bg-[#1c2128] border border-white/10 rounded-lg shadow-xl overflow-hidden min-w-[140px]">
            {(Object.keys(STATUS_CONFIG) as RequestStatus[]).map(s => (
              <button
                key={s}
                onClick={() => { onChange(s); setOpen(false) }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-white/5 transition-colors ${s === current ? 'bg-white/5' : ''}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[s].bg} border ${STATUS_CONFIG[s].border}`} />
                <span className={STATUS_CONFIG[s].color}>{STATUS_CONFIG[s].label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Request Card ──────────────────────────────────────────────────────────────

function RequestCard({
  request,
  onStatusChange,
}: {
  request: FeedbackRequest
  onStatusChange: (id: string, status: RequestStatus) => void
}) {
  return (
    <div className="bg-[#161b22] border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors group">
      <div className="flex items-start gap-4">
        {/* Vote count */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <button className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-[#7c3bed] transition-colors group/vote">
            <ThumbsUp className="w-4 h-4 group-hover/vote:scale-110 transition-transform" />
            <span className="text-xs font-semibold">{request.voteCount}</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <h3 className="text-sm font-medium text-white leading-snug">{request.title}</h3>
            <StatusDropdown
              current={request.status}
              onChange={s => onStatusChange(request.id, s)}
            />
          </div>
          <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">{request.description}</p>

          {/* Meta */}
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {request.watcherCount} watching
            </span>
            <span>·</span>
            <span>by {request.submittedBy}</span>
            <span>·</span>
            <span>{request.createdAt}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Post Idea Modal ───────────────────────────────────────────────────────────

function PostIdeaModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-[#161b22] border border-white/10 rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
        <h2 className="text-base font-semibold text-white mb-4">Post an idea</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Title <span className="text-red-400">*</span></label>
            <input
              type="text"
              placeholder="Short, clear summary of your idea"
              className="w-full px-3 py-2 rounded-lg bg-[#0d1117] border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#7c3bed]/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Details <span className="text-gray-600 font-normal">(optional)</span></label>
            <textarea
              rows={4}
              placeholder="Describe your idea in more detail..."
              className="w-full px-3 py-2 rounded-lg bg-[#0d1117] border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#7c3bed]/50 resize-none"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 bg-white/5 hover:bg-white/10">Cancel</button>
          <button className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-white bg-[#7c3bed] hover:bg-[#6d28d9]">Post Idea</button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function BoardDetailPage({ params }: { params: { id: string } }) {
  const [activeFilter, setActiveFilter] = useState<RequestStatus | 'all'>('all')
  const [sortBy, setSortBy] = useState('votes')
  const [search, setSearch] = useState('')
  const [showPostModal, setShowPostModal] = useState(false)
  const [requests, setRequests] = useState<FeedbackRequest[]>(MOCK_REQUESTS)

  const boardName = 'Product Roadmap'
  const boardSlug = 'product-roadmap'

  const handleStatusChange = (id: string, status: RequestStatus) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  }

  const filtered = requests
    .filter(r => activeFilter === 'all' || r.status === activeFilter)
    .filter(r => !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'votes') return b.voteCount - a.voteCount
      return 0
    })

  const counts = FILTER_TABS.reduce((acc, tab) => {
    acc[tab.value] = tab.value === 'all' ? requests.length : requests.filter(r => r.status === tab.value).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="flex flex-col">
      {showPostModal && <PostIdeaModal onClose={() => setShowPostModal(false)} />}

      {/* Breadcrumb + header */}
      <div className="flex items-center gap-2 mb-1">
        <Link href="/boards" className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" />
          Boards
        </Link>
      </div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-white">{boardName}</h1>
            <a
              href={`/b/${boardSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-400 transition-colors"
              title="Open public board"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{requests.length} requests · Public board</p>
        </div>
        <button
          onClick={() => setShowPostModal(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-[#7c3bed] hover:bg-[#6d28d9] text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          Post Idea
        </button>
      </div>

      {/* Filter + search bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Filter tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 flex-1">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveFilter(tab.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeFilter === tab.value
                  ? 'bg-[#7c3bed]/20 text-[#9f5ded] border border-[#7c3bed]/30'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              {tab.label}
              {(counts[tab.value] ?? 0) > 0 && (
                <span className={`text-[10px] px-1 rounded ${activeFilter === tab.value ? 'bg-[#7c3bed]/30 text-[#9f5ded]' : 'bg-white/5 text-gray-600'}`}>
                  {counts[tab.value] ?? 0}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search + sort */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
            <input
              type="text"
              placeholder="Search requests..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-[#161b22] border border-white/10 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7c3bed]/40 w-48"
            />
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500 border border-white/10 rounded-lg px-2.5 py-1.5 bg-[#161b22]">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-transparent text-gray-400 focus:outline-none cursor-pointer text-xs"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value} className="bg-[#161b22]">{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Request list */}
      {filtered.length > 0 ? (
        <div className="flex flex-col gap-2">
          {filtered.map(req => (
            <RequestCard key={req.id} request={req} onStatusChange={handleStatusChange} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-3">
            <Search className="w-5 h-5 text-gray-600" />
          </div>
          <p className="text-sm text-gray-500">No requests found{search ? ` for "${search}"` : ''}</p>
        </div>
      )}
    </div>
  )
}
