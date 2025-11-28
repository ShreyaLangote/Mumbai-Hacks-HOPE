import { NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { createSupabaseAdminClient } from "../../../supabase/createAdmin";

export async function POST(request: Request) {
    try {
        const deviceToken = request.headers.get("device_token");

        if (!deviceToken) {
            return NextResponse.json(
                { error: "Missing device_token header" },
                { status: 401 }
            );
        }

        const { transcript } = await request.json();

        if (!transcript) {
            return NextResponse.json(
                { error: "Missing transcript in body" },
                { status: 400 }
            );
        }

        const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: "Server configuration error: Missing Gemini API key" },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        // Using gemini-2.0-flash as it is available for this API key
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            safetySettings: [
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
            ],
        });

        const prompt = `
      You are an expert emergency triage nurse assistant. 
      Analyze the following ambulance intake transcript and provide a structured triage report.
      
      Transcript: "${transcript}"
      
      Return ONLY a JSON object with the following structure:
      {
        "patient_name": "Name if mentioned, else null",
        "patient_age": "Age as integer if mentioned, else null",
        "gender": "Gender if mentioned, else null",
        "symptoms": "Main symptoms described",
        "summary": "Brief summary of patient condition",
        "severity": "critical" | "moderate" | "low",
        "suggested_actions": ["List of 3-5 concise actions for the paramedic"]
      }
    `;

        console.log("Generating content with Gemini...");
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const responseText = response.text();
        console.log("Gemini Raw Response:", responseText);

        // Clean up markdown code blocks if present
        const cleanedJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

        let triageData;
        try {
            triageData = JSON.parse(cleanedJson);
        } catch (e) {
            console.error("Failed to parse Gemini response:", responseText);
            // Fallback: try to find JSON object in text
            const jsonMatch = cleanedJson.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    triageData = JSON.parse(jsonMatch[0]);
                } catch (e2) {
                    return NextResponse.json(
                        { error: "Failed to generate valid triage report", details: responseText },
                        { status: 500 }
                    );
                }
            } else {
                return NextResponse.json(
                    { error: "Failed to generate valid triage report", details: responseText },
                    { status: 500 }
                );
            }
        }

        console.log("Parsed Triage Data:", triageData);

        // Store in Supabase
        const supabase = createSupabaseAdminClient();

        // First get the ambulance ID from the device token (which is linked to the ambulance)
        // We need to find the ambulance that has this device_token
        const { data: ambulanceData, error: ambulanceError } = await supabase
            .from("ambulances")
            .select("id, assigned_nurse")
            .eq("device_token", deviceToken)
            .single();

        if (ambulanceError || !ambulanceData) {
            console.error("Ambulance lookup error:", ambulanceError);
            return NextResponse.json(
                { error: "Invalid device token or ambulance not found" },
                { status: 403 }
            );
        }

        // Map severity to valid enum based on DB values (critical, moderate, etc.)
        // "high" caused an error, so we map it to "critical" or "moderate".
        // Existing DB values: critical, moderate.
        const severityMap: Record<string, string> = {
            "critical": "critical",
            "high": "critical", // Map high to critical as high is not in enum
            "medium": "moderate", // Map medium to moderate
            "moderate": "moderate",
            "low": "low", // Assuming low exists
            "minor": "low"
        };

        const triageLevel = severityMap[triageData.severity?.toLowerCase()] || "moderate"; // Default fallback

        const { data: emergencyData, error: emergencyError } = await supabase
            .from("emergencies")
            .insert({
                ambulance_id: ambulanceData.id,
                nurse_id: ambulanceData.assigned_nurse,
                patient_name: triageData.patient_name,
                patient_age: triageData.patient_age,
                gender: triageData.gender,
                symptoms: triageData.symptoms,
                ai_summary: triageData, // Keep this for backward compatibility or general summary
                ai_triage_agent_output: triageData, // Store specifically in the agent output column
                triage_level: triageLevel,
                status: 'initiated'
            })
            .select()
            .single();

        if (emergencyError) {
            console.error("Supabase insert error:", emergencyError);
            return NextResponse.json(
                { error: "Failed to save emergency record" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            ...triageData,
            emergency_id: emergencyData.id
        });

    } catch (error) {
        console.error("Error generating triage report:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: String(error) },
            { status: 500 }
        );
    }
}
