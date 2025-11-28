import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/supabase/createAdmin";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { ambulance_number } = body || {};

        if (!ambulance_number) {
            return NextResponse.json({ error: "Ambulance number required" }, { status: 400 });
        }

        const supabase = createSupabaseAdminClient();

        // Generate token
        const token = crypto.randomUUID().replace(/-/g, "");

        // Update & check existence
        const { data, error } = await supabase
            .from("ambulances")
            .update({ device_token: token })
            .eq("ambulance_number", ambulance_number)
            .select("device_token")
            .maybeSingle(); // ⚠️ FIX

        if (error) {
            console.error("DB Error:", error);
            return NextResponse.json({ error: "Database issue" }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json({ error: "Invalid ambulance number" }, { status: 404 });
        }

        return NextResponse.json({ device_token: data.device_token });

    } catch (err) {
        console.error("CRASH ERROR:", err);
        return NextResponse.json({ error: "Invalid request body" }, { status: 500 });
    }
}
