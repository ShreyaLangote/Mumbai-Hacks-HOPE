// app/api/assign-doctor/route.ts
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "../../../supabase/createAdmin";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

type Doctor = {
    id: string;
    full_name?: string;
    specialization?: string | null;
    status?: string | null;
    doctor_availability?: { online_status?: boolean } | null;
};

export async function POST(request: Request) {
    const supabase = createSupabaseAdminClient();

    try {
        const body = await request.json();
        const emergency_id = body?.emergency_id ?? body?.emergencyId ?? body?.id;
        if (!emergency_id) {
            return NextResponse.json({ error: "Missing emergency_id" }, { status: 400 });
        }

        // 1) Fetch emergency
        const { data: emergency, error: emergencyError } = await supabase
            .from("emergencies")
            .select("*")
            .eq("id", emergency_id)
            .single();

        if (emergencyError || !emergency) {
            console.error("Emergency fetch error:", emergencyError);
            return NextResponse.json({ error: "Emergency not found" }, { status: 404 });
        }

        // If already assigned, return early
        if (emergency.doctor_id) {
            return NextResponse.json({ message: "Doctor already assigned", doctor_id: emergency.doctor_id });
        }

        // 2) Fetch active doctors with availability
        let doctors: any[] | null = null;
        let doctorsError = null;

        try {
            const result = await supabase
                .from("users")
                .select("id, full_name, specialization, status, doctor_availability(online_status)")
                .eq("role", "doctor")
                .eq("status", "active");
            doctors = result.data;
            doctorsError = result.error;
        } catch (e) {
            console.warn("Failed to join doctor_availability, fetching users only");
            const result = await supabase
                .from("users")
                .select("id, full_name, specialization, status")
                .eq("role", "doctor")
                .eq("status", "active");
            doctors = result.data;
            doctorsError = result.error;
        }

        if (doctorsError) {
            console.error("Doctors fetch error:", doctorsError);
            return NextResponse.json({ error: "Failed to fetch doctors" }, { status: 500 });
        }
        if (!doctors || doctors.length === 0) {
            return NextResponse.json({ error: "No active doctors found" }, { status: 404 });
        }

        // Helper: build candidate list with normalized specialization
        const candidates: Doctor[] = doctors.map((d: any) => ({
            id: d.id,
            full_name: d.full_name,
            specialization: d.specialization ?? null,
            status: d.status,
            doctor_availability: Array.isArray(d.doctor_availability)
                ? d.doctor_availability[0]
                : d.doctor_availability ?? null,
        }));

        // 3) Try AI routing if key present
        let routingResult: { selected_doctor_id?: string; reasoning?: string } | null = null;
        const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

        if (GEMINI_KEY) {
            try {
                const genAI = new GoogleGenerativeAI(GEMINI_KEY);
                const model = genAI.getGenerativeModel({
                    model: "gemini-2.0-flash",
                    safetySettings: [
                        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    ],
                });

                const payload = {
                    emergency: {
                        patient_age: emergency.patient_age,
                        gender: emergency.gender,
                        symptoms: emergency.symptoms,
                        triage_level: emergency.triage_level,
                        ai_summary: emergency.ai_summary ?? null,
                        doctor_specialty: emergency.doctor_specialty ?? null,
                    },
                    doctors: candidates.map((d) => ({
                        id: d.id,
                        full_name: d.full_name,
                        specialization: d.specialization,
                        is_online: d.doctor_availability?.online_status ?? false
                    })),
                };

                const prompt = `
You are an expert hospital resource manager. Your goal is to assign the most appropriate doctor to an emergency case.

Emergency Case:
${JSON.stringify(payload.emergency, null, 2)}

Available Doctors:
${JSON.stringify(payload.doctors, null, 2)}

Assignment Rules:
1. **Specialty Match**: Prioritize doctors whose specialization matches the patient's symptoms or the 'doctor_specialty' field in the emergency record.
   - Chest pain/Cardiac -> Cardiologist
   - Trauma/Fracture -> Orthopedics or Trauma Surgeon
   - Stroke/Seizure -> Neurologist
   - Breathing issues -> Pulmonologist
   - General/Unknown -> General Physician or Emergency Medicine
2. **Availability**: Prefer doctors who are currently online (is_online: true).
3. **Severity**: For 'critical' or 'high' triage levels, prioritize Emergency Medicine specialists or the most senior relevant specialist available.
4. **Fallback**: If no direct match is found, assign an Emergency Medicine doctor or a General Physician.

Output Format:
Return ONLY a valid JSON object with no markdown formatting:
{
  "selected_doctor_id": "UUID of the selected doctor",
  "reasoning": "A brief explanation of why this doctor was chosen."
}
`;

                const result = await model.generateContent(prompt);
                const response = await result.response;
                const textOut = response.text();

                if (textOut) {
                    const cleaned = textOut.replace(/```json/g, "").replace(/```/g, "").trim();
                    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const parsed = JSON.parse(jsonMatch[0]);
                        if (parsed?.selected_doctor_id) {
                            routingResult = {
                                selected_doctor_id: parsed.selected_doctor_id,
                                reasoning: parsed.reasoning ?? "AI selected doctor",
                            };
                        }
                    }
                }
            } catch (aiErr: any) {
                console.error("AI routing error (continuing to fallback):", aiErr.message);
                if (aiErr.message?.includes("403") || aiErr.message?.includes("API key")) {
                    console.error("CRITICAL: Invalid or leaked API Key. Please check your .env.local file.");
                }
            }
        }

        // 4) If AI didn't pick, use deterministic fallback
        if (!routingResult) {
            const keywordToSpecialty: Record<string, string[]> = {
                chest: ["Cardiology", "Cardiologist", "Cardiology Specialist"],
                chestpain: ["Cardiology", "Cardiologist"],
                "chest pain": ["Cardiology", "Cardiologist"],
                cardiac: ["Cardiology", "Cardiologist"],
                fracture: ["Orthopedics", "Orthopedic Surgeon", "Orthopedics Specialist"],
                bleed: ["Emergency Medicine", "General Surgery", "Trauma"],
                trauma: ["Emergency Medicine", "Trauma Surgeon"],
                breathing: ["Pulmonology", "Pulmonologist", "Respiratory"],
                breathless: ["Pulmonology"],
                seizure: ["Neurology", "Neurologist"],
                stroke: ["Neurology", "Neurologist"],
                allergic: ["Allergist", "Immunology"],
                pregnancy: ["Obstetrics", "OBGYN", "Gynecology"],
                burn: ["Plastic Surgery", "Burn Unit", "Emergency Medicine"],
                "severe": ["Emergency Medicine"],
                critical: ["Emergency Medicine"],
            };

            const textToSearch = ((emergency.symptoms ?? "") + " " + (JSON.stringify(emergency.ai_summary) ?? "")).toLowerCase();

            const scores = new Map<string, number>();
            candidates.forEach((d) => scores.set(d.id, 0));

            Object.entries(keywordToSpecialty).forEach(([k, specialties]) => {
                if (textToSearch.includes(k)) {
                    candidates.forEach((d) => {
                        const spec = (d.specialization ?? "").toLowerCase();
                        specialties.forEach((s) => {
                            if (spec.includes(s.toLowerCase())) {
                                scores.set(d.id, (scores.get(d.id) || 0) + 10);
                            }
                        });
                    });
                }
            });

            candidates.forEach((d) => {
                if (d.doctor_availability?.online_status) {
                    scores.set(d.id, (scores.get(d.id) || 0) + 3);
                }
            });

            const triage = ("" + (emergency.triage_level ?? "")).toLowerCase();
            const severeKeywords = ["critical", "red", "high", "severe"];
            if (severeKeywords.some((t) => triage.includes(t) || textToSearch.includes(t))) {
                candidates.forEach((d) => {
                    if ((d.specialization ?? "").toLowerCase().includes("emergency")) {
                        scores.set(d.id, (scores.get(d.id) || 0) + 8);
                    }
                });
            }

            if ([...scores.values()].every((v) => v === 0)) {
                const preferredSpec = (emergency.doctor_specialty ?? "").toLowerCase();
                if (preferredSpec) {
                    candidates.forEach((d) => {
                        if ((d.specialization ?? "").toLowerCase().includes(preferredSpec)) {
                            scores.set(d.id, (scores.get(d.id) || 0) + 5);
                        }
                    });
                }
            }

            let bestId: string | null = null;
            let bestScore = -Infinity;
            candidates.forEach((d) => {
                const s = scores.get(d.id) ?? 0;
                if (s > bestScore) {
                    bestScore = s;
                    bestId = d.id;
                } else if (s === bestScore && bestId) {
                    const candidateIsOnline = !!d.doctor_availability?.online_status;
                    const currentBest = candidates.find((c) => c.id === bestId);
                    const bestIsOnline = !!currentBest?.doctor_availability?.online_status;
                    if (candidateIsOnline && !bestIsOnline) bestId = d.id;
                }
            });

            if (!bestId && candidates.length > 0) {
                bestId = candidates[0].id;
                bestScore = scores.get(bestId) ?? 0;
            }

            routingResult = {
                selected_doctor_id: bestId ?? null,
                reasoning: `Fallback deterministic routing (score=${bestScore}). Matched keywords from symptoms.`,
            };
        }

        if (!routingResult?.selected_doctor_id) {
            return NextResponse.json({ error: "Failed to select a doctor" }, { status: 500 });
        }

        const { error: updateError } = await supabase
            .from("emergencies")
            .update({
                doctor_id: routingResult.selected_doctor_id,
                ai_routing_agent_output: {
                    assigned_by: GEMINI_KEY ? "gemini+fallback" : "fallback",
                    reasoning: routingResult.reasoning,
                    timestamp: new Date().toISOString(),
                },
                status: "doctor_assigned",   // <-- FIXED ENUM VALUE
            })
            .eq("id", emergency_id);


        if (updateError) {
            console.error("Failed to update emergency assignment:", updateError);
            return NextResponse.json({ error: "Failed to save assignment" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            assigned_doctor_id: routingResult.selected_doctor_id,
            reasoning: routingResult.reasoning,
        });
    } catch (err) {
        console.error("Assign doctor endpoint error:", err);
        return NextResponse.json({ error: "Internal Server Error", details: String(err) }, { status: 500 });
    }
}
