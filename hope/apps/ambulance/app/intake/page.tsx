"use client";

import { useState, useEffect, useRef } from "react";
import { getRetellClient } from "../../lib/voice";
import { getDeviceToken } from "../../lib/device";
import { RetellWebClient } from "retell-client-js-sdk";
import { Mic, Square, Activity, AlertCircle, CheckCircle } from "lucide-react";

// Define types for Triage Result
interface TriageResult {
    patient: {
        name: string | null;
        age: number | null;
        gender: string | null;
    };
    ai_triage_agent_output: {
        summary: string;
        triage_level: "critical" | "moderate" | "low";
        suggested_actions: string[];
    };
}

export default function IntakePage() {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deviceToken, setDeviceToken] = useState<string | null>(null);

    const retellClient = useRef<RetellWebClient | null>(null);

    useEffect(() => {
        // Initialize Retell Client
        retellClient.current = getRetellClient();

        // Get device token from local storage
        const token = getDeviceToken();
        if (token) {
            setDeviceToken(token);
        } else {
            setError("Device not activated. Please activate the ambulance first.");
        }

        // Setup Retell Event Listeners
        if (retellClient.current) {
            retellClient.current.on("conversation_started", () => {
                console.log("Conversation started");
                setIsRecording(true);
            });

            retellClient.current.on("conversation_ended", () => {
                console.log("Conversation ended");
                setIsRecording(false);
            });

            retellClient.current.on("error", (error: any) => {
                console.error("Retell Error:", error);
                setError(`Voice Error: ${error.message}`);
                setIsRecording(false);
            });

            retellClient.current.on("update", (update: any) => {
                if (update.transcript) {
                    const currentTranscript = update.transcript
                        .filter((item: any) => item.role === 'user' || item.role === 'agent')
                        .map((item: any) => `${item.role === 'agent' ? 'Nurse Assistant' : 'Paramedic'}: ${item.content}`)
                        .join("\n");
                    setTranscript(currentTranscript);
                }
            });
        }

        return () => {
            if (retellClient.current) {
                retellClient.current.stopCall();
            }
        };
    }, []);

    const handleStartRecording = async () => {
        setError(null);
        setTriageResult(null);
        setTranscript("");

        if (!deviceToken) {
            setError("Device token missing.");
            return;
        }

        try {
            // 1. Get Conversation ID from Backend
            const response = await fetch("/api/retell/session", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "device_token": deviceToken,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to create voice session");
            }

            const data = await response.json();

            // 2. Start Retell Conversation
            if (retellClient.current) {
                await retellClient.current.startCall({
                    accessToken: data.access_token,
                });
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to start recording");
        }
    };

    const handleStopRecording = () => {
        if (retellClient.current) {
            retellClient.current.stopCall();
        }
    };

    const handleGenerateReport = async () => {
        if (!transcript) return;
        setLoading(true);
        setError(null);

        try {
            if (!deviceToken) throw new Error("Device token missing");

            const response = await fetch("/api/triage", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "device_token": deviceToken
                },
                body: JSON.stringify({ transcript })
            });

            if (!response.ok) {
                throw new Error("Failed to generate triage report");
            }

            const data = await response.json();
            setTriageResult(data);

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to generate report");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-4 py-10 font-sans">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
                <header className="flex flex-wrap items-center justify-between gap-6 rounded-[32px] border border-white/80 bg-white/95 px-8 py-6 shadow-lg shadow-indigo-100/60 backdrop-blur">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                            Ambulance Intake
                        </p>
                        <h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold text-slate-900">
                            <Activity className="h-6 w-6 text-indigo-500" />
                            HOPE Voice Triage
                        </h1>
                        <p className="mt-2 text-sm text-slate-500">
                            Guided AI intake, real-time transcripts, and instant triage summaries.
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-3 text-sm text-slate-500">
                        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                            Device Status
                        </span>
                        <span
                            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${deviceToken
                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                    : "bg-amber-50 text-amber-600 border border-amber-100"
                                }`}
                        >
                            <span className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: deviceToken ? "#22c55e" : "#f59e0b" }}
                            />
                            {deviceToken ? "Device Active" : "Device Inactive"}
                        </span>
                    </div>
                </header>

                {error && (
                    <div className="rounded-[28px] border border-rose-100 bg-rose-50/80 p-4 text-sm text-rose-700 shadow-sm shadow-rose-100">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5" />
                            <p>{error}</p>
                        </div>
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="space-y-6">
                        <div className="rounded-[28px] border border-indigo-50 bg-white/95 p-8 shadow-xl shadow-indigo-100/50">
                            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                                Voice Intake
                            </p>
                            <div className="mt-6 flex flex-col items-center justify-center">
                                <button
                                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                                    className={`relative flex h-32 w-32 items-center justify-center rounded-full border transition-all duration-300 ${isRecording
                                            ? "border-transparent bg-gradient-to-br from-rose-500 to-rose-400 text-white shadow-[0_25px_45px_-20px_rgba(244,63,94,0.5)]"
                                            : "border-indigo-100 bg-white text-indigo-500 shadow-inner shadow-indigo-50 hover:border-indigo-200 hover:shadow-lg"
                                        }`}
                                >
                                    {isRecording ? (
                                        <Square className="h-12 w-12 fill-current" />
                                    ) : (
                                        <Mic className="h-12 w-12" />
                                    )}
                                    {isRecording && (
                                        <span className="absolute inset-0 rounded-full border-2 border-white/70 opacity-70 blur-[1px] transition-all" />
                                    )}
                                </button>
                                <p className="mt-6 text-sm font-medium text-slate-500">
                                    {isRecording ? "Listening... tap to end capture" : "Tap mic to begin triage capture"}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-[28px] border border-slate-100 bg-white/90 p-6 shadow-xl shadow-slate-100">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                                    Live Transcript
                                </h3>
                                {transcript && (
                                    <span className="text-xs font-semibold text-indigo-400">Real-time</span>
                                )}
                            </div>
                            <div className="mt-4 min-h-[180px] rounded-2xl bg-slate-50/80 p-4 text-base leading-relaxed text-slate-700 shadow-inner shadow-white">
                                {transcript ? (
                                    <span className="whitespace-pre-wrap">{transcript}</span>
                                ) : (
                                    <span className="text-slate-400 italic">No speech detected yet...</span>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleGenerateReport}
                            disabled={!transcript || loading || isRecording}
                            className={`w-full rounded-[24px] px-6 py-4 text-lg font-semibold text-white transition-all ${!transcript || loading || isRecording
                                    ? "cursor-not-allowed bg-slate-200 text-slate-400"
                                    : "bg-gradient-to-r from-indigo-500 via-indigo-500 to-sky-400 shadow-xl shadow-indigo-100 hover:translate-y-0.5"
                                }`}
                        >
                            {loading ? (
                                <span className="inline-flex items-center gap-3">
                                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Generating Report...
                                </span>
                            ) : (
                                "🧠 Generate Triage Report"
                            )}
                        </button>
                    </div>

                    <div className="rounded-[28px] border border-slate-100 bg-white/95 p-8 shadow-xl shadow-indigo-100/50">
                        {triageResult && triageResult.ai_triage_agent_output ? (
                            <div className="space-y-6">
                                <div
                                    className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold ${triageResult.ai_triage_agent_output.triage_level === "critical"
                                            ? "bg-rose-50 text-rose-600 border border-rose-100"
                                            : triageResult.ai_triage_agent_output.triage_level === "moderate"
                                                ? "bg-amber-50 text-amber-600 border border-amber-100"
                                                : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                        }`}
                                >
                                    <span className="flex items-center gap-2">
                                        <Activity className="h-4 w-4" />
                                        AI Triage Analysis
                                    </span>
                                    <span className="text-xs uppercase tracking-[0.2em]">
                                        {triageResult.ai_triage_agent_output.triage_level} Severity
                                    </span>
                                </div>

                                <div>
                                    <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                                        Patient Summary
                                    </h4>
                                    <p className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                                        {triageResult.ai_triage_agent_output.summary}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                                        Suggested Actions
                                    </h4>
                                    <ul className="mt-3 space-y-3">
                                        {triageResult.ai_triage_agent_output.suggested_actions.map((action, idx) => (
                                            <li key={idx} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-3 text-sm text-slate-600 shadow-sm">
                                                <CheckCircle className="h-5 w-5 text-indigo-400" />
                                                <span>{action}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
                                <Activity className="h-10 w-10 text-indigo-200" />
                                <p className="mt-4 text-base font-semibold text-slate-500">Awaiting analysis</p>
                                <p className="mt-2 text-sm">
                                    Generate a triage report to review AI-driven severity and actions.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
