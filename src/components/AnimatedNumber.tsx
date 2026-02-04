import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface AnimatedNumberProps {
    value: number;
    duration?: number;
    className?: string;
    format?: (value: number) => string;
}

/**
 * AnimatedNumber - A component that animates counting up/down to a target number
 */
export function AnimatedNumber({
    value,
    duration = 800,
    className,
    format = (v) => Math.round(v).toLocaleString(),
}: AnimatedNumberProps) {
    const spring = useSpring(0, {
        duration: duration,
        bounce: 0,
    });

    const display = useTransform(spring, (current) => format(current));
    const [displayValue, setDisplayValue] = useState(format(0));

    useEffect(() => {
        spring.set(value);
    }, [spring, value]);

    useEffect(() => {
        const unsubscribe = display.on("change", (v) => {
            setDisplayValue(v);
        });
        return unsubscribe;
    }, [display]);

    return (
        <motion.span className={className} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {displayValue}
        </motion.span>
    );
}

interface AnimatedCounterProps {
    value: number;
    label: string;
    icon?: React.ReactNode;
    color?: string;
    size?: "small" | "medium" | "large";
}

/**
 * AnimatedCounter - A counter with animated number and label
 */
export function AnimatedCounter({
    value,
    label,
    icon,
    color = "var(--text-primary)",
    size = "medium",
}: AnimatedCounterProps) {
    const sizes = {
        small: { number: 24, label: 11 },
        medium: { number: 36, label: 12 },
        large: { number: 48, label: 14 },
    };

    const { number: numberSize, label: labelSize } = sizes[size];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
            }}
        >
            {icon && (
                <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 500 }}
                    style={{ color, fontSize: numberSize * 0.6 }}
                >
                    {icon}
                </motion.span>
            )}
            <AnimatedNumber
                value={value}
                className="animated-counter-value"
                duration={1000}
            />
            <span
                style={{
                    fontSize: labelSize,
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    fontWeight: 500,
                }}
            >
                {label}
            </span>
            <style>{`
                .animated-counter-value {
                    font-size: ${numberSize}px;
                    font-weight: 700;
                    color: ${color};
                    line-height: 1;
                }
            `}</style>
        </motion.div>
    );
}

export default AnimatedNumber;
