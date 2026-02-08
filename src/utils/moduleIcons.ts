export const MODULE_ICON_MAP: Record<string, string> = {
    // Agentic Experience
    "Agentic Experience": "🤖",
    "On-Platform Agentic Experience": "💬",
    "Off-Plaform Agentic Experience": "🌐",
    "Embedded Partner Experiences": "🤝",
    "Agent Capabilities & Tooling": "🛠️",

    // Consideration
    "Consideration": "🛍️",
    "Offers & Promotions": "🏷️",
    "Dynamic Pricing & Yield Management": "📈",
    "Site Merchandising & Merch Tools": "🏪",
    "Retail Media Network": "📺",
    "Loyalty": "💎",
    "Marketplace Intelligence & Personalization Platform": "🧠",

    // Purchase & Post Purchase
    "Purchase & Post Purchase": "💳",
    "Cart & Checkout": "🛒",
    "Payments & Billing": "💵",
    "Post-Order Experience": "📦",
    "Marketplace Keystone Platform": "🏛️",

    // Traffic, Discovery & Growth
    "Traffic, Discovery & Growth": "🚀",
    "Traffic, Discovery & Confidence": "🚀", // Alias/Update
    "User Accounts & Subscriptions": "👤",
    "User Acquisition & Growth Channels": "📢",
    "Cross-Shop Onboarding & Activation": "🔀",
    "Global Navigation & Shell": "🧭",
    "Home Experience (Global & Retailer)": "🏠",
    "Browse, Search & Product Experience": "🔍",
    "Content Management Platform (CMS)": "📝",
    "Frontend Platform & Design Systems": "🎨",

    // Other
    "MP Engineering": "⚙️",

    // Agentic
    "Agentic Commerce": "🤖"
};

export function getIconForModule(name: string): string {
    return MODULE_ICON_MAP[name] || "📁"; // Default fallback
}
