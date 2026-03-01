import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FeedbackKit — Feature Voting for Indie SaaS',
  description: 'User feedback boards, roadmaps, and changelog in one. Ship what your users actually want. Start free.',
  keywords: ['feature voting', 'feedback board', 'product roadmap', 'changelog', 'user feedback', 'indie saas'],
  openGraph: {
    title: 'FeedbackKit — Feature Voting for Indie SaaS',
    description: 'User feedback boards, roadmaps, and changelog — all in one.',
    url: 'https://feedbackkit.threestack.io',
    siteName: 'FeedbackKit',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FeedbackKit — Feature Voting for Indie SaaS',
    description: 'Canny alternative at $9/mo. Know what your users want.',
  },
}

const FEATURES = [
  { icon: '🗳️', title: 'Public Voting Boards', desc: 'Let users upvote feature requests. The most-wanted features float to the top automatically.' },
  { icon: '🗺️', title: 'Roadmap View', desc: 'Share your public roadmap — Now/Next/Later columns show users where things are headed.' },
  { icon: '📣', title: 'Changelog Posts', desc: 'Announce new releases. Users who voted get notified automatically when you ship their request.' },
  { icon: '✅', title: 'Status Updates', desc: 'Move cards through Under Review → Planned → In Progress → Shipped. Keep everyone in the loop.' },
  { icon: '📧', title: 'Email Notifications', desc: 'Voters get email updates when the status of their request changes. No manual follow-up needed.' },
  { icon: '</>', title: 'Embeddable Widget', desc: 'Add a feedback button to your app with a 2-line script tag. No redirects, no extra tabs.' },
]

const STEPS = [
  { n: '01', title: 'Create a board', desc: 'Set up a public feedback board in under 2 minutes. No design skills needed — it looks great out of the box.' },
  { n: '02', title: 'Share with users', desc: 'Add a link to your app or embed the widget. Users can submit and upvote requests without creating an account.' },
  { n: '03', title: 'Build what they want', desc: 'Sort by votes, filter by status, and focus on the features your users are most passionate about.' },
]

const COMPARISON = [
  { name: 'FeedbackKit', price: '$9/mo', boards: 'Unlimited', changelog: true, embed: true, roadmap: true, highlight: true },
  { name: 'Canny', price: '$400/mo', boards: 'Limited', changelog: true, embed: true, roadmap: true, highlight: false },
  { name: 'Beamer', price: '$49/mo', boards: '1', changelog: true, embed: true, roadmap: false, highlight: false },
  { name: 'UserVoice', price: '$699/mo', boards: 'Limited', changelog: false, embed: true, roadmap: true, highlight: false },
]

const PLANS = [
  { name: 'Free', price: '$0', period: '', desc: 'For solo makers', features: ['1 feedback board', 'Unlimited requests', '100 voters/mo', 'Basic changelog', 'Public roadmap'], cta: 'Start Free', highlight: false },
  { name: 'Pro', price: '$9', period: '/mo', desc: 'For growing products', features: ['Unlimited boards', 'Unlimited voters', 'Email notifications', 'Embeddable widget', 'Custom domain', 'Priority support'], cta: 'Start 14-Day Trial', highlight: true },
  { name: 'Business', price: '$19', period: '/mo', desc: 'For teams', features: ['Everything in Pro', 'White-label branding', 'SSO support', 'Team members', 'API access', 'Dedicated support'], cta: 'Start 14-Day Trial', highlight: false },
]

