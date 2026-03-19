import { createTransport, type Transporter } from "nodemailer";
import { config } from "../config.js";

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface EmailProvider {
  send(to: string, subject: string, html: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Mailpit (local dev) — sends to SMTP on localhost:1025
// ---------------------------------------------------------------------------

class MailpitProvider implements EmailProvider {
  private transport: Transporter;

  constructor() {
    this.transport = createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: false,
    });
  }

  async send(to: string, subject: string, html: string): Promise<void> {
    await this.transport.sendMail({
      from: config.emailFrom,
      to,
      subject,
      html,
    });
  }
}

// ---------------------------------------------------------------------------
// Resend (production) — uses Resend HTTP API
// ---------------------------------------------------------------------------

class ResendProvider implements EmailProvider {
  private apiKey: string;

  constructor() {
    if (!config.resendApiKey) {
      throw new Error("RESEND_API_KEY is required when EMAIL_PROVIDER=resend");
    }
    this.apiKey = config.resendApiKey;
  }

  async send(to: string, subject: string, html: string): Promise<void> {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.emailFrom,
        to: [to],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Resend API error (${res.status}): ${body}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

let instance: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (!instance) {
    instance =
      config.emailProvider === "resend"
        ? new ResendProvider()
        : new MailpitProvider();
  }
  return instance;
}
