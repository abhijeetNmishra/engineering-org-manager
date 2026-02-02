# Google Sheets Data Persistence Setup

This guide explains how to structure your Google Sheets to serve as the backend database for the Shipt Engineering Org Manager.

---

## 📊 Overview

**Recommended Setup:**
- **1 Google Sheet** with **5 tabs** (sheets)
- Each tab represents a different data entity
- Use the first row for column headers
- Data starts from row 2

**Sheet Name:** `Shipt Engineering Org Data`

---

## 📁 Tab Structure

### Tab 1: `People`

**Purpose:** Store all employee/team member information with reporting structure.

| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| `id` | Text | ✅ | Unique identifier (email or employee ID) | `john.doe@shipt.com` |
| `name` | Text | ✅ | Full name | `John Doe` |
| `title` | Text | ✅ | Job title | `Senior Software Engineer` |
| `manager_id` | Text | ❌ | ID of direct manager (empty for CEO) | `jane.smith@shipt.com` |
| `workstream` | Text | ✅ | Primary workstream/team | `Marketplace Platform` |
| `skills` | Text | ❌ | Comma-separated skills | `React, TypeScript, Node.js` |
| `location` | Text | ❌ | Office location | `San Francisco` |
| `hire_date` | Date | ❌ | Date joined | `2023-01-15` |
| `level` | Text | ❌ | Career level | `L5` |
| `status` | Text | ✅ | Employment status | `Active` or `Inactive` |

**Example Data:**
```
id                          | name            | title                      | manager_id              | workstream              | skills                    | location       | hire_date  | level | status
geminiabhijeet@gmail.com    | Abhijeet Mishra| Engineering Manager        |                         | Marketplace Platform    | Leadership, Architecture  | Remote         | 2022-01-10 | L6    | Active
john.doe@shipt.com          | John Doe       | Senior Software Engineer   | geminiabhijeet@gmail.com| Marketplace Platform    | React, TypeScript, Node.js| San Francisco  | 2023-01-15 | L5    | Active
jane.smith@shipt.com        | Jane Smith     | Staff Engineer             | geminiabhijeet@gmail.com| Checkout Experience     | Python, GraphQL, AWS      | Austin         | 2021-06-01 | L6    | Active
```

---

### Tab 2: `Modules`

**Purpose:** Define technical modules/components and their ownership.

| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| `module_id` | Text | ✅ | Unique module identifier | `checkout-service` |
| `module_name` | Text | ✅ | Display name | `Checkout Service` |
| `description` | Text | ❌ | Brief description | `Handles order processing and payments` |
| `owner_id` | Text | ✅ | ID of primary owner (from People) | `jane.smith@shipt.com` |
| `tech_stack` | Text | ❌ | Technologies used | `Node.js, PostgreSQL, Redis` |
| `repository` | Text | ❌ | Git repository URL | `https://github.com/shipt/checkout-service` |
| `workstream` | Text | ✅ | Owning workstream | `Checkout Experience` |
| `criticality` | Text | ❌ | Business criticality | `Critical`, `High`, `Medium`, `Low` |
| `health_status` | Text | ❌ | Current health status | `Healthy`, `Warning`, `Critical` |

**Example Data:**
```
module_id          | module_name         | description                      | owner_id              | tech_stack              | repository                           | workstream            | criticality | health_status
checkout-service   | Checkout Service    | Handles order processing         | jane.smith@shipt.com  | Node.js, PostgreSQL     | https://github.com/shipt/checkout    | Checkout Experience   | Critical    | Healthy
user-auth          | Authentication      | User login and sessions          | john.doe@shipt.com    | React, JWT, Redis       | https://github.com/shipt/auth        | Marketplace Platform  | Critical    | Healthy
notification-svc   | Notification Engine | Email and push notifications     | alice.wong@shipt.com  | Python, SQS, SES        | https://github.com/shipt/notifications| Platform Services     | High        | Warning
```

---

### Tab 3: `Workstreams`

**Purpose:** Define teams/workstreams and their focus areas.

| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| `workstream_id` | Text | ✅ | Unique identifier | `marketplace-platform` |
| `workstream_name` | Text | ✅ | Display name | `Marketplace Platform` |
| `description` | Text | ❌ | Mission/focus | `Core marketplace infrastructure and platform services` |
| `lead_id` | Text | ✅ | Team lead (from People) | `geminiabhijeet@gmail.com` |
| `headcount` | Number | ❌ | Team size | `12` |
| `focus_areas` | Text | ❌ | Key focus areas | `Infrastructure, API Platform, Auth` |
| `okr_status` | Text | ❌ | OKR health | `On Track`, `At Risk`, `Off Track` |

