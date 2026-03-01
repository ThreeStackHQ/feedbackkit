'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  LayoutGrid,
  Plus,
  MessageSquare,
  ThumbsUp,
  Users,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Trash2,
  Globe,
  Lock,
  X,
  Copy,
  Check,
  Settings,
  Archive,
} from 'lucide-react'

// Sprint 1.5 — Dashboard shell + empty state
// Sprint 2.4 — Admin Dashboard UI: board cards with stats
// Sprint 3.4 — Board Management UI: create/edit/delete/settings — Wren

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Board {
  id: string
  name: string
  slug: string
  description: string
  isPublic: boolean
  isArchived: boolean
  requestCount: number
  voteCount: number
  subscriberCount: number
  plannedCount: number
  inProgressCount: number
  color: string
  updatedAt: string
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const INITIAL_BOARDS: Board[] = [
  {
    id: 'board-1', name: 'Product Roadmap', slug: 'product-roadmap',
    description: 'Feature requests and ideas for our core product',
    isPublic: true, isArchived: false,
    requestCount: 47, voteCount: 312, subscriberCount: 89, plannedCount: 8, inProgressCount: 3,
    color: '#7c3bed', updatedAt: '2 hours ago',
  },
  {
    id: 'board-2', name: 'Bug Reports', slug: 'bug-reports',
    description: 'Report issues and track fixes',
    isPublic: false, isArchived: false,
    requestCount: 23, voteCount: 104, subscriberCount: 34, plannedCount: 5, inProgressCount: 7,
    color: '#ef4444', updatedAt: '1 day ago',
  },
  {
    id: 'board-3', name: 'Integrations', slug: 'integrations',
    description: 'Request integrations with third-party tools',
    isPublic: true, isArchived: false,
    requestCount: 18, voteCount: 89, subscriberCount: 21, plannedCount: 2, inProgressCount: 1,
    color: '#10b981', updatedAt: '3 days ago',
  },
]

const COLORS = ['#7c3bed', '#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#06b6d4', '#8b5cf6', '#f97316']

// ─── Create / Edit Modal ───────────────────────────────────────────────────────

function BoardModal({
  board,
  onClose,
  onSave,
}: {
  board?: Board
  onClose: () => void
  onSave: (data: Partial<Board>) => void
}) {
  const isEdit = !!board
  const [name, setName] = useState(board?.name ?? '')
  const [slug, setSlug] = useState(board?.slug ?? '')
  const [description, setDescription] = useState(board?.description ?? '')
  const [isPublic, setIsPublic] = useState(board?.isPublic ?? true)
  const [color, setColor] = useState(board?.color ?? '#7c3bed')
  const [slugEdited, setSlugEdited] = useState(isEdit)

  function handleNameChange(v: string) {
    setName(v)
    if (!slugEdited) {
      setSlug(v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''))
    }
  }

  function handleSubmit() {
    if (!name.trim()) return
    onSave({ name: name.trim(), slug: slug.trim() || name.toLowerCase().replace(/\s+/g, '-'), description, isPublic, color })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-[#161b22] border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/10">
          <h2 className="font-semibold text-white">{isEdit ? 'Edit Board' : 'Create New Board'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Board Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Product Roadmap"
              className="w-full px-3 py-2 rounded-lg bg-[#0d1117] border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#7c3bed]/50 transition-colors"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              URL Slug
              <span className="ml-1 text-gray-600 font-normal">(yourapp.com/b/{'{slug}'})</span>
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => { setSlug(e.target.value); setSlugEdited(true) }}
              placeholder="product-roadmap"
              className="w-full px-3 py-2 rounded-lg bg-[#0d1117] border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#7c3bed]/50 transition-colors font-mono"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Description <span className="text-gray-600 font-normal">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what kind of feedback you're collecting"
              className="w-full px-3 py-2 rounded-lg bg-[#0d1117] border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#7c3bed]/50 transition-colors resize-none"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-2">Board Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-offset-[#161b22] ring-white scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Public toggle */}
          <div className="flex items-start gap-3 pt-1">
            <button
              onClick={() => setIsPublic((v) => !v)}
              className={`mt-0.5 w-9 h-5 rounded-full transition-colors flex-shrink-0 relative ${isPublic ? 'bg-[#7c3bed]' : 'bg-white/10'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${isPublic ? 'left-4' : 'left-0.5'}`} />
            </button>
            <label className="text-xs text-gray-400 cursor-pointer" onClick={() => setIsPublic((v) => !v)}>
              <span className="text-white font-medium">Make this board public</span>
              <br />Anyone with the link can submit and vote on requests
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 pb-6">
          <button onClick={onClose} className="flex-1 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 bg-white/5 hover:bg-white/10 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="flex-1 px-3 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: color }}
          >
            {isEdit ? 'Save Changes' : 'Create Board'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Delete Confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({ board, onClose, onConfirm }: { board: Board; onClose: () => void; onConfirm: () => void }) {
  const [typed, setTyped] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-[#161b22] border border-red-500/20 shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Delete Board</h2>
            <p className="text-xs text-gray-400">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          This will permanently delete <span className="text-white font-medium">{board.name}</span> and all{' '}
          <span className="text-white font-medium">{board.requestCount} requests</span> inside it.
        </p>
        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1.5">Type <span className="text-white font-mono">{board.slug}</span> to confirm</label>
          <input
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#0d1117] border border-white/10 text-sm text-white font-mono focus:outline-none focus:border-red-500/50 transition-colors"
            placeholder={board.slug}
          />
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 bg-white/5 hover:bg-white/10 transition-colors">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={typed !== board.slug}
            className="flex-1 px-3 py-2.5 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Delete Board
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Board Card ────────────────────────────────────────────────────────────────

function BoardCard({
  board,
  onEdit,
  onDelete,
  onTogglePublic,
  onToggleArchive,
}: {
  board: Board
  onEdit: (b: Board) => void
  onDelete: (b: Board) => void
  onTogglePublic: (id: string) => void
  onToggleArchive: (id: string) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const publicUrl = `https://yourapp.feedbackkit.io/b/${board.slug}`

  function copyLink() {
    navigator.clipboard.writeText(publicUrl).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`relative bg-[#161b22] border rounded-xl p-5 transition-all duration-200 group ${board.isArchived ? 'border-white/5 opacity-60' : 'border-white/10 hover:border-white/20'}`}>
      {/* Top bar */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: board.color }}>
            {board.name[0]}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-white text-sm truncate">{board.name}</h3>
            <p className="text-xs text-gray-500 font-mono truncate">/b/{board.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 ${board.isPublic ? 'bg-green-500/15 text-green-400' : 'bg-white/10 text-gray-400'}`}>
            {board.isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            {board.isPublic ? 'Public' : 'Private'}
          </span>
          {board.isArchived && <span className="inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 bg-yellow-500/15 text-yellow-400">Archived</span>}
          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-xl border border-white/10 bg-[#0d1117] shadow-xl overflow-hidden">
                  <button onClick={() => { onEdit(board); setMenuOpen(false) }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                    Edit board
                  </button>
                  <button onClick={() => { copyLink(); setMenuOpen(false) }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                    <Copy className="w-3.5 h-3.5" />
                    Copy link
                  </button>
                  <button onClick={() => { onTogglePublic(board.id); setMenuOpen(false) }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                    {board.isPublic ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                    Make {board.isPublic ? 'private' : 'public'}
                  </button>
                  <button onClick={() => { onToggleArchive(board.id); setMenuOpen(false) }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                    <Archive className="w-3.5 h-3.5" />
                    {board.isArchived ? 'Unarchive' : 'Archive'}
                  </button>
                  <div className="border-t border-white/10" />
                  <button onClick={() => { onDelete(board); setMenuOpen(false) }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete board
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {board.description && (
        <p className="text-xs text-gray-400 leading-relaxed mb-4 line-clamp-2">{board.description}</p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { icon: MessageSquare, label: 'Requests', value: board.requestCount },
          { icon: ThumbsUp, label: 'Votes', value: board.voteCount },
          { icon: Users, label: 'Subscribers', value: board.subscriberCount },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg bg-white/5 p-2.5 text-center">
            <p className="text-sm font-bold text-white">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Progress pills */}
      <div className="flex gap-2 mb-4">
        <span className="text-xs bg-blue-500/15 text-blue-400 rounded-full px-2 py-0.5">{board.plannedCount} planned</span>
        <span className="text-xs bg-amber-500/15 text-amber-400 rounded-full px-2 py-0.5">{board.inProgressCount} in progress</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link
          href={`/dashboard/boards/${board.id}`}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-gray-300 bg-white/5 hover:bg-white/10 transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
          Manage
        </Link>
        {board.isPublic && (
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-300 bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View
          </a>
        )}
        <button
          onClick={copyLink}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors bg-white/5 hover:bg-white/10 text-gray-300"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Updated */}
      <p className="text-xs text-gray-600 mt-3">Updated {board.updatedAt}</p>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>(INITIAL_BOARDS)
  const [showCreate, setShowCreate] = useState(false)
  const [editingBoard, setEditingBoard] = useState<Board | null>(null)
  const [deletingBoard, setDeletingBoard] = useState<Board | null>(null)
  const [filter, setFilter] = useState<'all' | 'public' | 'private' | 'archived'>('all')

  function handleCreate(data: Partial<Board>) {
    const newBoard: Board = {
      id: `board-${Date.now()}`,
      name: data.name ?? 'New Board',
      slug: data.slug ?? 'new-board',
      description: data.description ?? '',
      isPublic: data.isPublic ?? true,
      isArchived: false,
      color: data.color ?? '#7c3bed',
      requestCount: 0,
      voteCount: 0,
      subscriberCount: 0,
      plannedCount: 0,
      inProgressCount: 0,
      updatedAt: 'just now',
    }
    setBoards((bs) => [newBoard, ...bs])
  }

  function handleEdit(data: Partial<Board>) {
    if (!editingBoard) return
    setBoards((bs) => bs.map((b) => b.id === editingBoard.id ? { ...b, ...data, updatedAt: 'just now' } : b))
  }

  function handleDelete() {
    if (!deletingBoard) return
    setBoards((bs) => bs.filter((b) => b.id !== deletingBoard.id))
    setDeletingBoard(null)
  }

  function togglePublic(id: string) {
    setBoards((bs) => bs.map((b) => b.id === id ? { ...b, isPublic: !b.isPublic } : b))
  }

  function toggleArchive(id: string) {
    setBoards((bs) => bs.map((b) => b.id === id ? { ...b, isArchived: !b.isArchived } : b))
  }

  const filtered = boards.filter((b) => {
    if (filter === 'public') return b.isPublic && !b.isArchived
    if (filter === 'private') return !b.isPublic && !b.isArchived
    if (filter === 'archived') return b.isArchived
    return !b.isArchived
  })

  return (
    <div className="flex flex-col p-6">
      {showCreate && <BoardModal onClose={() => setShowCreate(false)} onSave={handleCreate} />}
      {editingBoard && <BoardModal board={editingBoard} onClose={() => setEditingBoard(null)} onSave={handleEdit} />}
      {deletingBoard && <DeleteConfirm board={deletingBoard} onClose={() => setDeletingBoard(null)} onConfirm={handleDelete} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Boards</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {boards.length} board{boards.length !== 1 ? 's' : ''} · Collect and organize feature requests
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-[#7c3bed] hover:bg-[#6d28d9] text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Board
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 bg-white/5 rounded-lg p-1 w-fit">
        {(['all', 'public', 'private', 'archived'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${filter === f ? 'bg-[#7c3bed] text-white' : 'text-gray-400 hover:text-white'}`}
          >
            {f} {f === 'all' ? `(${boards.filter(b => !b.isArchived).length})` : f === 'archived' ? `(${boards.filter(b => b.isArchived).length})` : f === 'public' ? `(${boards.filter(b => b.isPublic && !b.isArchived).length})` : `(${boards.filter(b => !b.isPublic && !b.isArchived).length})`}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              onEdit={setEditingBoard}
              onDelete={setDeletingBoard}
              onTogglePublic={togglePublic}
              onToggleArchive={toggleArchive}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#7c3bed]/10 border border-[#7c3bed]/20 flex items-center justify-center mb-4">
            <LayoutGrid className="w-8 h-8 text-[#7c3bed]" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">
            {filter === 'archived' ? 'No archived boards' : 'Create your first board'}
          </h2>
          <p className="text-sm text-gray-400 max-w-sm mb-6">
            {filter === 'archived'
              ? 'Archived boards will appear here.'
              : 'Start collecting feature requests from your users. Each board has a unique public URL you can share.'}
          </p>
          {filter === 'all' && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-[#7c3bed] hover:bg-[#6d28d9] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Board
            </button>
          )}
        </div>
      )}
    </div>
  )
}
