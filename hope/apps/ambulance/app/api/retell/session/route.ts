import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const deviceToken = request.headers.get("device_token");

        if (!deviceToken) {
            console.error("Missing device_token header");
            return NextResponse.json(
                { error: "Missing device_token header" },
                { status: 401 }
            );
        }

        const apiKey = process.env.RETELL_API_KEY || process.env.NEXT_PUBLIC_RETELL_API_KEY;
        const agentId = process.env.HOPE_TRIAGE_AGENT_ID || process.env.NEXT_PUBLIC_HOPE_TRIAGE_AGENT_ID;

        console.log("Retell Config Check:", {
            hasApiKey: !!apiKey,
            hasAgentId: !!agentId,
            agentId: agentId
        });

        if (!apiKey || !agentId) {
            console.error("Missing API keys");
            return NextResponse.json(
                { error: "Server configuration error: Missing API keys" },
                { status: 500 }
            );
        }

        // Call Retell API to create a web call
        console.log("Calling Retell API...");
        const response = await fetch(
            "https://api.retellai.com/v1/public/web-call",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    agent_id: agentId,
                }),
            }
        );

        const responseBody = await response.text();
        console.log("Retell API Response Status:", response.status);
        console.log("Retell API Response Body:", responseBody);

        if (!response.ok) {
            return NextResponse.json(
                { error: "Failed to create Retell session", details: responseBody },
                { status: response.status }
            );
        }

        let data;
        try {
            data = JSON.parse(responseBody);
        } catch (e) {
            console.error("Failed to parse Retell response as JSON:", e);
            return NextResponse.json(
                { error: "Invalid JSON response from Retell", details: responseBody },
                { status: 500 }
            );
        }

        console.log("Retell Session Created:", data);

        return NextResponse.json({
            access_token: data.access_token, // Retell returns access_token for web client
        });
    } catch (error) {
        console.error("Error creating Retell session:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: String(error) },
            { status: 500 }
        );
    }
}
