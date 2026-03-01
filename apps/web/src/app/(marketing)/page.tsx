// Marketing landing page placeholder
// TODO: [Sprint 4.1] Landing Page — Wren
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-4">
          🗳️ FeedbackKit
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Feature request boards + roadmap voting for indie SaaS — at 1/40th
          the cost of Canny.
        </p>
        <a
          href="/auth/signin"
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-8 py-3 text-white font-semibold hover:bg-blue-700 transition-colors"
        >
          Get Started Free →
        </a>
        <p className="mt-4 text-sm text-gray-500">No credit card required</p>
      </div>
    </main>
  );
}
