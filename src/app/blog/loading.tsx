import NavBar from '@/components/NavBar';

export default function BlogLoading() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <NavBar />

      <section className="pt-32 pb-16 px-6 text-center max-w-4xl mx-auto">
        <div className="h-7 w-40 bg-slate-100 rounded-full mx-auto mb-8 animate-pulse" />
        <div className="h-12 md:h-14 w-72 md:w-96 bg-slate-100 rounded-xl mx-auto mb-6 animate-pulse" />
        <div className="h-5 w-full max-w-2xl bg-slate-100 rounded-lg mx-auto animate-pulse" />
      </section>

      <main className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col">
              <div className="h-48 bg-slate-100 animate-pulse" />
              <div className="p-6 flex flex-col gap-3">
                <div className="h-5 w-24 bg-slate-100 rounded-full animate-pulse" />
                <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-slate-100 rounded animate-pulse" />
                <div className="h-4 w-full bg-slate-100 rounded animate-pulse mt-1" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
