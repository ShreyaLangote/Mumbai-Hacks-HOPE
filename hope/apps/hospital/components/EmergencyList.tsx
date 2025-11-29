"use client";

import { useState, useEffect } from "react";
import { Emergency } from "../types";
import DoctorAssignment from "./DoctorAssignment";
import { AlertCircle, Clock, Activity, User } from "lucide-react";

export default function EmergencyList() {
    const [emergencies, setEmergencies] = useState<Emergency[]>([]);

    const fetchEmergencies = async () => {
        try {
            const res = await fetch("/api/emergencies");
            const data = await res.json();
            if (res.ok) {
                setEmergencies(data);

                // Auto-assign doctors for unassigned cases
                data.forEach((emergency: Emergency) => {
                    if (!emergency.doctor_id) {
                        assignDoctor(emergency.id);
                    }
                });
            } else {
                console.error("Failed to fetch emergencies:", data.error);
            }
        } catch (error) {
            console.error("Error fetching emergencies:", error);
        }
    };

    const assignDoctor = async (emergencyId: string) => {
        try {
            await fetch("/api/assign-doctor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ emergency_id: emergencyId })
            });
            // Re-fetch to show updated assignment
            // We don't await this to avoid blocking
        } catch (error) {
            console.error("Failed to auto-assign doctor:", error);
        }
    };

    useEffect(() => {
        fetchEmergencies();
        const interval = setInterval(fetchEmergencies, 5000);
        return () => clearInterval(interval);
    }, []);

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "critical":
                return "bg-rose-50 text-rose-600 border-rose-200";
            case "high":
                return "bg-orange-50 text-orange-600 border-orange-200";
            case "moderate":
            case "medium":
                return "bg-amber-50 text-amber-600 border-amber-200";
            case "low":
                return "bg-emerald-50 text-emerald-600 border-emerald-200";
            default:
                return "bg-slate-50 text-slate-500 border-slate-200";
        }
    };

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {emergencies.map((emergency) => (
                <div
                    key={emergency.id}
                    className="flex flex-col gap-4 rounded-[24px] border border-slate-100 bg-white/95 p-6 shadow-[0_20px_60px_-45px_rgba(37,99,235,0.45)] transition-shadow hover:shadow-[0_25px_65px_-40px_rgba(14,165,233,0.4)]"
                >
                    <div className="flex justify-between items-start">
                        <div
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getSeverityColor(
                                emergency.triage_level
                            )}`}
                        >
                            {emergency.triage_level} priority
                        </div>
                        <span className="flex items-center gap-1 text-slate-400 text-xs">
                            <Clock className="w-3 h-3" />
                            {new Date(emergency.created_at).toLocaleTimeString()}
                        </span>
                    </div>

                    <div>
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                            <User className="w-5 h-5 text-slate-400" />
                            {emergency.patient_name || "Unknown Patient"}
                        </h3>
                        <div className="mt-1 text-sm text-slate-500">
                            {emergency.patient_age ? `${emergency.patient_age} yrs` : "Age N/A"} •{" "}
                            {emergency.gender || "Gender N/A"}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                        <div className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                            <Activity className="w-3 h-3" />
                            Symptoms
                        </div>
                        <p className="text-sm leading-relaxed text-slate-600">
                            {emergency.symptoms}
                        </p>
                    </div>

                    {/* AI Routing Output */}
                    {emergency.ai_routing_agent_output && (
                        <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
                            <div className="mb-1 text-xs font-semibold uppercase tracking-[0.25em] text-sky-500">
                                🤖 AI assigned doctor
                            </div>
                            <div className="text-sm font-semibold text-slate-800">
                                Doctor ID: {emergency.doctor_id?.slice(0, 8)}...
                            </div>
                            <div className="mt-1 text-xs italic text-slate-500">
                                "{emergency.ai_routing_agent_output.reasoning}"
                            </div>
                        </div>
                    )}

                    {emergency.ai_summary?.summary && (
                        <div className="border-l-2 border-slate-200 pl-3 text-sm italic text-slate-500">
                            "{emergency.ai_summary.summary}"
                        </div>
                    )}

                    <div className="mt-auto border-t border-slate-100 pt-4">
                        <DoctorAssignment emergency={emergency} />
                    </div>
                </div>
            ))}

            {emergencies.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center rounded-[32px] border border-dashed border-slate-200 bg-white/70 py-20 text-slate-400">
                    <AlertCircle className="mb-4 h-12 w-12 opacity-40" />
                    <p className="text-sm">No active emergencies reported</p>
                </div>
            )}
        </div>
    );
}
