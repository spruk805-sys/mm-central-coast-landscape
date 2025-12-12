import { NextRequest, NextResponse } from "next/server";

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  service?: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: ContactFormData = await request.json();

    // Validate required fields
    if (!data.name || !data.email || !data.message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      // Log for debugging but don't expose to client
      console.log("[Contact] Resend API key not configured - simulating success");
      // Return success anyway for demo purposes
      return NextResponse.json({
        success: true,
        message: "Message received (demo mode)",
      });
    }

    // Send email via Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "MM Central Coast Landscape <onboarding@resend.dev>",
        to: ["contact@mmcentralcoastlandscape.com"], // Update with real email
        reply_to: data.email,
        subject: `New Contact Form Submission from ${data.name}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Phone:</strong> ${data.phone || "Not provided"}</p>
          <p><strong>Service Interest:</strong> ${data.service || "Not specified"}</p>
          <hr />
          <h3>Message:</h3>
          <p>${data.message.replace(/\n/g, "<br>")}</p>
          <hr />
          <p style="color: #666; font-size: 12px;">
            This message was sent via the MM Central Coast Landscape website contact form.
          </p>
        `,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("[Contact] Resend API error:", errorData);
      return NextResponse.json(
        { error: "Failed to send message. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Message sent successfully!",
    });

  } catch (error) {
    console.error("[Contact] Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
