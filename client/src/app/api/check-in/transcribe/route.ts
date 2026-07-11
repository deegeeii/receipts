// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { openai } from "@/lib/openai/client";
import { NextRequest, NextResponse } from "next/server";

// ── HANDLER ───────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const formData = await request.formData();
  const audioFile = formData.get("audio") as File | null;

  if (!audioFile || audioFile.size === 0) {
    return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
  }

  // Read once — reuse buffer for both storage and transcription
  const arrayBuffer = await audioFile.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mimeType = audioFile.type || "audio/webm";
  const ext = mimeType.includes("mp4") ? "mp4" : mimeType.includes("ogg") ? "ogg" : "webm";
  const filePath = `${user.id}/${Date.now()}.${ext}`;

  // Upload to Supabase Storage (non-blocking — transcription still runs if this fails)
  const { error: storageError } = await supabaseAdmin.storage
    .from("voice-memos")
    .upload(filePath, buffer, { contentType: mimeType });

  if (storageError) {
    console.error("transcribe: storage upload failed", storageError);
  }

  // Transcribe via Whisper — create a new File from buffer so it's fresh
  const whisperFile = new File([buffer], `audio.${ext}`, { type: mimeType });

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: whisperFile,
      model: "whisper-1",
    });

    return NextResponse.json({ transcript: transcription.text });
  } catch (whisperError) {
    console.error("transcribe: whisper failed", whisperError);
    return NextResponse.json(
      { error: "Transcription failed", details: String(whisperError) },
      { status: 502 }
    );
  }
}
