import axios from "axios";
import { prisma } from "@/lib/prisma";

export interface AlertPayload {
  jobId: string;
  jobName: string;
  status: "success" | "failed";
  statusCode?: number;
  error?: string;
  duration: number;
  executedAt: Date;
}

export async function sendAlerts(jobId: string, payload: AlertPayload) {
  // Get job with user info (to access alert settings)
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { user: true },
  });

  if (!job) return;

  const { user } = job;

  // Send Slack notification if webhook is configured
  if (user.slackWebhook) {
    await sendSlackAlert(user.slackWebhook, payload);
  }

  // Send email notification if email is configured
  if (user.alertEmail) {
    await sendEmailAlert(user.alertEmail, payload);
  }
}

async function sendSlackAlert(webhookUrl: string, payload: AlertPayload) {
  const { jobName, status, statusCode, error, duration } = payload;

  // Determine color based on status
  const color = status === "success" ? "#36a64f" : "#ff0000";

  // Build Slack message
  const slackMessage = {
    attachments: [
      {
        color,
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: status === "success" ? "✅ Job Succeeded" : "❌ Job Failed",
            },
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*Job Name:*\n${jobName}`,
              },
              {
                type: "mrkdwn",
                text: `*Status:*\n${status.toUpperCase()}`,
              },
              {
                type: "mrkdwn",
                text: `*Status Code:*\n${statusCode || "N/A"}`,
              },
              {
                type: "mrkdwn",
                text: `*Duration:*\n${duration}ms`,
              },
            ],
          },
          ...(error
            ? [
                {
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text: `*Error:*\n\`\`\`${error}\`\`\``,
                  },
                },
              ]
            : []),
        ],
      },
    ],
  };

  try {
    await axios.post(webhookUrl, slackMessage);
    console.log(`[ALERTS] Slack notification sent for job ${jobName}`);
  } catch (error: any) {
    console.error(`[ALERTS] Failed to send Slack notification:`, error.message);
  }
}

async function sendEmailAlert(email: string, payload: AlertPayload) {
  const { jobName, status, statusCode, error, duration, executedAt } = payload;

  // In a production environment, you would use a service like:
  // - SendGrid
  // - Resend
  // - AWS SES
  // - Nodemailer (with SMTP)
  //
  // For now, we'll log the email details.
  // To enable email sending, set up one of the above services and replace this implementation.

  const subject = status === "success"
    ? `[CronDash] ✅ Job "${jobName}" Succeeded`
    : `[CronDash] ❌ Job "${jobName}" Failed`;

  const body = `
CronDash Job Alert
==================

Job: ${jobName}
Status: ${status.toUpperCase()}
Status Code: ${statusCode || "N/A"}
Duration: ${duration}ms
Executed At: ${executedAt.toISOString()}
${error ? `\nError:\n${error}` : ""}

--
CronDash - Visual Cron Job Manager
  `.trim();

  // Log the email (implement actual sending with your preferred email service)
  console.log(`[ALERTS] Email alert for ${email}:`, {
    subject,
    body,
  });

  // TODO: Implement actual email sending
  // Example with Resend:
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: 'alerts@crondash.com',
  //   to: email,
  //   subject,
  //   text: body,
  // });
}

// Helper function to check if alerts should be sent
export function shouldSendAlert(status: string, userAlertEnabled: boolean = true): boolean {
  // Send alerts only on failure (configurable in future)
  return status === "failed" && userAlertEnabled;
}