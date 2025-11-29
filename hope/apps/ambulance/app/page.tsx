import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-4 py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-y-0 left-1/2 w-[32rem] -translate-x-1/2 rounded-full bg-indigo-100/60 blur-3xl" />
        <div className="absolute right-12 top-16 h-32 w-32 rounded-full bg-white/70 shadow-2xl shadow-indigo-100" />
        <div className="absolute bottom-12 left-10 h-16 w-16 rounded-full bg-indigo-200/50 shadow-xl shadow-indigo-100" />
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-5xl gap-10 rounded-[32px] border border-white/80 bg-white/90 p-10 shadow-2xl shadow-indigo-100/80 backdrop-blur">
        <div className="flex flex-col gap-6 text-center md:text-left">
          <span className="inline-flex items-center justify-center gap-2 self-center rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1 text-xs font-semibold tracking-[0.15em] text-indigo-600 md:self-start">
            HOPE EMS SUITE
          </span>
          <div>
            <h1 className="text-balance text-4xl font-bold text-slate-900 md:text-5xl">
              Calm, clear triage support for paramedics
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              Activate your ambulance device to unlock guided AI intake, live
              transcription, and fast triage assessments—all in a light, modern
              workspace built for high-stakes care.
            </p>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-white/70 p-6 text-left">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg shadow-indigo-100">
                <svg
                  className="h-8 w-8 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Ready to deploy
                </p>
                <p className="text-lg font-semibold text-slate-900">
                  HOPE Ambulance Device
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-500">
              Activation takes less than a minute. Your device stays secure for
              seven days and enables hands-free intake with Retell AI.
            </p>
          </div>
        </div>

        <div className="space-y-6 rounded-3xl border border-slate-100 bg-white/90 p-8 shadow-[0_30px_60px_-45px_rgba(79,70,229,0.45)]">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-slate-900">
              Activate & Begin
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Securely link this device to your ambulance ID to start intake.
            </p>
          </div>
          <Link href="/activate" className="block">
            <button className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-500 to-indigo-400 px-6 py-4 text-lg font-semibold text-white shadow-lg shadow-indigo-200 transition hover:translate-y-0.5 hover:shadow-indigo-300">
              Activate Device
            </button>
          </Link>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-slate-400">
              POWERED BY
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              Retell AI · Google Gemini · Secure Voice Intake
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}