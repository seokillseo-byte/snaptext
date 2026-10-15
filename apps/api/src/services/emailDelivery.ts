export interface OutboundEmail {
  to: string;
  subject: string;
  text: string;
}

export interface EmailSender {
  send(message: OutboundEmail): Promise<void>;
}

type FetchLike = typeof fetch;

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const REQUEST_TIMEOUT_MS = 8_000;

function deliveryError(message = "Email delivery is unavailable."): Error & { statusCode: number; code: string } {
  return Object.assign(new Error(message), {
    statusCode: 503,
    code: "EMAIL_DELIVERY_FAILED"
  });
}

class MissingEmailSender implements EmailSender {
  async send(_message: OutboundEmail): Promise<void> {
    throw Object.assign(new Error("Email delivery is not configured."), {
      statusCode: 503,
      code: "EMAIL_DELIVERY_NOT_CONFIGURED"
    });
  }
}

/**
 * Sends transactional email through Resend's HTTPS API.
 * API keys and provider response bodies are never included in errors or logs.
 */
export class ResendEmailSender implements EmailSender {
  constructor(
    private readonly apiKey: string,
    private readonly fromEmail: string,
    private readonly fetchImpl: FetchLike = fetch
  ) {
    if (!apiKey.trim() || !fromEmail.trim()) {
      throw new Error("Resend email configuration is incomplete.");
    }
  }

  async send(message: OutboundEmail): Promise<void> {
    let response: Response;
    try {
      response = await this.fetchImpl(RESEND_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: [message.to],
          subject: message.subject,
          text: message.text
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      });
    } catch {
      // Do not forward raw network errors; they can contain request details.
      throw deliveryError();
    }

    if (!response.ok) {
      // Do not include provider response bodies or credentials in the thrown error.
      throw deliveryError();
    }

    let result: unknown;
    try {
      result = await response.json();
    } catch {
      throw deliveryError();
    }
    if (!result || typeof result !== "object" || !("id" in result) || typeof result.id !== "string" || !result.id) {
      throw deliveryError();
    }
  }
}

let testSender: EmailSender | undefined;

export function getEmailSender(): EmailSender {
  if (testSender) return testSender;

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();
  if (!apiKey || !fromEmail) return new MissingEmailSender();

  return new ResendEmailSender(apiKey, fromEmail);
}

/** Test seam; test senders cannot be configured in production. */
export function setEmailSenderForTests(next: EmailSender): () => void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Test email sender cannot be configured in production.");
  }
  const previous = testSender;
  testSender = next;
  return () => { testSender = previous; };
}
