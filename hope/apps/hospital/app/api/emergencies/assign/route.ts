import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
    try {
        const { emergencyId, doctorId } = await request.json();
        const supabase = createSupabaseAdminClient();

        const { error } = await supabase
            .from("emergencies")
            .update({ doctor_id: doctorId, status: "assigned" })
            .eq("id", emergencyId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
