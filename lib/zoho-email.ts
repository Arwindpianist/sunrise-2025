import nodemailer from 'nodemailer'

interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

// Create Zoho SMTP transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.ZOHO_SMTP_HOST || 'smtp.zoho.com',
    port: parseInt(process.env.ZOHO_SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.ZOHO_EMAIL_USER!,
      pass: process.env.ZOHO_EMAIL_PASSWORD!,
    },
  })
}

// Send email using Zoho
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transporter = createTransporter()
    
    const mailOptions = {
      from: options.from || process.env.ZOHO_EMAIL_USER!,
      to: options.to,
      subject: options.subject,
      html: options.html,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent successfully:', info.messageId)
    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

// Email templates
export const emailTemplates = {
  subscriptionConfirmation: (userName: string, tier: string, amount: number) => ({
    subject: `Welcome to Sunrise! Your ${tier} subscription is active`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Welcome to Sunrise! 🌅</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Your subscription is now active</p>
        </div>
        
        <div style="padding: 30px; background: white;">
          <h2 style="color: #333; margin-bottom: 20px;">Hi ${userName},</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Thank you for subscribing to Sunrise! Your <strong>${tier}</strong> subscription has been successfully activated.
          </p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin: 0 0 15px 0;">Subscription Details</h3>
            <p style="margin: 5px 0; color: #666;">
              <strong>Plan:</strong> ${tier.charAt(0).toUpperCase() + tier.slice(1)}
            </p>
            <p style="margin: 5px 0; color: #666;">
              <strong>Amount:</strong> RM${amount.toFixed(2)}
            </p>
            <p style="margin: 5px 0; color: #666;">
              <strong>Status:</strong> Active
            </p>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            You now have access to all the features included in your ${tier} plan. Start creating amazing events and connecting with your contacts!
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
              Go to Dashboard
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            If you have any questions or need assistance, please don't hesitate to contact our support team.
          </p>
          
          <p style="color: #666; line-height: 1.6;">
            Best regards,<br>
            The Sunrise Team
          </p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 0;">
            This email was sent to you because you subscribed to Sunrise.<br>
            If you have any questions, please contact us at support@sunrise-2025.com
          </p>
        </div>
      </div>
    `
  }),

  tokenLimitWarning: (userName: string, currentTier: string, currentBalance: number, limit: number) => ({
    subject: `Token Limit Warning - Consider Upgrading to Pro`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Token Limit Warning ⚠️</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">You're approaching your token limit</p>
        </div>
        
        <div style="padding: 30px; background: white;">
          <h2 style="color: #333; margin-bottom: 20px;">Hi ${userName},</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            We noticed you're approaching your token limit on your <strong>${currentTier}</strong> plan.
          </p>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #856404; margin: 0 0 15px 0;">Current Status</h3>
            <p style="margin: 5px 0; color: #856404;">
              <strong>Current Balance:</strong> ${currentBalance} tokens
            </p>
            <p style="margin: 5px 0; color: #856404;">
              <strong>Your Limit:</strong> ${limit} tokens
            </p>
            <p style="margin: 5px 0; color: #856404;">
              <strong>Remaining:</strong> ${limit - currentBalance} tokens
            </p>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            To continue sending messages without interruption, consider upgrading to our <strong>Pro</strong> plan which includes unlimited tokens!
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/pricing" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
              Upgrade to Pro
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            Best regards,<br>
            The Sunrise Team
          </p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 0;">
            This email was sent to you because you're approaching your token limit.<br>
            If you have any questions, please contact us at support@sunrise-2025.com
          </p>
        </div>
      </div>
    `
  }),

  monthlyTokenCredit: (userName: string, tier: string, tokensCredited: number, newBalance: number) => ({
    subject: `Your monthly tokens have been credited!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #00b894 0%, #00a085 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Monthly Tokens Credited! 🎉</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Your ${tier} plan tokens are ready</p>
        </div>
        
        <div style="padding: 30px; background: white;">
          <h2 style="color: #333; margin-bottom: 20px;">Hi ${userName},</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Great news! Your monthly token allocation has been credited to your account.
          </p>
          
          <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #155724; margin: 0 0 15px 0;">Token Credit Summary</h3>
            <p style="margin: 5px 0; color: #155724;">
              <strong>Plan:</strong> ${tier.charAt(0).toUpperCase() + tier.slice(1)}
            </p>
            <p style="margin: 5px 0; color: #155724;">
              <strong>Tokens Credited:</strong> ${tokensCredited} tokens
            </p>
            <p style="margin: 5px 0; color: #155724;">
              <strong>New Balance:</strong> ${newBalance} tokens
            </p>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            You're all set to continue creating amazing events and connecting with your contacts!
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
              Go to Dashboard
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            Best regards,<br>
            The Sunrise Team
          </p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 0;">
            This email was sent to you because your monthly tokens were credited.<br>
            If you have any questions, please contact us at support@sunrise-2025.com
          </p>
        </div>
      </div>
    `
  })
}

// Send subscription confirmation email
export async function sendSubscriptionConfirmation(
  userEmail: string, 
  userName: string, 
  tier: string, 
  amount: number
): Promise<boolean> {
  const template = emailTemplates.subscriptionConfirmation(userName, tier, amount)
  return await sendEmail({
    to: userEmail,
    subject: template.subject,
    html: template.html
  })
}

// Send token limit warning email
export async function sendTokenLimitWarning(
  userEmail: string,
  userName: string,
  currentTier: string,
  currentBalance: number,
  limit: number
): Promise<boolean> {
  const template = emailTemplates.tokenLimitWarning(userName, currentTier, currentBalance, limit)
  return await sendEmail({
    to: userEmail,
    subject: template.subject,
    html: template.html
  })
}

// Send monthly token credit email
export async function sendMonthlyTokenCredit(
  userEmail: string,
  userName: string,
  tier: string,
  tokensCredited: number,
  newBalance: number
): Promise<boolean> {
  const template = emailTemplates.monthlyTokenCredit(userName, tier, tokensCredited, newBalance)
  return await sendEmail({
    to: userEmail,
    subject: template.subject,
    html: template.html
  })
} 