import { getEmailSender } from "../services/emailDelivery.js";

async function main(): Promise<void> {
  const recipient = process.env.RESEND_TEST_TO_EMAIL?.trim();
  if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    process.stderr.write("Set RESEND_TEST_TO_EMAIL to a controlled test inbox. No email was sent.\n");
    process.exitCode = 2;
    return;
  }
  if (!process.env.RESEND_API_KEY?.trim() || !process.env.RESEND_FROM_EMAIL?.trim()) {
    process.stderr.write("Resend is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL in the API runtime environment. No email was sent.\n");
    process.exitCode = 2;
    return;
  }

  try {
    await getEmailSender().send({
      to: recipient,
      subject: "SnapText Resend delivery smoke test",
      text: "This is a SnapText transactional-email delivery smoke test. No account token or password-reset link is included. If you received this message, the Resend API accepted the test email."
    });
    process.stdout.write("Resend accepted the smoke-test email. Check the controlled inbox and Resend delivery logs. This does not replace registration/password-reset end-to-end tests.\n");
  } catch {
    process.stderr.write("Resend smoke test failed. Check the API key, verified sender domain, recipient restrictions, and Resend dashboard. Sensitive provider details were intentionally not printed.\n");
    process.exitCode = 1;
  }
}

await main();
