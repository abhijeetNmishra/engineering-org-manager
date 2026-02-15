# CSV Import Guide: Submodule Filtering

This guide explains how to format your CSV file to enable accurate organizational charts and submodule filtering in the Deep Dive view.

## Example Data Table

The following table demonstrates the correct structure for mapping employees to workstreams, submodules, and reporting lines.

| Full Name | Email | Role | Primary Skill | Workstream | Status | Reports To | Location | Tenure | Secondary Skills | Submodules | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Jane Doe | jane.doe@shipt.com | VP of Engineering | Leadership | Engineering | Active | | Remote | 5 | Strategy, Management | | VP at top level |
| John Smith | john.smith@shipt.com | Director of Engineering | Leadership | Engineering | Active | jane.doe@shipt.com | SF | 3 | Management, JavaScript | Frontend | Leader of Frontend |
| Alice Wonderland | alice.wonderland@shipt.com | Director of Engineering | Leadership | Engineering | Active | jane.doe@shipt.com | SF | 3 | Management, Python | Backend | Leader of Backend |
| Bob Builder | bob.builder@shipt.com | Staff Software Engineer | Frontend | Engineering | Active | john.smith@shipt.com | Remote | 4 | React, CSS | Frontend | Senior IC |
| Charlie Chocolate | charlie.chocolate@shipt.com | Senior Software Engineer | Backend | Engineering | Active | alice.wonderland@shipt.com | NY | 2 | Go, Kubernetes | Backend | Senior IC |
| Eve Eavesdropper | eve.eavesdropper@shipt.com | Software Engineer | Frontend | Engineering | Active | john.smith@shipt.com | Remote | 1 | TypeScript, Redux | Frontend | Standard IC |
| Mallory Malicious | mallory.malicious@shipt.com | Software Engineer | Backend | Engineering | Active | alice.wonderland@shipt.com | Remote | 1 | Postgres, Java | Backend | Standard IC |
| Trudy Trustworthy | trudy.trustworthy@shipt.com | Principal Engineer | Architecture | Engineering | Active | jane.doe@shipt.com | Remote | 6 | System Design, Cloud | Platform | Reports to VP |
| Oscar Grouch | oscar.grouch@shipt.com | Senior Database Engineer | Database | Engineering | Active | trudy.trustworthy@shipt.com | Remote | 3 | SQL, NoSQL | Platform | Standard IC |

## Critical Columns for Filtering

1.  **Workstream** (Required):
    *   Defines the top-level parent module (e.g., "Engineering", "Product").
    *   All submodules are created under this parent.

2.  **Submodules** (Optional but Key):
    *   A comma-separated list of submodule names (e.g., "Frontend", "Backend", "Platform").
    *   **Rules:**
        *   **Standard ICs**: Should generally map to exactly **one** submodule. If multiple are provided, the system may enforce a "primary only" rule depending on configuration.
        *   **Leaders (Managers, Directors, etc.)**: Can map to **multiple** submodules if they oversee several areas.
    *   This column directly drives the filtering in the "Deep Dive" overlay.

3.  **Reports To** (Optional but Key):
    *   The **Email address** of the employee's manager.
    *   Used to build the hierarchical organizational tree within the filtered view.
    *   For the tree to display correctly, the manager must also be part of the dataset (or existing system).

4.  **Role** (Impacts Logic):
    *   The import logic uses the job title to determine if an employee is allowed to have multiple submodule mappings (e.g., "Director", "VP", "Head", "Lead", "Principal", "Staff").
