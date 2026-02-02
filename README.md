# Shipt Marketplace Engineering Org Manager

> A modern, interactive organization management tool for visualizing and analyzing engineering teams at scale.

## 🎯 Overview

The Shipt Org Manager is a sophisticated web application designed to help engineering leadership manage and visualize a large organization (100+ people). It provides multiple perspectives on organizational structure, skill distribution, module ownership, and team composition through an elegant, n8n.io-inspired interface.

**Key Capabilities:**
- 📊 Interactive org chart with **smart collapse/expand** for 108+ people
- 👥 Comprehensive people directory with skill and role filtering  
- 🏗️ Module ownership visualization and dependency mapping
- 📈 Real-time analytics dashboard with skill distribution insights
- 💾 CSV import/export for data management

---

## ✨ Features

### 1. Dashboard
Central hub displaying key organizational metrics:
- Total headcount and breakdown by role level
- Skill distribution across the organization
- Module ownership statistics
- Direct access to all app sections

### 2. Smart Org Chart
**The Problem Solved:** Traditional org charts become unreadable with 100+ people, showing tiny illegible nodes.

**Our Solution:**
- **Smart Default Collapse**: Starts showing only VP → Directors (23 nodes vs 108 specks)
- **Progressive Disclosure**: Expand to specific levels (Directors, SEMs, EMs, ICs)
- **Search with Auto-Expand**: Find anyone and automatically reveal their reporting chain
- **Three View Modes**:
  - **Chart**: Interactive visual hierarchy with expand/collapse
  - **Tree**: File explorer-style hierarchical list
  - **Teams**: Director-centric cards with team stats and skill distribution

**Controls:**
- Expand/Collapse All
- Expand to Level (1-5)
- Search by name
- Zoom controls
- Click nodes to toggle branches

### 3. People Directory
Browse and filter all employees:
- Search by name
- Filter by role level, skills, manager
- View detailed employee profiles
- Module ownership tracking
- Primary skills badges

### 4. Module Ownership
Visualize engineering modules and ownership:
- Interactive dependency graph
- Module hierarchy with sub-modules
- Owner assignment and team links
- Technology stack per module

### 5. Import/Export
Data management interface:
- CSV import for bulk employee data
- Export organization data
- Data validation and preview
- Batch operations support

---

## 🏗️ Technical Architecture

### Tech Stack

**Frontend Framework:**
- **React 19.2** with TypeScript
- **Vite** for lightning-fast dev server and HMR

**UI Components:**
- **Ant Design 6.2** - Comprehensive component library
- **Ant Design Icons** - Icon system
- **React Flow 11.11** - Org chart visualization engine
- **@AntV/G6 5.0** - Graph visualization for module dependencies
- **ELK.js** - Automatic graph layout algorithm

**Data Handling:**
- **Zustand** (state management via custom store)
- **PapaParse** - CSV parsing and export
- **Day.js** - Date utilities

**Build Tools:**
- **TypeScript 5.9** - Type safety
- **ESLint** - Code quality
- **Vite 7.2** - Build tooling

### Project Structure

```
shipt-org-manager/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── G6Graph.tsx     # Module graph visualization
│   │   ├── OrgNode.tsx     # Org chart node component
│   │   ├── OrgChartControls.tsx  # Chart toolbar
│   │   ├── TreeView.tsx    # Hierarchical list view
│   │   └── TeamView.tsx    # Director team cards
│   ├── domain/              # Business logic and types
│   │   ├── types.ts        # TypeScript type definitions
│   │   ├── mockData.ts     # 108-person dataset
│   │   └── skillTaxonomy.ts # Tech skills categorization
│   ├── pages/               # Route components
│   │   ├── Home.tsx        # Landing page
│   │   ├── Dashboard.tsx   # Metrics overview
│   │   ├── OrgChart.tsx    # Org visualization
│   │   ├── PeopleDirectory.tsx
│   │   ├── ModuleOwnership.tsx
│   │   └── ImportExport.tsx
│   ├── state/               # Global state management
│   │   └── orgStore.ts     # Zustand store
│   ├── styles.css           # Global styles and theme
│   └── App.tsx              # Main app shell
└── package.json
```

