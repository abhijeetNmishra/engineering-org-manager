const API_BASE = import.meta.env.DEV ? 'http://localhost:5173' : '';

interface SendCodeResponse {
  success: boolean;
  message: string;
  expiresIn: number;
  error?: string;
}

interface VerifyCodeResponse {
  success: boolean;
  token: string;
  user: {
    email: string;
  };
  expiresAt: number;
  error?: string;
}

export async function sendVerificationCode(email: string): Promise<SendCodeResponse> {
  const response = await fetch(`${API_BASE}/api/send-code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to send code');
  }
  
  return data;
}

export async function verifyCode(email: string, code: string): Promise<VerifyCodeResponse> {
  const response = await fetch(`${API_BASE}/api/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, code }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to verify code');
  }
  
  return data;
}
