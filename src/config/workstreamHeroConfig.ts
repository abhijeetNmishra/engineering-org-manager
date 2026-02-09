export interface HeroSlideConfig {
    id: string;
    title: string;
    vision: string;
    definition: string;
    themeGradient: string;
    icon?: string;
}

export const WORKSTREAM_HERO_CONTENT: HeroSlideConfig[] = [
    {
        id: 'consideration',
        title: 'Consideration',
        vision: 'Help members discover the right products, at the right time, with confidence.',
        definition: 'Pricing, merchandising, offers, retail media, and intelligent decisioning that influence purchase intent.',
        themeGradient: 'linear-gradient(135deg, #FF9966 0%, #FF5E62 100%)', // Orange -> Red
        icon: '🛍️'
    },
    {
        id: 'traffic',
        title: 'Traffic, Discovery & Confidence',
        vision: 'Drive high-quality traffic and ensure every entry point builds trust.',
        definition: 'Acquisition, onboarding, navigation, search, and first-impression experiences.',
        themeGradient: 'linear-gradient(135deg, #1CB5E0 0%, #000851 100%)', // Blue -> Dark Blue
        icon: '🧭'
    },
    {
        id: 'purchase',
        title: 'Purchase & Post Purchase',
        vision: 'Make checkout effortless and fulfillment unforgettable.',
        definition: 'Cart, checkout, payments, order lifecycle, and post-order experiences.',
        themeGradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', // Green -> Light Green
        icon: '💳'
    },
    {
        id: 'agentic',
        title: 'Agentic Commerce',
        vision: 'Redefine commerce through intelligent, agent-driven experiences.',
        definition: 'On-platform agents, off-platform integrations, partner experiences, and agent tooling.',
        themeGradient: 'linear-gradient(135deg, #834d9b 0%, #d04ed6 100%)', // Purple -> Pink
        icon: '🤖'
    }
];
