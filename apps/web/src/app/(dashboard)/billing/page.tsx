'use client'

// Sprint 3.3 — Billing & Plan UI

import { useState, useEffect } from 'react'
import {
  CreditCard,
  CheckCircle2,
  Zap,
  Building2,
  Users,
  Crown,
  LayoutGrid,
  MessageSquare,
  ArrowRight,
  ExternalLink,
  Loader2,
  AlertTriangle,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BillingData {
  plan: 'free' | 'indie' | 'pro' | 'team'
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  currentPeriodEnd?: string | null
  boardsUsed: number
  requestsCount: number
  votesCount: number
}

// ─── Plan Config ──────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '',
    icon: LayoutGrid,
    color: 'text-[#7c8ba1]',
    bg: 'bg-[#1a2535]',
    border: 'border-white/[0.08]',
    limits: { boards: 1, voters: 100 },
    features: [
      '1 feedback board',
      'Unlimited requests',
      '100 voters/mo',
      'Basic changelog',
      'Public roadmap',
    ],
  },
  {
    id: 'indie',
    name: 'Indie',
    price: '$9',
    period: '/mo',
    icon: Zap,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    limits: { boards: Infinity, voters: Infinity },
    features: [
      'Unlimited boards',
      'Unlimited voters',
      'Email notifications',
      'Embeddable widget',
      'Custom domain',
      'Priority support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$19',
    period: '/mo',
    icon: Building2,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    limits: { boards: Infinity, voters: Infinity },
    features: [
      'Everything in Indie',
      'White-label branding',
      'SSO support',
      'Team members (5)',
      'API access',
      'Dedicated support',
    ],
  },
  {
    id: 'team',
    name: 'Team',
    price: '$49',
    period: '/mo',
    icon: Users,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    limits: { boards: Infinity, voters: Infinity },
    features: [
      'Everything in Pro',
      'Unlimited team members',
      'Custom SLA',
      'SAML SSO',
      'Audit logs',
      'Onboarding support',
    ],
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  // Success/cancel feedback from Stripe redirect
  const [flashMsg, setFlashMsg] = useState<{ type: 'success' | 'warning'; text: string } | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('success')) {
      setFlashMsg({ type: 'success', text: 'Subscription activated! Welcome to your new plan.' })
    } else if (params.get('canceled')) {
      setFlashMsg({ type: 'warning', text: 'Checkout canceled — your plan was not changed.' })
    }
    // Clear URL params
    window.history.replaceState({}, '', window.location.pathname)
  }, [])

  useEffect(() => {
    async function loadBilling() {
      try {
        const res = await fetch('/api/billing/status')
        if (res.ok) {
          const data = await res.json()
          setBilling(data)
        }
      } catch {
        // Fallback mock for development
      } finally {
        setLoading(false)
      }
    }
    loadBilling()
  }, [])

  // Fallback mock data when API is not yet available
  const data: BillingData = billing ?? {
    plan: 'free',
    status: 'active',
    boardsUsed: 1,
    requestsCount: 47,
    votesCount: 283,
  }

  const currentPlan = PLANS.find((p) => p.id === data.plan) ?? PLANS[0]!
  const boardLimit = currentPlan?.limits.boards ?? 1
  const isAtBoardLimit = data.boardsUsed >= boardLimit
  const isPaid = data.plan !== 'free'

  async function handleUpgrade(planId: string) {
    setUpgrading(planId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })
      const result = await res.json()
      if (result.url) {
        window.location.href = result.url
      }
    } catch {
      setFlashMsg({ type: 'warning', text: 'Something went wrong. Please try again.' })
    } finally {
      setUpgrading(null)
    }
  }

  async function handlePortal() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/billing/portal')
      const result = await res.json()
      if (result.url) {
        window.open(result.url, '_blank')
      }
    } catch {
      setFlashMsg({ type: 'warning', text: 'Could not open billing portal. Please try again.' })
    } finally {
      setPortalLoading(false)
    }
  }

  const PlanIcon = currentPlan.icon

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">Billing & Plan</h1>
        <p className="text-sm text-[#7c8ba1] mt-0.5">Manage your subscription and usage</p>
      </div>

      {/* Flash Message */}
      {flashMsg && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${
          flashMsg.type === 'success'
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
        }`}>
          {flashMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0" />
          )}
          <span className="text-sm">{flashMsg.text}</span>
        </div>
      )}

      {/* Plan Limit Warning */}
      {isAtBoardLimit && !isPaid && (
        <div className="flex items-center gap-3 p-4 rounded-xl border bg-amber-500/10 border-amber-500/30 text-amber-400">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="text-sm">
            You've reached the board limit for your free plan. Upgrade to create more boards.
          </span>
        </div>
      )}

      {/* Current Plan Card */}
      {loading ? (
        <div className="rounded-xl bg-[#0d1221] border border-white/[0.07] p-6 flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-[#7c8ba1]" />
          <span className="text-sm text-[#7c8ba1]">Loading billing info…</span>
        </div>
      ) : (
        <div className={`rounded-xl border p-6 ${currentPlan.bg} ${currentPlan.border}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${currentPlan.bg} border ${currentPlan.border}`}>
                <PlanIcon className={`w-5 h-5 ${currentPlan.color}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{currentPlan.name} Plan</span>
                  {data.plan !== 'free' && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      data.status === 'active' ? 'bg-green-500/15 text-green-400' :
                      data.status === 'past_due' ? 'bg-red-500/15 text-red-400' :
                      'bg-[#1a2535] text-[#7c8ba1]'
                    }`}>
                      {data.status === 'active' ? 'Active' : data.status === 'past_due' ? 'Past Due' : data.status}
                    </span>
                  )}
                </div>
                <span className="text-sm text-[#7c8ba1]">
                  {currentPlan.price}{currentPlan.period}
                  {data.currentPeriodEnd && (
                    <span> · Renews {new Date(data.currentPeriodEnd).toLocaleDateString()}</span>
                  )}
                </span>
              </div>
            </div>
            {isPaid && (
              <button
                onClick={handlePortal}
                disabled={portalLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a2535] border border-white/[0.08] text-sm text-[#c0cfe0] hover:bg-[#243045] transition-colors disabled:opacity-60"
              >
                {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                Manage Subscription
              </button>
            )}
          </div>

          {/* Usage Stats */}
          <div className="grid grid-cols-3 gap-4 mt-2">
            {[
              {
                label: 'Boards',
                value: data.boardsUsed,
                limit: boardLimit === Infinity ? '∞' : boardLimit,
                icon: LayoutGrid,
                warn: isAtBoardLimit,
              },
              {
                label: 'Requests',
                value: data.requestsCount,
                limit: '∞',
                icon: MessageSquare,
                warn: false,
              },
              {
                label: 'Votes',
                value: data.votesCount,
                limit: data.plan === 'free' ? '100/mo' : '∞',
                icon: Crown,
                warn: false,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg bg-black/20 border border-white/[0.05] p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <stat.icon className={`w-3.5 h-3.5 ${stat.warn ? 'text-amber-400' : 'text-[#7c8ba1]'}`} />
                  <span className="text-xs text-[#7c8ba1]">{stat.label}</span>
                </div>
                <div className={`text-lg font-semibold ${stat.warn ? 'text-amber-400' : 'text-white'}`}>
                  {stat.value}
                  <span className="text-xs text-[#7c8ba1] font-normal ml-1">/ {stat.limit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plan Comparison Table */}
      <div>
        <h2 className="text-sm font-semibold text-[#7c8ba1] uppercase tracking-wider mb-4">Upgrade Plan</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan) => {
            const isCurrentPlan = plan.id === data.plan
            const PIcon = plan.icon
            return (
              <div
                key={plan.id}
                className={`rounded-xl border p-5 flex flex-col gap-4 transition-all ${
                  isCurrentPlan
                    ? `${plan.bg} ${plan.border} ring-2 ring-offset-2 ring-offset-[#060c18] ${plan.border.replace('border-', 'ring-')}`
                    : 'bg-[#0d1221] border-white/[0.07] hover:border-white/[0.15]'
                }`}
              >
                <div>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${plan.bg} border ${plan.border}`}>
                    <PIcon className={`w-4.5 h-4.5 ${plan.color}`} />
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white">{plan.name}</span>
                    {isCurrentPlan && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white font-medium">
                        Current
                      </span>
                    )}
                  </div>
                  <div className={`text-2xl font-bold ${plan.color}`}>
                    {plan.price}
                    <span className="text-sm font-normal text-[#7c8ba1]">{plan.period}</span>
                  </div>
                </div>

                <ul className="flex flex-col gap-2 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-[#c0cfe0]">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-green-400" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {plan.id !== 'free' && !isCurrentPlan ? (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={!!upgrading}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      plan.id === 'indie'
                        ? 'bg-violet-600 text-white hover:bg-violet-500'
                        : plan.id === 'pro'
                        ? 'bg-blue-600 text-white hover:bg-blue-500'
                        : 'bg-amber-600 text-white hover:bg-amber-500'
                    } disabled:opacity-60`}
                  >
                    {upgrading === plan.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Upgrade <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                ) : isCurrentPlan && isPaid ? (
                  <button
                    onClick={handlePortal}
                    disabled={portalLoading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium bg-white/5 text-[#c0cfe0] hover:bg-white/10 transition-colors disabled:opacity-60"
                  >
                    {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Manage <ExternalLink className="w-4 h-4" /></>}
                  </button>
                ) : isCurrentPlan ? (
                  <div className="w-full py-2.5 rounded-lg text-sm font-medium text-center bg-white/5 text-[#7c8ba1]">
                    Current plan
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
