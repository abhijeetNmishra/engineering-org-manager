import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

// Share the same store with send-code (in production, use Redis or database)
const passcodeStore = new Map<string, { 
  code: string; 
  expiresAt: number; 
  attempts: number;
  lastAttempt: number;
}>();

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

    // Get stored code
    const stored = passcodeStore.get(normalizedEmail);

    if (!stored) {
      return res.status(400).json({ 
        error: 'No verification code found. Please request a new code.' 
      });
    }

    // Check if code expired
    if (Date.now() > stored.expiresAt) {
      passcodeStore.delete(normalizedEmail);
      return res.status(400).json({ 
        error: 'Verification code has expired. Please request a new code.' 
      });
    }

    // Verify code
    if (stored.code !== normalizedCode) {
      return res.status(400).json({ 
        error: 'Invalid verification code. Please try again.' 
      });
    }

    // Code is valid - delete it so it can't be reused
    passcodeStore.delete(normalizedEmail);

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
