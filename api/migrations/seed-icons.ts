import { sql } from '@vercel/postgres';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const icons = {
  "mod-001": "🔭",
  "mod-002": "🛍️",
  "mod-003": "💳",
  "mod-004": "🤖",
  "mod-sub-001": "🔍",
  "mod-sub-002": "🧭",
  "mod-sub-003": "🕸️",
  "mod-sub-004": "🚀",
  "mod-sub-005": "📄",
  "mod-sub-006": "⚖️",
  "mod-sub-007": "🔮",
  "mod-sub-008": "🛒",
  "mod-sub-009": "💵",
  "mod-sub-010": "📦",
  "mod-sub-011": "⭐",
  "mod-sub-012": "🎨",
  "mod-sub-013": "⚙️",
  "mod-sub-014": "🧠",
  "mod-sub-015": "⚡"
};

export async function seedIcons() {
  try {
    console.log('Seeding icons...');
    for (const [id, icon] of Object.entries(icons)) {
      await sql`UPDATE modules SET icon = ${icon} WHERE id = ${id}`;
    }
    console.log('Icons seeded successfully.');
  } catch (error) {
    console.error('Failed to seed icons:', error);
    process.exit(1);
  }
}

seedIcons();
