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
        <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center font-sans">
            <header className="w-full max-w-2xl mb-8 flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight text-red-500 flex items-center gap-2">
                    <Activity className="w-6 h-6" />
                    HOPE Ambulance Intake
                </h1>
                <div className="text-xs text-zinc-500">
                    {deviceToken ? "Device Active" : "Device Inactive"}
                </div>
            </header>

            <main className="w-full max-w-2xl flex flex-col gap-8">
                {/* Error Display */}
                {error && (
                    <div className="bg-red-900/20 border border-red-800 text-red-200 p-4 rounded-lg flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                {/* Recording Control */}
                <div className="flex flex-col items-center justify-center py-10">
                    <button
                        onClick={isRecording ? handleStopRecording : handleStartRecording}
                        className={`
                    relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300
                    ${isRecording
                                ? "bg-red-600 hover:bg-red-700 animate-pulse shadow-[0_0_40px_rgba(220,38,38,0.6)]"
                                : "bg-zinc-800 hover:bg-zinc-700 border border-zinc-700"
                            }
                `}
                    >
                        {isRecording ? (
                            <Square className="w-12 h-12 text-white fill-current" />
                        ) : (
                            <Mic className="w-12 h-12 text-white" />
                        )}

                        {/* Breathing Animation Ring */}
                        {isRecording && (
                            <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-20 animate-ping"></span>
                        )}
                    </button>
                    <p className="mt-6 text-zinc-400 font-medium">
                        {isRecording ? "Listening... Tap to stop" : "Tap microphone to start triage"}
                    </p>
                </div>

                {/* Transcript Area */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 min-h-[150px]">
                    <h3 className="text-sm font-semibold text-zinc-500 mb-3 uppercase tracking-wider">Live Transcript</h3>
                    <div className="text-lg text-zinc-200 leading-relaxed whitespace-pre-wrap">
                        {transcript || <span className="text-zinc-600 italic">No speech detected yet...</span>}
                    </div>
                </div>

                {/* Action Button */}
                <button
                    onClick={handleGenerateReport}
                    disabled={!transcript || loading || isRecording}
                    className={`
                w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all
                ${!transcript || loading || isRecording
                            ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20"
                        }
            `}
                >
                    {loading ? (
                        <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                    ) : (
                        <>
                            🧠 Generate Triage Report
                        </>
                    )}
                </button>

                {/* Triage Result */}
                {triageResult && triageResult.ai_triage_agent_output && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className={`
                    p-4 border-b border-zinc-800 flex justify-between items-center
                    ${triageResult.ai_triage_agent_output.triage_level === 'critical' ? 'bg-red-900/30 text-red-400' :
                                triageResult.ai_triage_agent_output.triage_level === 'moderate' ? 'bg-yellow-900/30 text-yellow-400' :
                                    'bg-green-900/30 text-green-400'}
                `}>
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Activity className="w-5 h-5" />
                                AI Triage Analysis
                            </h3>
                            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase border border-current bg-black/20">
                                {triageResult.ai_triage_agent_output.triage_level} Severity
                            </span>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <h4 className="text-sm text-zinc-500 mb-2 uppercase font-semibold">Patient Summary</h4>
                                <p className="text-zinc-200">{triageResult.ai_triage_agent_output.summary}</p>
                            </div>

                            <div>
                                <h4 className="text-sm text-zinc-500 mb-2 uppercase font-semibold">Suggested Actions</h4>
                                <ul className="space-y-2">
                                    {triageResult.ai_triage_agent_output.suggested_actions.map((action, idx) => (
                                        <li key={idx} className="flex items-start gap-3 text-zinc-300">
                                            <CheckCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                            <span>{action}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
