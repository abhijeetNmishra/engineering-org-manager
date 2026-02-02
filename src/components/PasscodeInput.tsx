import { useState, useRef, type KeyboardEvent } from 'react';
import { Input } from 'antd';

interface PasscodeInputProps {
    length?: number;
    onComplete: (code: string) => void;
    loading?: boolean;
}

export function PasscodeInput({
    length = 6,
    onComplete,
    loading = false
}: PasscodeInputProps) {
    const [digits, setDigits] = useState<string[]>(Array(length).fill(''));
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleChange = (index: number, value: string) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return;

        const newDigits = [...digits];
        newDigits[index] = value;
        setDigits(newDigits);

        // Auto-focus next input
        if (value && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit if all digits filled
        if (newDigits.every(d => d) && !loading) {
            onComplete(newDigits.join(''));
        }
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        // Handle backspace - move to previous input
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }

        // Handle paste
        if (e.key === 'v' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            navigator.clipboard.readText().then(text => {
                const pastedDigits = text.replace(/\D/g, '').slice(0, length).split('');
                const newDigits = [...digits];
                pastedDigits.forEach((digit, i) => {
                    if (i < length) newDigits[i] = digit;
                });
                setDigits(newDigits);

                // Focus last filled input or first empty
                const lastFilledIndex = Math.min(pastedDigits.length - 1, length - 1);
                inputRefs.current[lastFilledIndex]?.focus();

                // Auto-submit if complete
                if (newDigits.every(d => d)) {
                    onComplete(newDigits.join(''));
                }
            });
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text');
        const pastedDigits = pastedText.replace(/\D/g, '').slice(0, length).split('');

        const newDigits = [...digits];
        pastedDigits.forEach((digit, i) => {
            if (i < length) newDigits[i] = digit;
        });
        setDigits(newDigits);

        // Auto-submit if complete
        if (newDigits.every(d => d)) {
            onComplete(newDigits.join(''));
        }
    };

    return (
        <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            maxWidth: '400px',
            margin: '0 auto',
        }}>
            {digits.map((digit, index) => (
                <Input
                    key={index}
                    ref={el => { inputRefs.current[index] = el?.input || null; }}
                    value={digit}
                    onChange={e => handleChange(index, e.target.value)}
                    onKeyDown={e => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    maxLength={1}
                    disabled={loading}
                    variant="outlined"
                    style={{
                        width: '48px',
                        height: '58px',
                        fontSize: '28px',
                        fontWeight: '700',
                        textAlign: 'center' as const,
                        fontFamily: 'SF Mono, Monaco, Courier New, monospace',
                        borderRadius: '8px',
                        border: digit ? '2px solid #6B21EF !important' : '1px solid rgba(255, 255, 255, 0.2) !important',
                        background: 'rgba(255, 255, 255, 0.05) !important',
                        color: 'var(--text-primary)',
                        transition: 'all 0.2s ease',
                    }}
                    onFocus={e => e.target.select()}
                />
            ))}
        </div>
    );
}
