'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LayoutGrid, Plus, MessageSquare, ThumbsUp, Users, ExternalLink, MoreHorizontal } from 'lucide-react'

// Sprint 1.5 — Dashboard shell + empty state
// Sprint 2.4 — Admin Dashboard UI: board cards with stats — Wren

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const MOCK_BOARDS = [
  {
    id: 'board-1',
    name: 'Product Roadmap',
    slug: 'product-roadmap',
    description: 'Feature requests and ideas for our core product',
    isPublic: true,
    requestCount: 47,
    voteCount: 312,
    subscriberCount: 89,
    plannedCount: 8,
    inProgressCount: 3,
    updatedAt: '2 hours ago',
  },
  {
    id: 'board-2',
    name: 'Bug Reports',
    slug: 'bug-reports',
    description: 'Report issues and track fixes',
    isPublic: false,
    requestCount: 23,
    voteCount: 104,
    subscriberCount: 34,
    plannedCount: 5,
    inProgressCount: 7,
    updatedAt: '1 day ago',
  },
  {
    id: 'board-3',
    name: 'Integrations',
    slug: 'integrations',
    description: 'Request integrations with third-party tools',
    isPublic: true,
    requestCount: 18,
    voteCount: 89,
    subscriberCount: 21,
    plannedCount: 2,
    inProgressCount: 1,
    updatedAt: '3 days ago',
  },
]

// ─── Board Card ────────────────────────────────────────────────────────────────

function BoardCard({ board }: { board: typeof MOCK_BOARDS[0] }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="relative group bg-[#161b22] border border-white/10 rounded-xl p-5 hover:border-[#7c3bed]/40 transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-[#7c3bed]/15 border border-[#7c3bed]/25 flex items-center justify-center flex-shrink-0 mt-0.5">
            <LayoutGrid className="w-4 h-4 text-[#7c3bed]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-white truncate">{board.name}</h3>
              {board.isPublic ? (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  Public
                </span>
              ) : (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-500/15 text-gray-400 border border-gray-500/20">
                  Private
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{board.description}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <a
            href={`/b/${board.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-md hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-colors"
            title="Open public board"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-md hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-colors"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-7 z-10 w-36 bg-[#1c2128] border border-white/10 rounded-lg shadow-xl overflow-hidden">
                <button className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-white/5 transition-colors">Edit Board</button>
                <button className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors">Delete Board</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{board.requestCount} requests</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <ThumbsUp className="w-3.5 h-3.5" />
          <span>{board.voteCount} votes</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Users className="w-3.5 h-3.5" />
          <span>{board.subscriberCount}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-1 mb-3">
        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#7c3bed] rounded-full"
            style={{ width: `${Math.round((board.inProgressCount / board.requestCount) * 100)}%` }}
          />
        </div>
        <span className="text-[10px] text-gray-500 flex-shrink-0 ml-1">{board.inProgressCount} in progress</span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-600">Updated {board.updatedAt}</span>
        <Link
          href={`/boards/${board.id}`}
          className="text-xs font-medium text-[#7c3bed] hover:text-[#9f5ded] transition-colors"
        >
          Manage →
        </Link>
      </div>
    </div>
  )
}

// ─── Create Board Modal ────────────────────────────────────────────────────────

function CreateBoardModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-[#161b22] border border-white/10 rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
        <h2 className="text-base font-semibold text-white mb-1">Create a Board</h2>
        <p className="text-xs text-gray-500 mb-5">Each board has a unique public URL your users can submit feedback on.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Board Name</label>
            <input
              type="text"
              placeholder="e.g. Product Roadmap"
              className="w-full px-3 py-2 rounded-lg bg-[#0d1117] border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#7c3bed]/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Description <span className="text-gray-600 font-normal">(optional)</span></label>
            <textarea
              rows={2}
              placeholder="Describe what kind of feedback you're collecting"
              className="w-full px-3 py-2 rounded-lg bg-[#0d1117] border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#7c3bed]/50 transition-colors resize-none"
            />
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <input type="checkbox" id="isPublic" defaultChecked className="w-4 h-4 rounded accent-[#7c3bed]" />
            </div>
            <label htmlFor="isPublic" className="text-xs text-gray-400 cursor-pointer">
              <span className="text-white font-medium">Make this board public</span>
              <br />Anyone with the link can submit and vote on requests
            </label>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 bg-white/5 hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-white bg-[#7c3bed] hover:bg-[#6d28d9] transition-colors">
            Create Board
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function BoardsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)

  return (
    <div className="flex flex-col">
      {showCreateModal && <CreateBoardModal onClose={() => setShowCreateModal(false)} />}

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Boards</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {MOCK_BOARDS.length} board{MOCK_BOARDS.length !== 1 ? 's' : ''} · Collect and organize feature requests
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-[#7c3bed] hover:bg-[#6d28d9] text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Board
        </button>
      </div>

      {/* Board grid */}
      {MOCK_BOARDS.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {MOCK_BOARDS.map(board => (
            <BoardCard key={board.id} board={board} />
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#7c3bed]/10 border border-[#7c3bed]/20 flex items-center justify-center mb-4">
            <LayoutGrid className="w-8 h-8 text-[#7c3bed]" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Create your first board</h2>
          <p className="text-sm text-gray-400 max-w-sm mb-6">
            Start collecting feature requests and feedback from your users. Each board has a unique public URL you can share.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-[#7c3bed] hover:bg-[#6d28d9] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Board
          </button>
        </div>
      )}
    </div>
  )
}
