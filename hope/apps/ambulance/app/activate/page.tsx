"use client";

import { useState } from "react";
import { saveDeviceToken } from "../../lib/device";

export default function Activate() {
    const [number, setNumber] = useState("");
    const [message, setMessage] = useState("");

    const activate = async () => {
        try {
            const res = await fetch("/api/activate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ambulance_number: number }),
            });

            const data = await res.json();

            if (data.device_token) {
                // Save token to cookies
                document.cookie = `device_token=${data.device_token}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Strict`;

                saveDeviceToken(data.device_token);
                setMessage("Activated! You can now use HOPE 🚑");
            } else {
                setMessage(data.error || "Activation failed.");
            }

        } catch (err) {
            setMessage("Network or system error");
        }
    };

    return (
        <div className="bg-gray-900 p-6 min-h-screen text-white">
            <h1 className="mb-4 font-bold text-xl">🚑 Activate Ambulance Device</h1>

            <input
                placeholder="Enter ambulance number"
                className="p-2 rounded text-black"
                onChange={(e) => setNumber(e.target.value)}
            />

            <button className="bg-blue-600 ml-2 px-4 py-2 rounded" onClick={activate}>
                Activate
            </button>

            {message && <p className="mt-4 text-green-400">{message}</p>}
        </div>
    );
}