**Example Data:**
```
workstream_id          | workstream_name         | description                              | lead_id                   | headcount | focus_areas                    | okr_status
marketplace-platform   | Marketplace Platform    | Core marketplace infrastructure          | geminiabhijeet@gmail.com  | 12        | Infrastructure, API, Auth       | On Track
checkout-experience    | Checkout Experience     | Order processing and payment flows       | jane.smith@shipt.com      | 8         | Payments, Cart, Pricing         | On Track
platform-services      | Platform Services       | Shared services and tools                | bob.jones@shipt.com       | 6         | Notifications, Logging, Metrics | At Risk
```

---

### Tab 4: `Metrics`

**Purpose:** Track key engineering metrics and health indicators.

| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| `metric_id` | Text | ✅ | Unique identifier | `deployment-frequency` |
| `metric_name` | Text | ✅ | Display name | `Deployment Frequency` |
| `category` | Text | ✅ | Metric category | `DORA`, `Quality`, `Velocity`, `Health` |
| `current_value` | Number | ✅ | Current metric value | `15.5` |
| `target_value` | Number | ❌ | Target/goal | `20` |
| `unit` | Text | ✅ | Unit of measurement | `per week`, `%`, `days`, `count` |
| `status` | Text | ✅ | Health status | `Good`, `Warning`, `Critical` |
| `last_updated` | Date | ✅ | Last update date | `2026-02-01` |
| `owner_workstream` | Text | ❌ | Responsible team | `Platform Services` |

**Example Data:**
```
metric_id              | metric_name              | category | current_value | target_value | unit      | status   | last_updated | owner_workstream
deployment-frequency   | Deployment Frequency     | DORA     | 15.5          | 20           | per week  | Warning  | 2026-02-01   | Platform Services
test-coverage          | Test Coverage            | Quality  | 78            | 80           | %         | Warning  | 2026-02-01   | All Teams
incident-count         | P1 Incidents (MTD)       | Health   | 2             | 0            | count     | Critical | 2026-02-01   | Operations
lead-time              | Lead Time for Changes    | DORA     | 3.5           | 2            | days      | Warning  | 2026-02-01   | Platform Services
```

---

### Tab 5: `Alerts`

**Purpose:** Track active issues, incidents, or things requiring attention.

| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| `alert_id` | Text | ✅ | Unique identifier | `ALERT-2026-001` |
| `title` | Text | ✅ | Alert title | `Critical: Checkout Service Error Rate High` |
| `description` | Text | ✅ | Detailed description | `Error rate spiked to 5% in last hour` |
| `severity` | Text | ✅ | Alert severity | `P0`, `P1`, `P2`, `P3` |
| `status` | Text | ✅ | Current status | `Open`, `Investigating`, `Resolved`, `Closed` |
| `owner_id` | Text | ✅ | Responsible person | `jane.smith@shipt.com` |
| `affected_module` | Text | ❌ | Related module | `checkout-service` |
| `created_date` | Date | ✅ | When created | `2026-01-30` |
| `resolved_date` | Date | ❌ | When resolved | `2026-01-31` |
| `workstream` | Text | ❌ | Owning team | `Checkout Experience` |

**Example Data:**
```
alert_id       | title                                  | description                         | severity | status        | owner_id              | affected_module  | created_date | resolved_date | workstream
ALERT-2026-001 | Critical: Checkout Error Rate High     | Error rate spiked to 5%             | P0       | Investigating | jane.smith@shipt.com  | checkout-service | 2026-01-30   |               | Checkout Experience
ALERT-2026-002 | Test Coverage Below Target             | Coverage dropped from 80% to 78%    | P2       | Open          | john.doe@shipt.com    | user-auth        | 2026-01-28   |               | Marketplace Platform
ALERT-2026-003 | Deployment Pipeline Slow               | Deploy time increased by 50%        | P1       | Resolved      | bob.jones@shipt.com   | ci-cd            | 2026-01-25   | 2026-01-31    | Platform Services
```

---

## 🔧 Setup Instructions

### Step 1: Create the Google Sheet

1. Go to https://sheets.google.com
2. Click "+ Blank" to create new sheet
3. Rename it: `Shipt Engineering Org Data`
4. Share with your Google account used for the app

### Step 2: Create Tabs

1. **Rename Sheet1** to `People`
2. **Add 4 more tabs** (click + at bottom):
   - `Modules`
   - `Workstreams`
   - `Metrics`
   - `Alerts`

### Step 3: Add Column Headers

For each tab, copy the column names from the tables above into **Row 1**.

**Example for People tab:**
```
A1: id
B1: name
C1: title
D1: manager_id
E1: workstream
F1: skills
G1: location
H1: hire_date
I1: level
J1: status
```

### Step 4: Add Sample Data

Start adding data from **Row 2** onwards. Use the example data provided above as a template.

### Step 5: Format the Sheet (Optional)

