import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';
import Redis from 'ioredis';

// Initialize Redis client
const redis = new Redis(process.env.KV_REDIS_URL || '');

const resend = new Resend(process.env.RESEND_API_KEY);

// Parse ALLOWED_EMAILS: handles commas, semicolons, newlines, and removes optional quotes
const rawAllowed = process.env.ALLOWED_EMAILS || '';
const ALLOWED_EMAILS = rawAllowed
  .replace(/['"]/g, '') // Remove quotes
  .split(/[,\n;]+/)     // Split by common delimiters
  .map(e => e.trim().toLowerCase())
  .filter(e => e.length > 0); // Remove empty strings
const CODE_EXPIRY_SECONDS = 10 * 60; // 10 minutes
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_ATTEMPTS = 3;

// Generate secure 6-digit code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Check rate limiting
async function checkRateLimit(email: string): Promise<boolean> {
  const key = `rate_limit:${email}`;
  const stored = await redis.get(key);
  
  if (!stored) return true;

  const data = JSON.parse(stored);
  const now = Date.now();
  const timeSinceLastAttempt = now - data.lastAttempt;
  
  // Reset attempts if it's been more than an hour
  if (timeSinceLastAttempt > RATE_LIMIT_WINDOW_MS) {
    await redis.del(key);
    return true;
  }

  return data.attempts < MAX_ATTEMPTS;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email is in allowlist
    if (!ALLOWED_EMAILS.includes(normalizedEmail)) {
      return res.status(403).json({ 
        error: 'Email not authorized. Please contact an administrator for access.' 
      });
    }

    // Check rate limiting
    if (!(await checkRateLimit(normalizedEmail))) {
      return res.status(429).json({ 
        error: 'Too many attempts. Please try again in 1 hour.' 
      });
    }

    // Generate passcode
    const code = generateCode();

    // Store passcode in Redis with expiration
    const codeKey = `passcode:${normalizedEmail}`;
    await redis.setex(codeKey, CODE_EXPIRY_SECONDS, code);

    // Update rate limiting
    const rateLimitKey = `rate_limit:${normalizedEmail}`;
    const existing = await redis.get(rateLimitKey);
    const existingData = existing ? JSON.parse(existing) : null;
    
    await redis.setex(
      rateLimitKey,
      Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
      JSON.stringify({
        attempts: existingData ? existingData.attempts + 1 : 1,
        lastAttempt: Date.now(),
      })
    );

    // Send email via Resend
    await resend.emails.send({
      from: 'Org Manager <onboarding@resend.dev>', // Use your verified domain or resend sandbox
      to: normalizedEmail,
      subject: 'Your Org Manager Access Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              border-radius: 16px;
              padding: 40px;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 32px;
            }
            .logo {
              font-size: 24px;
              font-weight: 800;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              margin-bottom: 8px;
            }
            .subtitle {
              color: #666;
              font-size: 14px;
            }
            .code-box {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              font-size: 48px;
              font-weight: 800;
              letter-spacing: 12px;
              text-align: center;
              padding: 32px;
              border-radius: 12px;
              margin: 32px 0;
              font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
            }
            .info {
              text-align: center;
              color: #666;
              font-size: 14px;
              margin: 24px 0;
            }
            .warning {
              background: #FFF3CD;
              border-left: 4px solid #FFC107;
              padding: 16px;
              margin: 24px 0;
              border-radius: 4px;
              font-size: 14px;
            }
            .footer {
              text-align: center;
              color: #999;
              font-size: 12px;
              margin-top: 32px;
              padding-top: 24px;
              border-top: 1px solid #eee;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Shipt Marketplace</div>
              <div class="subtitle">Engineering Org Manager</div>
            </div>
            
            <h2 style="text-align: center; color: #333;">🔒 Your Access Code</h2>
            
            <div class="code-box">
              ${code.slice(0, 3)} ${code.slice(3)}
            </div>
            
            <div class="info">
              <strong>This code expires in 10 minutes</strong>
            </div>
            
            <div class="warning">
              ⚠️ <strong>Security Notice:</strong> Never share this code with anyone. 
              Our team will never ask for your verification code.
            </div>
            
            <p style="text-align: center; color: #666;">
              If you didn't request this code, please ignore this email.
            </p>
            
            <div class="footer">
              <p>Shipt Marketplace Engineering Org Manager</p>
              <p>Secure Access • Authorized Personnel Only</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return res.status(200).json({ 
      success: true,
      message: 'Verification code sent to your email',
      expiresIn: 600, // seconds
    });

  } catch (error) {
    console.error('Error sending code:', error);
    return res.status(500).json({ 
      error: 'Failed to send verification code. Please try again.' 
    });
  }
}
