import { useState, useEffect } from 'react';
import { Button, Input, message, Typography, Space } from 'antd';
import { MailOutlined, LockOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { PasscodeInput } from '../components/PasscodeInput';
import { sendVerificationCode, verifyCode } from '../utils/api';
import { useAuthStore } from '../state/authStore';

const { Title, Text } = Typography;

type Step = 'email' | 'code';

export function Login() {
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [expiresAt, setExpiresAt] = useState<number | null>(null);
    const [useLongCode, setUseLongCode] = useState(false);

    const login = useAuthStore(state => state.login);

    // Countdown timer for code expiration
    useEffect(() => {
        if (!expiresAt) return;

        const interval = setInterval(() => {
            const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
            setCountdown(remaining);

            if (remaining === 0) {
                message.warning('Verification code expired. Please request a new one.');
                setStep('email');
                setExpiresAt(null);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [expiresAt]);

    const handleSendCode = async () => {
        if (!email || !email.includes('@')) {
            message.error('Please enter a valid email address');
            return;
        }

        setLoading(true);
        try {
            const response = await sendVerificationCode(email);
            message.success(response.message);
            setStep('code');
            setExpiresAt(Date.now() + response.expiresIn * 1000);
        } catch (error: any) {
            message.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async (code: string) => {
        setLoading(true);
        try {
            const response = await verifyCode(email, code);
            message.success('Login successful!');
            login(response.token, response.user, response.expiresAt);
        } catch (error: any) {
            message.error(error.message);
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        setCountdown(0);
        setExpiresAt(null);
        await handleSendCode();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-primary)',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Background gradient effect */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: `
          radial-gradient(ellipse 800px 600px at 30% 20%, rgba(107, 33, 239, 0.15), transparent 70%),
          radial-gradient(ellipse 600px 500px at 80% 70%, rgba(255, 109, 90, 0.15), transparent 70%)
        `,
                pointerEvents: 'none',
            }} />

            <div className="glass" style={{
                maxWidth: '480px',
                width: '100%',
                padding: '48px 40px',
                borderRadius: '16px',
                position: 'relative',
                zIndex: 1,
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <Title level={2} style={{
                        background: 'linear-gradient(135deg, #6B21EF 0%, #FF6D5A 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        marginBottom: '8px',
                        fontWeight: 800,
                    }}>
                        Shipt Marketplace
                    </Title>
                    <Text style={{
                        color: 'var(--text-muted)',
                        fontSize: '14px',
                        display: 'block',
                        marginBottom: '4px',
                    }}>
                        Engineering Org Manager
                    </Text>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: '20px',
                        marginTop: '12px',
                    }}>
                        <LockOutlined style={{ fontSize: '12px', color: 'var(--text-accent)' }} />
                        <Text style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            Secure Access • Authorized Only
                        </Text>
                    </div>
                </div>

                {/* Email Step */}
                {step === 'email' && (
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <div>
                            <Text style={{
                                color: 'var(--text-secondary)',
                                fontSize: '15px',
                                display: 'block',
                                marginBottom: '12px',
                                fontWeight: 600,
                            }}>
                                Enter your email address
                            </Text>
                            <Input
                                size="large"
                                prefix={<MailOutlined style={{ color: 'var(--text-muted)' }} />}
                                placeholder="your.email@example.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                onPressEnter={handleSendCode}
                                disabled={loading}
                                style={{
                                    height: '52px',
                                    borderRadius: '8px',
                                    fontSize: '15px',
                                }}
                            />
                        </div>

                        <Button
                            type="primary"
                            size="large"
                            block
                            onClick={handleSendCode}
                            loading={loading}
                            icon={<ArrowRightOutlined />}
                            style={{
                                height: '52px',
                                borderRadius: '8px',
                                fontSize: '15px',
                                fontWeight: 600,
                            }}
                        >
                            Send Verification Code
                        </Button>

                        <div style={{
                            textAlign: 'center',
                            padding: '16px',
                            background: 'var(--bg-tertiary)',
                            borderRadius: '8px',
                        }}>
                            <Text style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                🔒 We'll send you a secure 6-digit code
                            </Text>
                        </div>
                    </Space>
                )}

                {/* Code Step */}
                {step === 'code' && (
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <div style={{ textAlign: 'center' }}>
                            <Text style={{
                                color: 'var(--text-secondary)',
                                fontSize: '16px',
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: 600,
                            }}>
                                Enter Verification Code
                            </Text>
                            <Text style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                                Sent to: <strong>{email}</strong>
                            </Text>
                            <Button
                                type="link"
                                size="small"
                                onClick={() => setStep('email')}
                                style={{ fontSize: '12px', padding: 0 }}
                            >
                                Change email
                            </Button>
                        </div>

                        <div style={{ margin: '24px 0' }}>
                            {useLongCode ? (
                                <Input
                                    size="large"
                                    placeholder="Enter your magic code"
                                    prefix={<LockOutlined style={{ color: 'var(--text-muted)' }} />}
                                    onChange={(e) => {
                                        if (e.target.value.length > 0) handleVerifyCode(e.target.value);
                                    }}
                                    onPressEnter={(e) => handleVerifyCode((e.target as HTMLInputElement).value)}
                                    style={{
                                        height: '52px',
                                        borderRadius: '8px',
                                        fontSize: '18px',
                                        textAlign: 'center',
                                        letterSpacing: '2px',
                                        fontFamily: 'monospace'
                                    }}
                                />
                            ) : (
                                <PasscodeInput
                                    onComplete={handleVerifyCode}
                                    loading={loading}
                                />
                            )}
                        </div>

                        <div style={{ textAlign: 'center', marginBottom: 16 }}>
                            <Button
                                type="link"
                                size="small"
                                onClick={() => setUseLongCode(!useLongCode)}
                                style={{ color: 'var(--text-muted)' }}
                            >
                                {useLongCode ? 'Switch to 6-digit input' : 'Have a longer magic code?'}
                            </Button>
                        </div>

                        {countdown > 0 && (
                            <div style={{
                                textAlign: 'center',
                                padding: '12px',
                                background: 'var(--bg-tertiary)',
                                borderRadius: '8px',
                            }}>
                                <Text style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                                    Code expires in: <strong style={{ color: 'var(--text-accent)' }}>
                                        {formatTime(countdown)}
                                    </strong>
                                </Text>
                            </div>
                        )}

                        <div style={{ textAlign: 'center' }}>
                            <Text style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                                Didn't receive the code?
                            </Text>
                            <br />
                            <Button
                                type="link"
                                onClick={handleResendCode}
                                disabled={loading || countdown > 540} // Allow resend after 1 min
                                style={{ fontSize: '14px', fontWeight: 600 }}
                            >
                                Resend Code
                            </Button>
                        </div>
                    </Space>
                )}
            </div>
        </div>
    );
}
