import axios from "axios";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const fromEmail = process.env.RESEND_FROM_EMAIL || "alerts@crondash.com";

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

  // Send webhook notification if URL is configured
  if (user.webhookUrl) {
    await sendWebhookAlert(user.webhookUrl, payload);
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

  const subject = status === "success"
    ? `[CronDash] Job "${jobName}" Succeeded`
    : `[CronDash] Job "${jobName}" Failed`;

  const body = [
    "CronDash Job Alert",
    "==================",
    "",
    `Job: ${jobName}`,
    `Status: ${status.toUpperCase()}`,
    `Status Code: ${statusCode || "N/A"}`,
    `Duration: ${duration}ms`,
    `Executed At: ${executedAt.toISOString()}`,
    ...(error ? ["", "Error:", error] : []),
    "",
    "--",
    "CronDash - Visual Cron Job Manager",
  ].join("\n");

  const resend = getResend();
  if (!resend) {
    console.log(`[ALERTS] Email alert for ${email}:`, { subject, body });
    return;
  }

  try {
    const { error: sendError } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject,
      text: body,
    });

    if (sendError) {
      console.error(`[ALERTS] Resend error for job ${jobName}:`, sendError);
    } else {
      console.log(`[ALERTS] Email sent to ${email} for job ${jobName}`);
    }
  } catch (err: any) {
    console.error(`[ALERTS] Failed to send email for job ${jobName}:`, err.message);
  }
}

async function sendWebhookAlert(webhookUrl: string, payload: AlertPayload) {
  const { jobName, status, statusCode, error, duration, executedAt } = payload;

  try {
    await axios.post(webhookUrl, {
      event: "job_alert",
      job: jobName,
      status,
      statusCode: statusCode || null,
      error: error || null,
      duration,
      executedAt: executedAt.toISOString(),
      timestamp: new Date().toISOString(),
    });
    console.log(`[ALERTS] Webhook sent to ${webhookUrl} for job ${jobName}`);
  } catch (err: any) {
    console.error(`[ALERTS] Failed to send webhook for job ${jobName}:`, err.message);
  }
}

// Helper function to check if alerts should be sent
export function shouldSendAlert(status: string, userAlertEnabled: boolean = true): boolean {
  // Send alerts only on failure (configurable in future)
  return status === "failed" && userAlertEnabled;
}