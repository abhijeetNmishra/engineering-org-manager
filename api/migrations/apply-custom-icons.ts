import { sql } from '@vercel/postgres';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MODULE_ICON_MAP: Record<string, string> = {
    "Agentic Experience": "🤖",
    "On-Platform Agentic Experience": "💬",
    "Off-Plaform Agentic Experience": "🌐",
    "Embedded Partner Experiences": "🤝",
    "Agent Capabilities & Tooling": "🛠️",
    "Consideration": "🛍️",
    "Offers & Promotions": "🏷️",
    "Dynamic Pricing & Yield Management": "📈",
    "Site Merchandising & Merch Tools": "🏪",
    "Retail Media Network": "📺",
    "Loyalty": "💎",
    "Marketplace Intelligence & Personalization Platform": "🧠",
    "Purchase & Post Purchase": "💳",
    "Cart & Checkout": "🛒",
    "Payments & Billing": "💵",
    "Post-Order Experience": "📦",
    "Marketplace Keystone Platform": "🏛️",
    "Traffic, Discovery & Growth": "🚀",
    "User Accounts & Subscriptions": "👤",
    "User Acquisition & Growth Channels": "📢",
    "Cross-Shop Onboarding & Activation": "🔀",
    "Global Navigation & Shell": "🧭",
    "Home Experience (Global & Retailer)": "🏠",
    "Browse, Search & Product Experience": "🔍",
    "Content Management Platform (CMS)": "📝",
    "Frontend Platform & Design Systems": "🎨",
    "MP Engineering": "⚙️"
};

async function applyIcons() {
  try {
    console.log('Applying icons based on module names...');
    
    for (const [name, icon] of Object.entries(MODULE_ICON_MAP)) {
      // Update by name to handle custom IDs
      await sql`UPDATE modules SET icon = ${icon} WHERE name = ${name}`;
    }
    
    console.log('Icons updated successfully.');
  } catch (error) {
    console.error('Failed to update icons:', error);
    process.exit(1);
  }
}

applyIcons();
