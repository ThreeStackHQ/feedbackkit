// Public board page — no auth required
// TODO: [Sprint 2.5] Public Board UI — Wren
// TODO: [Sprint 2.3] Voting API — Bolt

import { notFound } from "next/navigation";

interface BoardPageProps {
  params: { slug: string };
}

export default function PublicBoardPage({ params }: BoardPageProps) {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Feature Requests
      </h1>
      <p className="text-gray-500 mb-8">
        Vote on features you&apos;d like to see. Add your own requests.
      </p>
      <div className="text-gray-400 italic">
        Loading board: {params.slug}...
      </div>
    </main>
  );
}

export function generateMetadata({ params }: BoardPageProps) {
  return {
    title: `Feature Requests — FeedbackKit`,
    description: `Vote on feature requests and submit ideas.`,
  };
}
