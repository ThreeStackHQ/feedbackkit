// Dashboard layout — auth-protected admin shell
// TODO: [Sprint 1.5] Dashboard Layout — Wren
// TODO: [Sprint 1.4] Auth middleware — Bolt

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar placeholder */}
      <aside className="w-64 border-r border-gray-200 bg-gray-50 p-4">
        <div className="text-sm font-semibold text-gray-900 mb-4">
          🗳️ FeedbackKit
        </div>
        <nav className="space-y-1">
          {["Boards", "Requests", "Settings", "Billing"].map((item) => (
            <div
              key={item}
              className="px-3 py-2 rounded text-sm text-gray-600 hover:bg-gray-100 cursor-pointer"
            >
              {item}
            </div>
          ))}
        </nav>
      </aside>
      {/* Main content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
