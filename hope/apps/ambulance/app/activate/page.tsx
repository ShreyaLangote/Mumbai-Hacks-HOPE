"use client";

import { useState } from "react";
import { saveDeviceToken } from "../../lib/device";

export default function Activate() {
    const [number, setNumber] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const activate = async () => {
        if (!number.trim()) {
            setMessage("Please enter an ambulance number");
            return;
        }

        setIsLoading(true);
        setMessage("");

        try {
            const res = await fetch("/api/activate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ambulance_number: number }),
            });

            const data = await res.json();

            if (data.device_token) {
                saveDeviceToken(data.device_token);
                setMessage("Activated! You can now use HOPE 🚑");

                // Redirect to intake page after 2 seconds
                setTimeout(() => {
                    window.location.href = '/intake';
                }, 2000);
            } else {
                setMessage(data.error || "Activation failed. Please try again.");
            }
        } catch (err) {
            setMessage("Network error. Please check your connection and try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isLoading) {
            activate();
        }
    };

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-4 py-12">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-y-0 left-1/2 w-[26rem] -translate-x-1/2 rounded-full bg-indigo-100/50 blur-3xl" />
                <div className="absolute right-20 top-20 h-16 w-16 rounded-full bg-white/80 shadow-2xl shadow-indigo-100" />
                <div className="absolute bottom-24 left-16 h-24 w-24 rounded-[40%] bg-indigo-200/40 blur-xl" />
            </div>
            <div className="relative z-10 mx-auto w-full max-w-lg rounded-[32px] border border-white/70 bg-white/95 p-10 shadow-2xl shadow-indigo-100/60 backdrop-blur">
                <div className="mb-10 text-center">
                    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-400 text-white shadow-lg shadow-indigo-200">
                        <svg
                            className="h-10 w-10"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            />
                        </svg>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">
                        Secure Access
                    </p>
                    <h1 className="mt-3 text-3xl font-semibold text-slate-900">
                        Activate this ambulance
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Link the device to your ambulance ID. Tokens remain active for 7 days.
                    </p>
                </div>

                <div className="space-y-6">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                        <label
                            htmlFor="ambulance-number"
                            className="mb-2 block text-sm font-medium text-slate-600"
                        >
                            Ambulance Number
                        </label>
                        <div className="relative">
                            <input
                                id="ambulance-number"
                                type="text"
                                placeholder="e.g., AMB-001"
                                className="w-full rounded-xl border border-transparent bg-white px-4 py-3 text-base text-slate-900 shadow-inner shadow-indigo-50 outline-none transition-all focus:border-indigo-200 focus:ring-4 focus:ring-indigo-100 disabled:opacity-70"
                                onChange={(e) => setNumber(e.target.value)}
                                onKeyPress={handleKeyPress}
                                value={number}
                                disabled={isLoading}
                            />
                            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs font-semibold uppercase tracking-[0.35em] text-indigo-300">
                                EMS
                            </div>
                        </div>
                    </div>

                    <button
                        className={`w-full rounded-2xl px-4 py-4 text-lg font-semibold text-white transition-all duration-200 shadow-lg ${isLoading
                            ? "cursor-not-allowed bg-slate-300 shadow-none"
                            : "bg-gradient-to-r from-indigo-500 via-indigo-500 to-indigo-400 hover:shadow-indigo-200"
                            }`}
                        onClick={activate}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-3">
                                <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                </svg>
                                Activating...
                            </span>
                        ) : (
                            "Activate Device"
                        )}
                    </button>

                    {message && (
                        <div className={`rounded-2xl border p-4 text-sm font-medium ${message.includes("Activated")
                            ? "border-emerald-100 bg-emerald-50/80 text-emerald-700"
                            : "border-rose-100 bg-rose-50/80 text-rose-700"
                            }`}>
                            <div className="flex items-start gap-3">
                                {message.includes("Activated") ? (
                                    <svg className="h-5 w-5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg className="h-5 w-5 text-rose-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                )}
                                <p>{message}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-10 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-5 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                        HOPE EMS
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                        Device identity is encrypted & refreshed every 7 days.
                    </p>
                </div>
            </div>
        </div>
    );
}