'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutGrid,
  MessageSquare,
  BarChart3,
  Settings,
  CreditCard,
  Menu,
  X,
  Bell,
  LogOut,
  ChevronRight,
  Layers,
} from 'lucide-react'

// ─── Nav Config ───────────────────────────────────────────────────────────────

const navItems = [
  { href: '/boards', label: 'Boards', icon: LayoutGrid },
  { href: '/requests', label: 'Requests', icon: MessageSquare },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/billing', label: 'Billing', icon: CreditCard },
]

// ─── Sidebar Content ──────────────────────────────────────────────────────────

function SidebarContent({
  pathname,
  onClose,
}: {
  pathname: string
  onClose?: () => void
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-[#7c3bed] flex items-center justify-center flex-shrink-0">
          <Layers className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-white tracking-tight">
          FeedbackKit
        </span>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto md:hidden text-gray-400 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium
                transition-colors duration-150 group
                ${
                  isActive
                    ? 'bg-[#7c3bed]/20 text-violet-300'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }
              `}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 ${
                  isActive ? 'text-violet-400' : 'text-gray-500 group-hover:text-gray-300'
                }`}
              />
              {label}
              {isActive && (
                <ChevronRight className="ml-auto w-3 h-3 text-violet-400 opacity-60" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User menu */}
      <div className="border-t border-white/10 px-3 py-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-md group">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">U</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-200 truncate">User</p>
            <p className="text-[11px] text-gray-500 truncate">user@example.com</p>
          </div>
          <button
            className="text-gray-500 hover:text-gray-300 transition-colors p-1 rounded"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Dashboard Layout ──────────────────────────────────────────────────────────

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Derive page title from current route
  const currentNav = navItems.find(
    (n) => pathname === n.href || pathname.startsWith(n.href + '/')
  )
  const pageTitle = currentNav?.label ?? 'Dashboard'

  return (
    <div className="flex h-screen bg-[#0a0a14] overflow-hidden">
      {/* ── Desktop Sidebar ──────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-60 flex-shrink-0 bg-[#0f0f1a] border-r border-white/[0.07]">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* ── Mobile Overlay ───────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        </div>
      )}

      {/* ── Mobile Sidebar ───────────────────────────────── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-60 flex flex-col
          bg-[#0f0f1a] border-r border-white/[0.07]
          transform transition-transform duration-200 ease-in-out
          md:hidden
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <SidebarContent
          pathname={pathname}
          onClose={() => setMobileOpen(false)}
        />
      </aside>

      {/* ── Main ─────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="flex items-center h-14 px-4 border-b border-white/[0.07] bg-[#0a0a14] flex-shrink-0">
          {/* Mobile hamburger */}
          <button
            className="md:hidden mr-3 text-gray-400 hover:text-white transition-colors"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Page title */}
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="text-gray-600">FeedbackKit</span>
            <ChevronRight className="w-3 h-3 text-gray-700" />
            <span className="text-gray-200 font-medium">{pageTitle}</span>
          </div>

          {/* Right controls */}
          <div className="ml-auto flex items-center gap-2">
            {/* Notification bell */}
            <button
              className="relative w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-violet-500 rounded-full" />
            </button>

            {/* Theme toggle placeholder */}
            <button
              className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors text-xs font-mono"
              aria-label="Toggle theme"
            >
              🌙
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
