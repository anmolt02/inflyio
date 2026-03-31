import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId || typeof userId !== "string")
      return NextResponse.json({ error: "userId is required." }, { status: 400 });

    // Basic UUID format check
    if (!/^[0-9a-f-]{36}$/.test(userId))
      return NextResponse.json({ error: "Invalid userId format." }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Delete creator records first (FK constraint)
    await supabase.from("creators").delete().eq("user_id", userId);

    // Delete the auth user
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete account." }, { status: 500 });
  }
}