import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "../../../../supabase/createAdmin";

export async function POST(request: Request) {
    try {
        const { emergencyId, doctorId } = await request.json();
        const supabase = createSupabaseAdminClient();

        const { error } = await supabase
            .from("emergencies")
            .update({ doctor_id: doctorId, status: "assigned" })
            .eq("id", emergencyId);

        if (error) {
            console.error("Supabase update error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Assign doctor error:", error);
        return NextResponse.json({ error: "Internal Server Error", details: String(error) }, { status: 500 });
    }
}
