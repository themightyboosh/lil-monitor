# Lil Monitor

A beautiful web tool for generating human-friendly project updates from Git activity across multiple repositories.

## Features

- Beautiful, responsive UI
- Generates executive-friendly summaries using Google Gemini AI
- Combines activity from multiple repositories
- Deployed on Firebase Hosting
- Uses credentials from the monumental-ai project

## Setup

### Prerequisites

- Node.js and pnpm installed
- Firebase account
- Google Gemini API key (get one at https://ai.google.dev/)

### Initial Setup

1. **Create a new Firebase project**:
   - Go to https://console.firebase.google.com/
   - Click "Add project" or "Create a project"
   - Name it (e.g., "lil-monitor")
   - Follow the wizard to complete

2. **Update Firebase configuration**:
   - Open `.firebaserc`
   - Replace `YOUR_PROJECT_ID_HERE` with your Firebase project ID

3. **Add your Gemini API key**:
   - Get your API key from https://ai.google.dev/
   - Open `.env`
   - Replace `YOUR_GEMINI_API_KEY_HERE` with your actual API key

4. **Install dependencies**:
   ```bash
   pnpm install
   ```

### Development

Run the development server:

```bash
pnpm dev
```

This will open the app at http://localhost:3000

### Deployment

Build and deploy to Firebase Hosting:

```bash
pnpm deploy
```

Or separately:

```bash
pnpm build
firebase deploy --only hosting
```

## Usage

1. Enter your project name and goal
2. Select the date range for your summary
3. Paste your git log data in markdown table format
4. Click "Generate Summary"
5. Get a beautiful, executive-friendly project update

## Git Log Format

The tool expects commit data in the following markdown table format:

```
| Date       | Repo                    | Commit ID | Author  | Message                          |
| ---------- | ----------------------- | --------- | ------- | -------------------------------- |
| 2025-12-01 | my-frontend             | a1b2c3d   | daniel  | add new feature                  |
| 2025-12-02 | my-backend              | e4f5g6h   | alex    | fix authentication bug           |
```

## Environment Variables

- `VITE_GEMINI_API_KEY` - Your Google Gemini API key (required)
- `VITE_GOOGLE_CLOUD_PROJECT_ID` - Google Cloud project ID (from monumental-ai)
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to service account key

## Tech Stack

- Vite - Fast build tool
- Google Gemini API - AI-powered summaries
- Firebase Hosting - Deployment
- Vanilla JavaScript - Simple and fast

## Security Notes

- Never commit `.env` or `service-account-key.json`
- API keys are loaded via Vite environment variables
- The `.gitignore` file protects sensitive files

## Credits

Based on the prompt engineering work in `claude_git_summary_prompt.md`
