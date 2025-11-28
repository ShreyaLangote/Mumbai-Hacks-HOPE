import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

export async function GET() {
    try {
        const supabase = createSupabaseAdminClient();

        const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("role", "doctor");

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
