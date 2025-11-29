import Link from "next/link";

export default function Home() {
  return (
    <div className="relative bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-4 py-12 min-h-screen overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="left-1/2 absolute inset-y-0 bg-indigo-100/60 blur-3xl rounded-full w-[32rem] -translate-x-1/2" />
        <div className="top-16 right-12 absolute bg-white/70 shadow-2xl shadow-indigo-100 rounded-full w-32 h-32" />
        <div className="bottom-12 left-10 absolute bg-indigo-200/50 shadow-indigo-100 shadow-xl rounded-full w-16 h-16" />
      </div>

      <div className="z-10 relative gap-10 grid bg-white/90 shadow-2xl shadow-indigo-100/80 backdrop-blur mx-auto p-10 border border-white/80 rounded-[32px] w-full max-w-5xl">
        <div className="flex flex-col gap-6 md:text-left text-center">
          <span className="inline-flex justify-center items-center self-center md:self-start gap-2 bg-indigo-50 px-4 py-1 border border-indigo-100 rounded-full font-semibold text-indigo-600 text-xs tracking-[0.15em]">
            HOPE EMS SUITE
          </span>
          <div >
            <h1 className="mb-10 font-bold text-slate-900 text-4xl md:text-5xl text-balance">
              <span className="text-indigo-600">Calm</span>, clear triage support
              for paramedics
            </h1>

            <p className="mt-4 text-slate-600 text-lg">
              Activate your ambulance device to unlock guided AI intake, live
              transcription, and fast triage assessments—all in a light, modern
              workspace built for high-stakes care.
            </p>
          </div>

          <div className="flex flex-col gap-4 bg-gradient-to-r from-indigo-50 to-white/70 p-6 border border-indigo-100 rounded-2xl text-left">
            <div className="flex items-center gap-4">
              <div className="flex justify-center items-center bg-white shadow-indigo-100 shadow-lg rounded-2xl w-14 h-14">
                <svg
                  className="w-8 h-8 text-indigo-600"
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
                <p className="font-semibold text-slate-500 text-sm uppercase tracking-wide">
                  Ready to deploy
                </p>
                <p className="font-semibold text-slate-900 text-lg">
                  HOPE Ambulance Device
                </p>
              </div>
            </div>
            <p className="text-slate-500 text-sm">
              Activation takes less than a minute. Your device stays secure for
              seven days and enables hands-free intake with Retell AI.
            </p>
          </div>
        </div>

        <div className="space-y-6 bg-white/90 shadow-[0_30px_60px_-45px_rgba(79,70,229,0.45)] p-8 border border-slate-100 rounded-3xl">
          <div className="text-center">
            <h2 className="font-semibold text-slate-900 text-2xl">
              Activate & Begin
            </h2>
            <p className="mt-2 text-slate-500 text-sm">
              Securely link this device to your ambulance ID to start intake.
            </p>
          </div>
          <Link href="/activate" className="block">
            <button className="bg-gradient-to-r from-indigo-500 via-indigo-500 to-indigo-400 shadow-indigo-200 shadow-lg hover:shadow-indigo-300 px-6 py-4 rounded-2xl w-full font-semibold text-white text-lg transition hover:translate-y-0.5">
              Activate Device
            </button>
          </Link>
          <div className="bg-slate-50/80 p-5 border border-slate-100 rounded-2xl text-center">
            <p className="font-medium text-slate-400 text-xs uppercase tracking-[0.3em]">
              POWERED BY
            </p>
            <p className="mt-2 font-semibold text-slate-600 text-sm">
              Retell AI · Google Gemini · Secure Voice Intake
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}