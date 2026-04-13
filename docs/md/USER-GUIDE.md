# User Guide

## Opening the App

The app runs inside Power Platform. After deployment (`pac code push`), open the URL provided in the output or find it in make.powerapps.com under Apps.

## Account List

The main screen shows all Dataverse accounts in a table with columns: Name, City, Phone, Industry, Status.

- **Search** — type in the search box to filter accounts by name (server-side OData filter)
- **Click a row** — opens the detail view
- **Edit button** — opens the edit form for that account
- **Delete button** — shows a confirmation dialog before deleting

## Creating an Account

1. Click **New Account** in the top right
2. Fill in the form (only Account Name is required)
3. Click **Create**
4. A success toast appears and the list refreshes

### Available fields:
- Account Name (required)
- Account Number
- Phone
- Email
- Website
- Street, City, State, Zip
- Description

## Viewing Account Details

Click any row to open the detail dialog showing:
- Status badge and industry
- Contact info (phone, email, website)
- Address
- Description
- Owner, created/modified timestamps

Click **Edit** from the detail view to switch to the edit form.

## Editing an Account

1. Click **Edit** on a row or from the detail view
2. Modify fields
3. Click **Save Changes**
4. Only changed fields are sent to Dataverse (partial update)

## Deleting an Account

1. Click **Delete** on a row
2. Confirm in the dialog
3. The account is permanently removed from Dataverse

## Command Palette (Ctrl+K)

Press **Ctrl+K** (or **Cmd+K** on Mac) from anywhere in the app to open a global search. Type to search across all records — Accounts, Contacts, Action Items, Meeting Summaries, and Ideas. Results are grouped by entity with icons. Use arrow keys to navigate, Enter to jump to the selected entity's list, Escape to close.

A **Search** button with the Ctrl+K shortcut hint is also available at the bottom of the left sidebar.

## Extracting Action Items from Meeting Notes (AI)

1. Navigate to **Meetings** in the sidebar
2. Click a meeting summary row to open the detail view
3. Click the purple **Extract Action Items** button (sparkle icon)
4. The app sends the meeting notes to Azure OpenAI for analysis
5. A preview table shows the extracted items with checkboxes — deselect any you don't want
6. Click **Create N Action Items** to write them to Dataverse
7. Items are linked to the same account as the meeting summary, with priority and due date set by the AI

Requires Azure OpenAI configuration — see `.env.example` for the three required environment variables.
