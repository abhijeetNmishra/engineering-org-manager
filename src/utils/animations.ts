import type { Variants } from "framer-motion";

// Card hover effects
export const cardHoverVariants: Variants = {
    rest: {
        scale: 1,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        transition: { duration: 0.2, ease: "easeOut" },
    },
    hover: {
        scale: 1.02,
        boxShadow: "0 12px 48px rgba(107, 33, 239, 0.3)",
        transition: { duration: 0.2, ease: "easeOut" },
    },
};

// Count up animation for numbers
export const countUpVariants: Variants = {
    initial: { opacity: 0, y: 20 },
    animate: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: "easeOut" },
    },
};

// Stagger children animations
export const staggerContainerVariants: Variants = {
    initial: {},
    animate: {
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1,
        },
    },
};

export const staggerItemVariants: Variants = {
    initial: { opacity: 0, y: 20 },
    animate: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: "easeOut" },
    },
};

// Expand/collapse animations
export const expandCollapseVariants: Variants = {
    collapsed: {
        height: 0,
        opacity: 0,
        transition: { duration: 0.3, ease: "easeInOut" },
    },
    expanded: {
        height: "auto",
        opacity: 1,
        transition: { duration: 0.3, ease: "easeInOut" },
    },
};

// Fade in/out
export const fadeVariants: Variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
};

// Slide animations
export const slideInVariants: Variants = {
    initial: { x: -20, opacity: 0 },
    animate: { x: 0, opacity: 1, transition: { duration: 0.3 } },
    exit: { x: 20, opacity: 0, transition: { duration: 0.2 } },
};

export const slideUpVariants: Variants = {
    initial: { y: 30, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { y: -30, opacity: 0, transition: { duration: 0.2 } },
};

// Scale animations
export const scaleInVariants: Variants = {
    initial: { scale: 0.9, opacity: 0 },
    animate: {
        scale: 1,
        opacity: 1,
        transition: { duration: 0.3, ease: [0.2, 0.65, 0.3, 0.9] },
    },
    exit: {
        scale: 0.9,
        opacity: 0,
        transition: { duration: 0.2 },
    },
};

// Modal/overlay animation
export const modalVariants: Variants = {
    initial: { scale: 0.95, opacity: 0 },
    animate: {
        scale: 1,
        opacity: 1,
        transition: { duration: 0.2, ease: "easeOut" },
    },
    exit: {
        scale: 0.95,
        opacity: 0,
        transition: { duration: 0.15 },
    },
};

// Pulse animation for highlights
export const pulseVariants: Variants = {
    initial: { scale: 1 },
    animate: {
        scale: [1, 1.05, 1],
        transition: { duration: 0.6, repeat: Infinity, repeatDelay: 2 },
    },
};

// Skeleton loading animation
export const skeletonVariants: Variants = {
    initial: { opacity: 0.4 },
    animate: {
        opacity: [0.4, 0.7, 0.4],
        transition: { duration: 1.5, repeat: Infinity },
    },
};

// Chart bar animation
export const chartBarVariants: Variants = {
    initial: { scaleY: 0, originY: 1 },
    animate: {
        scaleY: 1,
        transition: { duration: 0.6, ease: [0.2, 0.65, 0.3, 0.9] },
    },
};

// Transition presets
export const springTransition = {
    type: "spring",
    stiffness: 300,
    damping: 25,
};

export const smoothTransition = {
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1],
};

export const bounceTransition = {
    type: "spring",
    stiffness: 400,
    damping: 15,
};
