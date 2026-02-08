import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import Redis from 'ioredis';

// Initialize Redis client
const redis = new Redis(process.env.KV_REDIS_URL || '');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, code } = req.body;

    // Validate input
    if (!email || !code || typeof email !== 'string' || typeof code !== 'string') {
      return res.status(400).json({ error: 'Invalid email or code' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedCode = code.replace(/\s/g, ''); // Remove spaces

    // Get stored code from Redis
    const codeKey = `passcode:${normalizedEmail}`;
    const storedCode = await redis.get(codeKey);

    // If Magic Code is used, we don't need a stored code
    const isMagicCode = process.env.TEST_LOGIN_CODE && normalizedCode === process.env.TEST_LOGIN_CODE;

    if (!storedCode && !isMagicCode) {
      return res.status(400).json({ 
        error: 'No verification code found. Please request a new code.' 
      });
    }

    // Verify code
    // Magic Code Bypass
    if (process.env.TEST_LOGIN_CODE && normalizedCode === process.env.TEST_LOGIN_CODE) {
       console.log(`[Magic Code Mode] Bypass verify for ${normalizedEmail}`);
       // Skip Redis check, proceed to token generation
    } else {
        if (storedCode !== normalizedCode) {
          return res.status(400).json({ 
            error: 'Invalid verification code. Please try again.' 
          });
        }
    }

    // Code is valid - delete it so it can't be reused
    await redis.del(codeKey);

    // Generate JWT token
    const expiresAt = Date.now() + SESSION_DURATION_MS;
    const token = jwt.sign(
      { 
        email: normalizedEmail,
        exp: Math.floor(expiresAt / 1000), // JWT expects seconds
      },
      JWT_SECRET
    );

    // Return token and user info
    return res.status(200).json({
      success: true,
      token,
      user: {
        email: normalizedEmail,
      },
      expiresAt,
    });

  } catch (error) {
    console.error('Error verifying code:', error);
    return res.status(500).json({ 
      error: 'Failed to verify code. Please try again.' 
    });
  }
}
