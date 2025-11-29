"use client";

import { useState, useEffect } from "react";
import { Doctor, Emergency } from "../types";
import { UserPlus, Check } from "lucide-react";

export default function DoctorAssignment({ emergency }: { emergency: Emergency }) {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(false);
    const [assignedDoctor, setAssignedDoctor] = useState<string | null>(emergency.doctor_id || null);

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const res = await fetch("/api/doctors");
                const data = await res.json();
                if (res.ok) setDoctors(data);
            } catch (error) {
                console.error("Failed to fetch doctors", error);
            }
        };

        fetchDoctors();
    }, []);

    const assignDoctor = async (doctorId: string) => {
        setLoading(true);
        try {
            const res = await fetch("/api/emergencies/assign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ emergencyId: emergency.id, doctorId }),
            });

            if (res.ok) {
                setAssignedDoctor(doctorId);
            } else {
                const errorData = await res.json();
                console.error("Failed to assign doctor:", errorData);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (assignedDoctor) {
        const doctor = doctors.find((d) => d.id === assignedDoctor);
        return (
            <div className="flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 text-sm font-medium text-emerald-600">
                <Check className="w-4 h-4" />
                Assigned to Dr. {doctor?.full_name || "Unknown"}
            </div>
        );
    }

    return (
        <div className="mt-4">
            <h4 className="mb-2 text-sm font-medium text-slate-500">Available doctor</h4>
            <div className="flex flex-wrap gap-2">
                {doctors.map((doctor) => (
                    <button
                        key={doctor.id}
                        onClick={() => assignDoctor(doctor.id)}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-200 hover:text-slate-800 disabled:opacity-60"
                    >
                        <UserPlus className="w-4 h-4 text-indigo-400" />
                        <span>Dr. {doctor.full_name}</span>
                        <span className="text-xs text-slate-400">({doctor.specialization})</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
