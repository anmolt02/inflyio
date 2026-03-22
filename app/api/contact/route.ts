import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// ─── The inbox you want to receive contact form submissions ───────────────────
const TO_EMAIL   = "heyinflyio@gmail.com";
const FROM_EMAIL = "onboarding@resend.dev"; // ← keep this until hello@inflyio.com is verified in Resend

export async function POST(req: Request) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { error } = await resend.emails.send({
      from:    FROM_EMAIL,
      to:      TO_EMAIL,
      replyTo: email,
      subject: subject ? `[Inflyio] ${subject}` : `[Inflyio] New message from ${name}`,
      html: `
        <div style="font-family:monospace;max-width:560px;background:#07080C;color:#F1F5F9;padding:32px;border-radius:12px">
          <div style="font-size:18px;font-weight:700;margin-bottom:4px">New message — inflyio</div>
          <div style="font-size:12px;color:#64748B;margin-bottom:24px;border-bottom:1px solid #1E293B;padding-bottom:16px">
            Submitted via inflyio.com/contact
          </div>

          <table style="width:100%;font-size:13px;border-collapse:collapse">
            <tr>
              <td style="color:#64748B;padding:8px 0;width:100px">From</td>
              <td style="color:#F1F5F9">${name}</td>
            </tr>
            <tr>
              <td style="color:#64748B;padding:8px 0">Email</td>
              <td><a href="mailto:${email}" style="color:#60A5FA">${email}</a></td>
            </tr>
            <tr>
              <td style="color:#64748B;padding:8px 0">Subject</td>
              <td style="color:#F1F5F9">${subject || "Not specified"}</td>
            </tr>
          </table>

          <div style="margin-top:20px;padding:16px;background:#0D1117;border-radius:8px;border:1px solid #1E293B">
            <div style="font-size:11px;color:#64748B;letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px">Message</div>
            <div style="font-size:13px;color:#F1F5F9;line-height:1.8;white-space:pre-wrap">${message}</div>
          </div>

          <div style="margin-top:24px;font-size:11px;color:#334155">
            Reply directly to this email to respond to ${name}.
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("[contact] Resend error:", error);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    console.log("[contact] ✅ Email sent to", TO_EMAIL);
    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("[contact] Unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
