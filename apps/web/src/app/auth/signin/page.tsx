// Sign-in page placeholder
// TODO: [Sprint 1.4] Authentication Setup — Bolt
export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          Sign in to FeedbackKit
        </h1>
        <p className="text-gray-500 text-sm text-center mb-8">
          Continue with GitHub or Google
        </p>
        <div className="space-y-3">
          <button className="w-full flex items-center justify-center gap-3 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Continue with GitHub
          </button>
          <button className="w-full flex items-center justify-center gap-3 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Continue with Google
          </button>
        </div>
      </div>
    </main>
  );
}
