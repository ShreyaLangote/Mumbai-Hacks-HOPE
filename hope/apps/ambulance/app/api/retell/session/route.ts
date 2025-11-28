import { NextResponse } from "next/server";
import Retell from "retell-sdk";

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

        const client = new Retell({ apiKey: apiKey });

        console.log("Creating Retell web call...");
        const callResp = await client.call.createWebCall({
            agent_id: agentId,
        });

        console.log("Retell Session Created:", callResp);

        return NextResponse.json({
            access_token: callResp.access_token,
        });

    } catch (error) {
        console.error("Error creating Retell session:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: String(error) },
            { status: 500 }
        );
    }
}
