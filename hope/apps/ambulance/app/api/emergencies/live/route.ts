import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "../../../../supabase/createAdmin";

const DAILY_API_URL = "https://api.daily.co/v1/rooms";

export async function POST(request: Request) {
  try {
    const deviceToken = request.headers.get("device_token");
    const { emergency_id } = await request.json();

    if (!emergency_id) {
      return NextResponse.json(
        { error: "Missing emergency_id" },
        { status: 400 }
      );
    }

    const dailyApiKey = process.env.DAILY_API_KEY;
    if (!dailyApiKey) {
      return NextResponse.json(
        { error: "Missing DAILY_API_KEY server configuration" },
        { status: 500 }
      );
    }

    const supabase = createSupabaseAdminClient();

    // Optional: verify this ambulance owns the emergency via device_token
    if (deviceToken) {
      const { data: ambulance, error: ambulanceError } = await supabase
        .from("ambulances")
        .select("id")
        .eq("device_token", deviceToken)
        .single();

      if (ambulanceError || !ambulance) {
        return NextResponse.json(
          { error: "Invalid device token" },
          { status: 403 }
        );
      }

      const { data: ownedEmergency, error: ownedError } = await supabase
        .from("emergencies")
        .select("id")
        .eq("id", emergency_id)
        .eq("ambulance_id", ambulance.id)
        .single();

      if (ownedError || !ownedEmergency) {
        return NextResponse.json(
          { error: "Emergency does not belong to this ambulance" },
          { status: 403 }
        );
      }
    }

    // Fetch emergency + doctor
    const { data: emergency, error: emergencyError } = await supabase
      .from("emergencies")
      .select("id, doctor_id, video_room_url, ai_summary, patient_name, triage_level")
      .eq("id", emergency_id)
      .single();

    if (emergencyError || !emergency) {
      return NextResponse.json(
        { error: "Emergency not found" },
        { status: 404 }
      );
    }

    if (!emergency.doctor_id) {
      return NextResponse.json(
        { error: "Doctor not yet assigned. Please wait a moment and try again." },
        { status: 409 }
      );
    }

    // Reuse existing room if already created
    if (emergency.video_room_url) {
      return NextResponse.json({ video_room_url: emergency.video_room_url });
    }

    // Create Daily.co room
    const expiresAt = Math.round(Date.now() / 1000) + 60 * 60; // 1 hour
    const roomName = `emergency-${emergency_id}`;

    const dailyResp = await fetch(DAILY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${dailyApiKey}`,
      },
      body: JSON.stringify({
        name: roomName,
        properties: {
          exp: expiresAt,
          enable_screenshare: true,
          enable_chat: true,
          start_video_off: false,
          start_audio_off: false,
        },
      }),
    });

    if (!dailyResp.ok) {
      const text = await dailyResp.text();
      console.error("Daily.co error:", text);
      return NextResponse.json(
        { error: "Failed to create video room" },
        { status: 500 }
      );
    }

    const dailyData = (await dailyResp.json()) as { url?: string };
    const videoUrl = dailyData.url;

    if (!videoUrl) {
      return NextResponse.json(
        { error: "Daily.co did not return a room URL" },
        { status: 500 }
      );
    }

    // Persist room URL on emergency
    const { error: updateError } = await supabase
      .from("emergencies")
      .update({
        video_room_url: videoUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", emergency_id);

    if (updateError) {
      console.error("Failed to update emergency with room URL:", updateError);
    }

    // Create notification for the assigned doctor
    const summary =
      (emergency.ai_summary as any)?.summary ??
      (emergency.ai_summary as any)?.ai_triage_agent_output?.summary ??
      null;

    await supabase.from("notifications").insert({
      receiver_id: emergency.doctor_id,
      title: "Live ambulance call requested",
      message:
        summary ||
        `A new emergency case (ID: ${emergency_id}) is requesting a live consult.`,
      type: "video_call",
    });

    return NextResponse.json({ video_room_url: videoUrl });
  } catch (error) {
    console.error("Live connect error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: String(error) },
      { status: 500 }
    );
  }
}


