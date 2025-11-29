import EmergencyList from "../components/EmergencyList";
import { LayoutDashboard, Activity } from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-sky-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-10 hidden h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-sky-100/70 blur-3xl lg:block" />
        <div className="absolute right-12 top-24 h-24 w-24 rounded-full bg-white/70 shadow-2xl shadow-sky-100" />
        <div className="absolute bottom-12 left-16 h-40 w-40 rounded-full bg-indigo-100/50 blur-[90px]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="glass-panel flex flex-wrap items-center justify-between gap-6 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-400 text-white shadow-lg shadow-indigo-100">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                Hospital Command
              </p>
              <h1 className="text-2xl font-semibold text-slate-900">HOPE Response Center</h1>
              <p className="text-sm text-slate-500">
                Live ambulance intake routed to the right specialists in seconds.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Status</p>
              <div className="mt-1 flex items-center gap-2 font-semibold text-emerald-500">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                System Online
              </div>
            </div>
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 px-5 py-3 text-sm text-indigo-600 shadow-inner shadow-white">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-400">Live Feed</p>
              <div className="mt-1 flex items-center gap-2 font-semibold">
                <Activity className="h-4 w-4" />
                24/7 Monitoring
              </div>
            </div>
          </div>
        </header>

        <main className="glass-panel p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                Live Emergency Feed
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                Real-time triage to bedside routing
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Ambulance AI reports flow in here so coordinators can assign the right doctor instantly.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3 text-center text-xs font-medium text-slate-500">
              Updated every <span className="font-semibold text-slate-700">5 seconds</span>
            </div>
          </div>

          <div className="mt-8">
            <EmergencyList />
          </div>
        </main>
      </div>
    </div>
  );
}
