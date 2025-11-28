"use client";

import { useState, useEffect } from "react";
import { Emergency } from "../types";
import DoctorAssignment from "./DoctorAssignment";
import { AlertCircle, Clock, Activity, User } from "lucide-react";

export default function EmergencyList() {
    const [emergencies, setEmergencies] = useState<Emergency[]>([]);

    useEffect(() => {
        const fetchEmergencies = async () => {
            try {
                const res = await fetch("/api/emergencies");
                const data = await res.json();
                if (res.ok) {
                    setEmergencies(data);
                } else {
                    console.error("Failed to fetch emergencies:", data.error);
                }
            } catch (error) {
                console.error("Error fetching emergencies:", error);
            }
        };

        fetchEmergencies();

        // Polling for updates since we can't use real-time with admin bypass easily without RLS
        // Alternatively, we could keep the public client for subscription if RLS allowed reading just IDs
        const interval = setInterval(fetchEmergencies, 5000);

        return () => clearInterval(interval);
    }, []);

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'low': return 'bg-green-500/10 text-green-500 border-green-500/20';
            default: return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
        }
    };

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {emergencies.map((emergency) => (
                <div key={emergency.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-4 hover:border-zinc-700 transition-colors">
                    <div className="flex justify-between items-start">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getSeverityColor(emergency.triage_level)}`}>
                            {emergency.triage_level} Priority
                        </div>
                        <span className="text-zinc-500 text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(emergency.created_at).toLocaleTimeString()}
                        </span>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <User className="w-5 h-5 text-zinc-400" />
                            {emergency.patient_name || "Unknown Patient"}
                        </h3>
                        <div className="text-zinc-400 text-sm mt-1">
                            {emergency.patient_age ? `${emergency.patient_age} yrs` : "Age N/A"} • {emergency.gender || "Gender N/A"}
                        </div>
                    </div>

                    <div className="bg-black/20 rounded-lg p-3 border border-zinc-800/50">
                        <div className="text-xs text-zinc-500 uppercase font-semibold mb-1 flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            Symptoms
                        </div>
                        <p className="text-zinc-300 text-sm leading-relaxed">
                            {emergency.symptoms}
                        </p>
                    </div>

                    {emergency.ai_summary?.summary && (
                        <div className="text-sm text-zinc-400 border-l-2 border-zinc-700 pl-3 italic">
                            "{emergency.ai_summary.summary}"
                        </div>
                    )}

                    <div className="mt-auto pt-4 border-t border-zinc-800">
                        <DoctorAssignment emergency={emergency} />
                    </div>
                </div>
            ))}

            {emergencies.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-500">
                    <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
                    <p>No active emergencies reported</p>
                </div>
            )}
        </div>
    );
}