1. **Freeze header row**: View → Freeze → 1 row
2. **Bold headers**: Select row 1, click **Bold** (Ctrl+B)
3. **Add filters**: Data → Create a filter
4. **Color code statuses**: Use conditional formatting
   - `status = "Active"` → Green
   - `status = "Inactive"` → Gray
   - `severity = "P0"` → Red
   - `health_status = "Critical"` → Red

---

## 📝 Data Guidelines

### For `People` Tab:
- Use **email as ID** for uniqueness and easy lookup
- Leave `manager_id` **empty** for the top executive
- Keep `skills` comma-separated for easy parsing
- Use consistent `level` format (L4, L5, L6, etc.)

### For `Modules` Tab:
- Use **kebab-case** for `module_id` (lowercase-with-dashes)
- Ensure `owner_id` matches a valid `id` from People tab
- Keep `criticality` values consistent: Critical, High, Medium, Low

### For `Workstreams` Tab:
- Use **kebab-case** for `workstream_id`
- Ensure `lead_id` exists in People tab
- Update `headcount` to match actual team size

### For `Metrics` Tab:
- Use descriptive `metric_id` (deployment-frequency, not METRIC-001)
- Keep units consistent per metric type
- Update `last_updated` when values change

### For `Alerts` Tab:
- Use sequential IDs: ALERT-2026-001, ALERT-2026-002, etc.
- Set `resolved_date` only when status = "Resolved" or "Closed"
- Use P0 (most critical) to P3 (least critical) for severity

---

## 🔗 Next Steps

Once your Google Sheet is set up:

1. **Get Sheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit
   ```

2. **Enable Google Sheets API** (we'll set this up next):
   - Create service account
   - Generate credentials JSON
   - Share sheet with service account email

3. **Integrate with App**:
   - Install `googleapis` package
   - Create API service to read/write data
   - Replace mock data with real Google Sheets data

---

## 📊 Sample Sheet Template

**Want a head start?**

Here's a starter template with 5 sample employees, 3 modules, and 2 workstreams:

### People (5 rows)
```
geminiabhijeet@gmail.com | Abhijeet Mishra | VP Engineering           |                          | Leadership        | Leadership, Strategy      | Remote       | 2022-01-10 | L7 | Active
jane.smith@shipt.com     | Jane Smith      | Engineering Manager      | geminiabhijeet@gmail.com | Checkout          | Backend, Architecture     | Austin       | 2021-06-01 | L6 | Active
john.doe@shipt.com       | John Doe        | Staff Engineer           | jane.smith@shipt.com     | Checkout          | React, TypeScript, Node.js| SF           | 2023-01-15 | L6 | Active
alice.wong@shipt.com     | Alice Wong      | Senior Engineer          | jane.smith@shipt.com     | Checkout          | Python, AWS, Docker       | Remote       | 2023-03-20 | L5 | Active
bob.jones@shipt.com      | Bob Jones       | Engineering Manager      | geminiabhijeet@gmail.com | Platform Services | DevOps, Infrastructure    | Seattle      | 2020-08-15 | L6 | Active
```

### Modules (3 rows)
```
checkout-service | Checkout Service    | Handles order processing and payments     | jane.smith@shipt.com  | Node.js, PostgreSQL, Redis | https://github.com/shipt/checkout    | Checkout          | Critical | Healthy
user-auth        | Authentication      | User login and session management         | john.doe@shipt.com    | React, JWT, Redis          | https://github.com/shipt/auth        | Platform Services | Critical | Healthy
notification-svc | Notification Engine | Email and push notifications              | alice.wong@shipt.com  | Python, SQS, SES           | https://github.com/shipt/notifications| Platform Services | High     | Warning
```

### Workstreams (2 rows)
```
checkout          | Checkout Experience | Order processing and payment flows        | jane.smith@shipt.com      | 3 | Payments, Cart, Pricing         | On Track
platform-services | Platform Services   | Shared services and infrastructure tools  | bob.jones@shipt.com       | 2 | Notifications, Logging, DevOps  | On Track
```

---

## 🎯 Tips for Success

1. **Keep it Simple**: Start with basic data, add complexity later
2. **Consistent Formatting**: Use the same date format (YYYY-MM-DD)
3. **No Empty Rows**: Avoid gaps in your data
4. **Validate Relationships**: Ensure IDs reference existing records
5. **Regular Updates**: Set a cadence to update metrics and alerts
6. **Backup**: Make a copy monthly (File → Make a copy)

---

## ✅ Checklist

Before connecting to your app:

- [ ] Created Google Sheet with correct name
- [ ] Added all 5 tabs (People, Modules, Workstreams, Metrics, Alerts)
- [ ] Added column headers (Row 1) for each tab
- [ ] Added at least 3-5 sample rows per tab
- [ ] Froze header row and applied formatting
- [ ] Verified all IDs are unique
- [ ] Checked that manager_id and owner_id reference valid people
- [ ] Noted the Sheet ID from URL

---

Ready to connect this to your app? Let me know and I'll help you set up the Google Sheets API integration! 🚀
