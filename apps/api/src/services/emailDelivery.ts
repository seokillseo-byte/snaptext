export interface OutboundEmail {
  to: string;
  subject: string;
  text: string;
}

export interface EmailSender {
  send(message: OutboundEmail): Promise<void>;
}

class MissingEmailSender implements EmailSender {
  async send(_message: OutboundEmail): Promise<void> {
    throw Object.assign(new Error("Email delivery is not configured."), {
      statusCode: 503,
      code: "EMAIL_DELIVERY_NOT_CONFIGURED"
    });
  }
}

let sender: EmailSender = new MissingEmailSender();

export function getEmailSender(): EmailSender {
  return sender;
}

/** Test seam; production code must configure a real sender adapter before registration/reset is enabled. */
export function setEmailSenderForTests(next: EmailSender): () => void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Test email sender cannot be configured in production.");
  }
  const previous = sender;
  sender = next;
  return () => { sender = previous; };
}
