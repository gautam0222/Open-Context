import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'onboarding@resend.dev';
const APP_NAME = 'Open Context';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

// Email templates
const getEmailTemplate = (type: string, data: any) => {
  const templates: Record<string, string> = {
    welcome: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
            .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to ${APP_NAME}!</h1>
            </div>
            <div class="content">
              <h2>Hi ${data.name}! 👋</h2>
              <p>Thank you for joining Open Context! We're excited to help you build your personal knowledge base.</p>
              
              <p><strong>Here's what you can do:</strong></p>
              <ul>
                <li>📚 Capture web content with our browser extension</li>
                <li>🔍 Search your knowledge with AI-powered semantic search</li>
                <li>🧠 Visualize connections in your concept graph</li>
                <li>💬 Chat with your documents using AI</li>
              </ul>

              <a href="${APP_URL}" class="button">Get Started →</a>

              <p>Need help? Reply to this email or visit our <a href="${APP_URL}/docs">documentation</a>.</p>
            </div>
            <div class="footer">
              <p>You're receiving this because you signed up for ${APP_NAME}</p>
              <p><a href="${APP_URL}/settings">Manage Preferences</a></p>
            </div>
          </div>
        </body>
      </html>
    `,

    workspace_invitation: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
            .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
            .workspace { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 You've been invited!</h1>
            </div>
            <div class="content">
              <h2>Hi there! 👋</h2>
              <p><strong>${data.inviterName}</strong> has invited you to join their workspace on ${APP_NAME}.</p>
              
              <div class="workspace">
                <h3>${data.workspaceName}</h3>
                <p>${data.workspaceDescription || 'A collaborative learning space'}</p>
                <p><strong>Role:</strong> ${data.role}</p>
              </div>

              <a href="${APP_URL}/workspaces/join/${data.inviteToken}" class="button">Accept Invitation →</a>

              <p>This invitation will expire in 7 days.</p>
            </div>
            <div class="footer">
              <p>Not interested? You can safely ignore this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,

    weekly_digest: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
            .stat { background: #f9fafb; padding: 15px; border-radius: 8px; margin: 10px 0; }
            .stat-value { font-size: 32px; font-weight: bold; color: #6366f1; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Your Weekly Progress</h1>
            </div>
            <div class="content">
              <h2>Hi ${data.name}! 👋</h2>
              <p>Here's what you accomplished this week:</p>
              
              <div class="stat">
                <div class="stat-value">${data.documentsAdded}</div>
                <p>Documents Captured</p>
              </div>

              <div class="stat">
                <div class="stat-value">${data.wordsRead}</div>
                <p>Words Read</p>
              </div>

              <div class="stat">
                <div class="stat-value">${data.achievementsUnlocked}</div>
                <p>Achievements Unlocked</p>
              </div>

              <p><strong>Keep up the great work!</strong> 🎉</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  return templates[type] || templates.welcome;
};

// Send email function
export async function sendEmail(options: any) {
  // In development, just log
  if (process.env.NODE_ENV === 'development') {
    console.log('📧 EMAIL WOULD BE SENT:', {
      to: options.to,
      subject: options.subject,
    });
    return { success: true, id: 'dev-mode' };
  }

  // In production, actually send
  try {
    const html = getEmailTemplate(options.template, options.data);
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: html,
    });
    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error('❌ Email error:', error);
    return { success: false, error };
  }
}

// Convenience functions
export async function sendWelcomeEmail(to: string, name: string) {
  return sendEmail({
    to,
    subject: `Welcome to ${APP_NAME}! 🎉`,
    template: 'welcome',
    data: { name },
  });
}

export async function sendWorkspaceInvitation(options: {
  to: string;
  inviterName: string;
  workspaceName: string;
  workspaceDescription?: string;
  role: string;
  inviteToken: string;
}) {
  return sendEmail({
    to: options.to,
    subject: `${options.inviterName} invited you to ${options.workspaceName}`,
    template: 'workspace_invitation',
    data: options,
  });
}

export async function sendWeeklyDigest(options: {
  to: string;
  name: string;
  documentsAdded: number;
  wordsRead: number;
  achievementsUnlocked: number;
}) {
  return sendEmail({
    to: options.to,
    subject: 'Your Weekly Learning Progress 📊',
    template: 'weekly_digest',
    data: options,
  });
}