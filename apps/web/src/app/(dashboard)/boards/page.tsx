import { LayoutGrid, Plus } from 'lucide-react'

// Sprint 1.5 — Dashboard shell + empty state
// Sprint 3.4 — Board Management UI (create, edit, delete) — Wren

export default function BoardsPage() {
  return (
    <div className="flex flex-col">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Boards</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your feature request boards
          </p>
        </div>
        <button
          className="
            flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium
            bg-[#7c3bed] hover:bg-[#6d28d9] text-white
            transition-colors duration-150
          "
        >
          <Plus className="w-4 h-4" />
          Create Board
        </button>
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#7c3bed]/10 border border-[#7c3bed]/20 flex items-center justify-center mb-4">
          <LayoutGrid className="w-8 h-8 text-[#7c3bed]" />
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">
          Create your first board
        </h2>
        <p className="text-sm text-gray-400 max-w-sm mb-6">
          Start collecting feature requests and feedback from your users. Each
          board has a unique public URL you can share.
        </p>
        <button
          className="
            flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium
            bg-[#7c3bed] hover:bg-[#6d28d9] text-white
            transition-colors duration-150
          "
        >
          <Plus className="w-4 h-4" />
          Create Board
        </button>
      </div>
    </div>
  )
}
