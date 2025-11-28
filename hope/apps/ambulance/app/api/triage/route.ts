import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
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

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: "Server configuration error: Missing Gemini API key" },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
        "severity": "critical" | "high" | "medium" | "low",
        "suggested_actions": ["List of 3-5 concise actions for the paramedic"]
      }
    `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Clean up markdown code blocks if present
        const cleanedJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

        let triageData;
        try {
            triageData = JSON.parse(cleanedJson);
        } catch (e) {
            console.error("Failed to parse Gemini response:", responseText);
            return NextResponse.json(
                { error: "Failed to generate valid triage report" },
                { status: 500 }
            );
        }

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

        const { data: emergencyData, error: emergencyError } = await supabase
            .from("emergencies")
            .insert({
                ambulance_id: ambulanceData.id,
                nurse_id: ambulanceData.assigned_nurse, // Assuming the nurse assigned to the ambulance is handling this
                patient_name: triageData.patient_name,
                patient_age: triageData.patient_age,
                gender: triageData.gender,
                symptoms: triageData.symptoms,
                ai_summary: triageData, // Store full AI output
                triage_level: triageData.severity,
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
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
