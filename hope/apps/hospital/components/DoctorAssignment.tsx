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
                console.error("Failed to assign doctor");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (assignedDoctor) {
        const doctor = doctors.find(d => d.id === assignedDoctor);
        return (
            <div className="flex items-center gap-2 text-green-400 text-sm font-medium bg-green-900/20 px-3 py-1.5 rounded-full w-fit">
                <Check className="w-4 h-4" />
                Assigned to Dr. {doctor?.full_name || "Unknown"}
            </div>
        );
    }

    return (
        <div className="mt-4">
            <h4 className="text-sm text-zinc-500 mb-2 font-medium">Assign Doctor</h4>
            <div className="flex flex-wrap gap-2">
                {doctors.map((doctor) => (
                    <button
                        key={doctor.id}
                        onClick={() => assignDoctor(doctor.id)}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors border border-zinc-700"
                    >
                        <UserPlus className="w-4 h-4 text-zinc-400" />
                        <span className="text-zinc-200">Dr. {doctor.full_name}</span>
                        <span className="text-xs text-zinc-500">({doctor.specialization})</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