const TESTIMONIALS = [
  { quote: "Replaced Canny and saved $4,600/year. My users love it and I can afford the rest of my indie stack.", author: 'Marco V.', role: 'Founder, DevPulse', avatar: 'MV' },
  { quote: "Set it up in 10 minutes. My users immediately started voting and I finally know what to build next.", author: 'Sarah K.', role: 'Indie Hacker, FormForge', avatar: 'SK' },
  { quote: "The embeddable widget is a game changer. Feedback collection is now frictionless for my users.", author: 'James L.', role: 'Solo Dev, ShipFast', avatar: 'JL' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0f0f1a]/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">F</span>
            </div>
            <span className="font-bold text-white">FeedbackKit</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors hidden md:block">Sign in</Link>
            <Link href="/signup" className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors">
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs text-violet-400 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              Canny alternative — 44× cheaper
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight mb-6 leading-tight">
              Know What Your Users{' '}
              <span className="text-violet-400">Actually Want</span>
            </h1>
            <p className="text-xl text-gray-400 mb-10 leading-relaxed">
              Feature voting boards, public roadmaps, and changelog — all in one.
              Ship what matters. <span className="text-gray-200">Start free, upgrade when you need it.</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup" className="rounded-xl bg-violet-600 px-8 py-4 text-base font-semibold text-white hover:bg-violet-500 transition-colors shadow-lg shadow-violet-500/25 text-center">
                Get Started Free
              </Link>
              <Link href="/demo" className="rounded-xl border border-white/20 px-8 py-4 text-base font-semibold text-gray-300 hover:bg-white/5 transition-colors text-center">
                See Live Demo →
              </Link>
            </div>
            <p className="text-xs text-gray-500 mt-4">No credit card required · Free forever for 1 board</p>
          </div>

          {/* Mockup */}
          <div className="rounded-2xl border border-white/10 bg-[#1a1a2e] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Product Roadmap Board</h3>
              <span className="text-xs bg-violet-500/20 text-violet-400 rounded-full px-2 py-0.5">47 requests</span>
            </div>
            <div className="space-y-3">
              {[
                { title: 'Dark mode support', votes: 89, status: 'Planned', statusColor: 'text-blue-400 bg-blue-500/20' },
                { title: 'CSV export for reports', votes: 56, status: 'In Progress', statusColor: 'text-amber-400 bg-amber-500/20' },
                { title: 'Zapier integration', votes: 44, status: 'Under Review', statusColor: 'text-gray-400 bg-gray-500/20' },
                { title: 'Mobile app', votes: 38, status: 'Under Review', statusColor: 'text-gray-400 bg-gray-500/20' },
              ].map((item) => (
                <div key={item.title} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                  <button className="flex flex-col items-center gap-0.5 min-w-[40px] rounded-lg border border-violet-500/30 bg-violet-500/10 px-2 py-1.5 hover:bg-violet-500/20 transition-colors">
                    <span className="text-xs">▲</span>
                    <span className="text-xs font-bold text-violet-400">{item.votes}</span>
                  </button>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.title}</p>
                  </div>
                  <span className={`text-xs rounded-full px-2 py-0.5 ${item.statusColor}`}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Everything your product team needs</h2>
          <p className="text-gray-400">Built for indie hackers and small teams who want to build the right things.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-violet-500/30 transition-colors group">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-semibold text-white mb-2 group-hover:text-violet-400 transition-colors">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Up and running in minutes</h2>
          <p className="text-gray-400">No complex setup, no engineering required.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step) => (
            <div key={step.n} className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 font-bold text-sm mx-auto mb-4">
                {step.n}
              </div>
              <h3 className="font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why indie hackers choose FeedbackKit</h2>
          <p className="text-gray-400">All the features you need, without the enterprise price tag.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border border-white/10 rounded-2xl overflow-hidden text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left px-6 py-4 text-gray-400 font-medium">Product</th>
                <th className="px-6 py-4 text-gray-400 font-medium text-center">Price</th>
                <th className="px-6 py-4 text-gray-400 font-medium text-center">Boards</th>
                <th className="px-6 py-4 text-gray-400 font-medium text-center">Changelog</th>
                <th className="px-6 py-4 text-gray-400 font-medium text-center">Widget</th>
                <th className="px-6 py-4 text-gray-400 font-medium text-center">Roadmap</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((c) => (
                <tr key={c.name} className={`border-b border-white/10 last:border-0 ${c.highlight ? 'bg-violet-500/5' : ''}`}>
                  <td className="px-6 py-4">
                    <span className={`font-semibold ${c.highlight ? 'text-violet-400' : 'text-gray-400'}`}>{c.name}</span>
                    {c.highlight && <span className="ml-2 text-xs bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full">Best Value</span>}
                  </td>
                  <td className="px-6 py-4 text-center text-gray-300">{c.price}</td>
                  <td className="px-6 py-4 text-center text-gray-300">{c.boards}</td>
                  <td className="px-6 py-4 text-center">{c.changelog ? '✅' : '❌'}</td>
                  <td className="px-6 py-4 text-center">{c.embed ? '✅' : '❌'}</td>
                  <td className="px-6 py-4 text-center">{c.roadmap ? '✅' : '❌'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Loved by indie hackers</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.author} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex mb-3">
                {[...Array(5)].map((_, i) => <span key={i} className="text-yellow-400">★</span>)}
              </div>
              <p className="text-sm text-gray-300 leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-violet-600/30 flex items-center justify-center text-xs font-semibold text-violet-400">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-xs font-semibold">{t.author}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Simple pricing. No surprises.</h2>
          <p className="text-gray-400">Start free, upgrade when you need more.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div key={plan.name} className={`rounded-2xl border p-8 flex flex-col ${plan.highlight ? 'border-violet-500 bg-violet-500/10 shadow-xl shadow-violet-500/10' : 'border-white/10 bg-white/5'}`}>
              {plan.highlight && <div className="text-xs font-semibold text-violet-400 bg-violet-500/20 rounded-full px-3 py-1 self-start mb-4">Most Popular</div>}
              <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
              <p className="text-xs text-gray-500 mb-4">{plan.desc}</p>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-4xl font-extrabold">{plan.price}</span>
                <span className="text-gray-400 mb-1">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-violet-400 mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className={`text-center rounded-xl py-3 text-sm font-semibold transition-colors ${plan.highlight ? 'bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-500/25' : 'border border-white/20 text-gray-300 hover:bg-white/5'}`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <div className="rounded-3xl border border-violet-500/20 bg-violet-500/5 p-12 text-center">
          <h2 className="text-4xl font-bold mb-4">Start collecting feedback today</h2>
          <p className="text-gray-400 mb-8 text-lg">Free forever for 1 board. No credit card required.</p>
          <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-10 py-4 text-base font-semibold text-white hover:bg-violet-500 transition-colors shadow-lg shadow-violet-500/25">
            Create Your Free Board →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 mt-4">
        <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">F</span>
            </div>
            <span className="font-semibold">FeedbackKit</span>
            <span className="text-gray-500 text-sm ml-2">by ThreeStack</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
            <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
