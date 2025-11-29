"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Activity, AlertCircle, Bell, Clock, Stethoscope } from "lucide-react";
import type { Doctor, Emergency } from "@/types";

const fetchJSON = async <T,>(url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
};

const severityPills: Record<string, string> = {
  critical: "bg-rose-50 text-rose-600 border-rose-200",
  high: "bg-orange-50 text-orange-600 border-orange-200",
  moderate: "bg-amber-50 text-amber-600 border-amber-200",
  medium: "bg-amber-50 text-amber-600 border-amber-200",
  low: "bg-emerald-50 text-emerald-600 border-emerald-200",
  default: "bg-slate-50 text-slate-500 border-slate-200",
};

const formatTime = (value: string) =>
  new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export default function DoctorDashboard() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [cases, setCases] = useState<Emergency[]>([]);
  const [casesLoading, setCasesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notificationCase, setNotificationCase] = useState<Emergency | null>(
    null
  );
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const caseIdsRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef(true);
  const notificationTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const storedDoctor = window.localStorage.getItem("doctor_id");
    if (storedDoctor) {
      setSelectedDoctorId(storedDoctor);
    }
    fetchJSON<Doctor[]>("/api/doctors")
      .then((data) => {
        setDoctors(data);
        if (!storedDoctor && data.length) {
          setSelectedDoctorId(data[0].id);
        }
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!selectedDoctorId) return;
    window.localStorage.setItem("doctor_id", selectedDoctorId);
  }, [selectedDoctorId]);

  const fetchCases = useCallback(
    async (doctorId: string) => {
      setCasesLoading(true);
      try {
        const data = await fetchJSON<Emergency[]>(
          `/api/emergencies?doctorId=${doctorId}`
        );
        setCases(data);
        setError(null);
        setLastUpdated(new Date().toISOString());

        const incomingIds = new Set(data.map((item) => item.id));
        if (!initialLoadRef.current) {
          const fresh = data.find((item) => !caseIdsRef.current.has(item.id));
          if (fresh) {
            setNotificationCase(fresh);
            if (notificationTimeout.current) {
              clearTimeout(notificationTimeout.current);
            }
            notificationTimeout.current = setTimeout(
              () => setNotificationCase(null),
              6000
            );
          }
        }
        caseIdsRef.current = incomingIds;
        initialLoadRef.current = false;
      } catch (err: any) {
        setError(err.message);
      } finally {
        setCasesLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!selectedDoctorId) return;
    initialLoadRef.current = true;
    fetchCases(selectedDoctorId);

    const interval = setInterval(() => fetchCases(selectedDoctorId), 6000);
    return () => {
      clearInterval(interval);
      caseIdsRef.current = new Set();
    };
  }, [fetchCases, selectedDoctorId]);

  useEffect(() => {
    return () => {
      if (notificationTimeout.current) {
        clearTimeout(notificationTimeout.current);
      }
    };
  }, []);

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId) || null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-sky-50 px-4 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-10 h-40 w-40 rounded-full bg-gradient-to-br from-indigo-100 to-sky-100 blur-3xl" />
        <div className="absolute right-10 top-24 h-32 w-32 rounded-full bg-white/80 shadow-2xl shadow-sky-100" />
        <div className="absolute bottom-12 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-sky-100/70 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="glass-panel flex flex-wrap items-center justify-between gap-6 p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
              Doctor Command
            </p>
            <h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold text-slate-900">
              <Stethoscope className="h-7 w-7 text-indigo-500" />
              HOPE Care Team
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Every assignment arrives with an AI summary, transcript, and
              severity so you can respond instantly.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-center shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Selected Doctor
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {selectedDoctor?.full_name || "Choose one"}
              </p>
              {selectedDoctor?.specialization && (
                <p className="text-xs text-slate-400">
                  {selectedDoctor.specialization}
                </p>
              )}
            </div>
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 px-5 py-3 shadow-inner shadow-white">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-400">
                Feed
              </p>
              <div className="mt-1 flex items-center gap-2 font-semibold text-indigo-600">
                    <Activity className="h-4 w-4" />
                    {casesLoading ? "Syncing..." : "Live"}
              </div>
              {lastUpdated && (
                <p className="text-[11px] text-indigo-400">
                  Updated {formatTime(lastUpdated)}
                </p>
              )}
            </div>
          </div>
        </header>

        {notificationCase && (
          <div className="rounded-[28px] border border-emerald-100 bg-emerald-50/90 p-4 text-sm text-emerald-600 shadow-lg shadow-emerald-100/60">
            <div className="flex items-center gap-3 font-semibold">
              <Bell className="h-4 w-4" />
              New emergency routed to you
            </div>
            <p className="mt-2 text-slate-700">
              {notificationCase.patient_name || "Patient"} ·{" "}
              {notificationCase.ai_summary?.summary ||
                notificationCase.symptoms ||
                "View details below"}
            </p>
          </div>
        )}

        <section className="glass-panel p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                Care Team
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                Tap to view your assignments
              </h2>
            </div>
            <span className="rounded-full border border-dashed border-slate-200 px-3 py-1 text-xs text-slate-400">
              {doctors.length} doctors
            </span>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {doctors.map((doctor) => {
              const isActive = doctor.id === selectedDoctorId;
              return (
                <button
                  key={doctor.id}
                  onClick={() => setSelectedDoctorId(doctor.id)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                    isActive
                      ? "border-indigo-300 bg-gradient-to-r from-indigo-500/10 to-sky-400/10 text-indigo-700 shadow-md shadow-indigo-100"
                      : "border-slate-100 bg-white text-slate-600 hover:border-indigo-100 hover:text-indigo-500"
                  }`}
                >
                  <p className="font-semibold">{doctor.full_name}</p>
                  <p className="text-xs text-slate-400">
                    {doctor.specialization || "Generalist"}
                  </p>
                </button>
              );
            })}
            {doctors.length === 0 && (
              <p className="text-sm text-slate-400">
                No doctors found. Add doctors in the hospital dashboard.
              </p>
            )}
          </div>
        </section>

        <section className="glass-panel p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                Assigned Emergencies
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                {cases.length ? `${cases.length} active case(s)` : "No cases"}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Each report includes patient context, AI summary, and suggested
                interventions.
              </p>
            </div>
            {error && (
              <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-sm text-rose-600">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>

          {selectedDoctor && cases.length === 0 && !error && (
            <div className="mt-8 rounded-[28px] border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center text-slate-400">
              <Stethoscope className="mx-auto h-10 w-10 text-slate-200" />
              <p className="mt-4 text-base font-semibold text-slate-500">
                You're all caught up
              </p>
              <p className="text-sm">We'll notify you as soon as a case arrives.</p>
            </div>
          )}

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {cases.map((item) => {
              const severityClass =
                severityPills[item.triage_level ?? ""] || severityPills.default;
              const aiSummary =
                item.ai_triage_agent_output?.summary ||
                item.ai_summary?.summary ||
                item.symptoms;
              const suggestedActions =
                item.ai_triage_agent_output?.suggested_actions || [];

              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-5 rounded-[28px] border border-slate-100 bg-white p-6 shadow-[0_25px_65px_-45px_rgba(15,31,61,0.35)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${severityClass}`}
                    >
                      {item.triage_level || "unknown"} priority
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="h-4 w-4" />
                      {formatTime(item.created_at)}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">
                      {item.patient_name || "Unknown patient"}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {item.patient_age ? `${item.patient_age} yrs` : "Age N/A"} •{" "}
                      {item.gender || "Gender N/A"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm leading-relaxed text-slate-600">
                    {aiSummary}
                  </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                        Suggested actions
                      </p>
                      <ul className="mt-3 space-y-2 text-sm text-slate-600">
                        {suggestedActions.length ? (
                          suggestedActions.map((action, idx) => (
                            <li
                              key={`${item.id}-action-${idx}`}
                              className="flex items-start gap-2 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"
                            >
                              <span className="mt-1 h-2 w-2 rounded-full bg-indigo-400" />
                              <span>{action}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-slate-400">No actions provided.</li>
                        )}
                      </ul>
                    </div>

                  {item.ai_routing_agent_output?.reasoning && (
                    <div className="border-l-2 border-indigo-100 pl-3 text-xs italic text-slate-400">
                      "{item.ai_routing_agent_output.reasoning}"
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
