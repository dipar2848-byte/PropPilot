export default function DashboardLoading() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading">
      <div>
        <div className="skeleton h-7 w-48 rounded-lg" />
        <div className="skeleton mt-2 h-4 w-64 rounded" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card p-5">
            <div className="skeleton h-4 w-24 rounded" />
            <div className="skeleton mt-4 h-8 w-16 rounded" />
          </div>
        ))}
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card overflow-hidden">
            <div className="skeleton aspect-[4/3] w-full" />
            <div className="space-y-2 p-4">
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-3 w-1/2 rounded" />
              <div className="skeleton h-5 w-1/3 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