### Design System

**Theme:** n8n.io-inspired dark mode with glassmorphism

**Color Palette:**
- Primary: Purple gradient (`#077AC7` → `#6B21EF`)
- Accents: Orange gradient (`#FF9B26` → `#FF6D5A`)
- Background: Deep purple (`#0E0918`)
- Glass effects with backdrop blur

**Typography:**
- Modern sans-serif stack
- Weighted hierarchy (400-700)
- Improved contrast ratios for accessibility

**Components:**
- Glass cards with blur effects
- Smooth transitions (300ms cubic-bezier)
- Hover states with glow effects
- Consistent 12px border radius

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd shipt-org-manager

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
# Type-check and build
npm run build

# Preview production build
npm run preview
```

### Linting

```bash
npm run lint
```

---

## 📊 Data Model

### Employee
```typescript
interface Employee {
  id: string;
  name: string;
  title: RoleLevel;
  managerId?: string;
  primarySkills: TechnicalSkill[];
  modules?: string[];
}
```

### Role Levels
- VP Engineering
- Director  
- Senior Engineering Manager (SEM)
- Engineering Manager (EM)
- Senior Principal Engineer
- Principal Engineer
- Staff Engineer
- Senior Engineer
- Engineer
- Associate Engineer

### Skill Taxonomy
Organized into categories:
- **Frontend**: React, TypeScript, Vue, Angular, Next.js
- **Backend**: Node.js, Python, Java, Go, GraphQL, REST
- **Mobile**: iOS, Android, React Native, Flutter
- **Data**: SQL, NoSQL, Data Pipelines, Analytics
- **Infrastructure**: AWS, Docker, Kubernetes, CI/CD
- **Platform**: System Design, Architecture, DevOps

---

## 🎨 Key UX Innovations

### 1. Smart Collapse Algorithm
```typescript
// Default: Show VP → Directors → SEMs (level 3)
// Collapse all level 4+ (EMs and ICs)
const getInitialCollapsedState = () => {
  // Calculate hierarchy depth
  // Collapse nodes at level >= 3
  // Returns Set<nodeId> of collapsed nodes
}
```

### 2. Search with Path Expansion
When searching for an employee:
1. Find matching names
2. Walk up reporting chain to root
3. Remove ancestors from collapsed set
4. Highlight matched nodes
5. Auto-center viewport

### 3. Multiple View Modes
- **Chart**: ReactFlow with ELK layout algorithm
- **Tree**: Ant Design Tree with expand/collapse
- **Teams**: Calculated team stats grouped by Director

---

## 📈 Performance Optimizations

- **Lazy rendering**: Only visible nodes in org chart
- **Memoized components**: React.memo on OrgNode
- **Efficient layout**: ELK.js algorithmic placement
- **State management**: Zustand for minimal re-renders
- **Virtual scrolling**: Ant Design Table pagination

---

## 🔮 Future Enhancements

- [ ] Advanced filtering (role, skills, modules) on Dashboard
- [ ] Swimlane view for skill distribution
- [ ] Minimap for org chart overview
- [ ] Export org chart as PNG/SVG
- [ ] Real backend integration (REST/GraphQL API)
- [ ] Authentication and authorization
- [ ] Multi-org support
- [ ] Change history and versioning

---

## 📝 License

Private - Shipt/Target Corporation

---

## 🙏 Acknowledgments

- **n8n.io** for design inspiration
- **Ant Design** for comprehensive UI components  
- **React Flow** for powerful graph visualization
- **ELK.js** for automatic layout algorithms

---

## 📞 Support

For questions or issues, contact the Marketplace Engineering team.
