import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import simpleGit from 'simple-git';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

// Configure email transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are an assistant that generates ONE unified, human-friendly project update summarizing recent work across one or more Git repositories.

Your responsibilities:

1. First, provide a non-technical description of what was done during the date range.
2. After describing what was done, include the project about/description.
3. Use non-technical, pedagogical explanations that:
   - Explain the impact of the work in everyday terms.
   - Help non-technical readers understand what the work means.
   - Avoid jargon unless it is explained briefly.
4. Group related changes into themes instead of commit-by-commit explanations.
5. Do NOT invent details. Base your summary strictly on:
   - The project goal/about
   - The commit messages
   - Any provided context from the caller.
6. At the end, include all commit details.

OUTPUT REQUIREMENTS:
- Output MUST be valid HTML.
- Use clean, semantic HTML with inline CSS for styling.
- Structure the response as:

<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #667eea; margin-bottom: 10px; font-size: 2em;">Project Update: <PROJECT NAME></h1>
  <p style="color: #666; margin-bottom: 40px; font-size: 1.1em;"><DATE RANGE></p>

  <h2 style="color: #333; margin-top: 40px; margin-bottom: 20px; font-size: 1.5em;">What Was Done (<START DATE> to <END DATE>)</h2>
  <p style="line-height: 1.8; margin-bottom: 25px; font-size: 1.05em;">(First paragraph explaining the main themes of changes)</p>
  <p style="line-height: 1.8; margin-bottom: 25px; font-size: 1.05em;">(Second paragraph with more details)</p>
  <p style="line-height: 1.8; margin-bottom: 25px; font-size: 1.05em;">(Third paragraph if needed)</p>

  <h2 style="color: #333; margin-top: 40px; margin-bottom: 20px; font-size: 1.5em;">About</h2>
  <p style="line-height: 1.8; margin-bottom: 30px; font-size: 1.05em;">(Use the exact project goal/about text provided in the context)</p>

  <h2 style="color: #333; margin-top: 40px; margin-bottom: 20px; font-size: 1.5em;">Commit Details</h2>
  <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 0.95em;">
    <thead>
      <tr style="background: #f5f5f5; border-bottom: 2px solid #ddd;">
        <th style="padding: 12px; text-align: left; font-weight: 600;">Date</th>
        <th style="padding: 12px; text-align: left; font-weight: 600;">Repo</th>
        <th style="padding: 12px; text-align: left; font-weight: 600;">Author</th>
        <th style="padding: 12px; text-align: left; font-weight: 600;">Message</th>
      </tr>
    </thead>
    <tbody>
      (Convert the commit table to HTML table rows with alternating row colors)
    </tbody>
  </table>
</div>

STYLE:
- Tone should be clear, concise, professional, and suitable for executives or stakeholders.
- Avoid dense technical descriptions; focus on meaning, outcomes, and clarity.
- If input is insufficient for a full summary, state that plainly.`;

// Extract project metadata from git repository
async function extractProjectMetadata(repoPath) {
    const fs = await import('fs');
    const path = await import('path');

    let projectName = repoPath.split('/').pop();
    let projectGoal = null;

    try {
        // Try to read package.json
        const packageJsonPath = path.join(repoPath, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
            if (packageJson.description) {
                projectGoal = packageJson.description;
            }
            if (packageJson.name) {
                projectName = packageJson.name;
            }
        }

        // If no goal yet, try git-specific sources
        if (!projectGoal) {
            // Try .git/description file
            const gitDescPath = path.join(repoPath, '.git', 'description');
            if (fs.existsSync(gitDescPath)) {
                const desc = fs.readFileSync(gitDescPath, 'utf-8').trim();
                // Skip default git description
                if (desc && desc !== 'Unnamed repository; edit this file \'description\' to name the repository.') {
                    projectGoal = desc;
                }
            }

            // If still no goal, try git config
            if (!projectGoal) {
                try {
                    const git = simpleGit(repoPath);
                    const configDesc = await git.raw(['config', '--get', 'project.description']);
                    if (configDesc && configDesc.trim()) {
                        projectGoal = configDesc.trim();
                    }
                } catch (error) {
                    // Config value doesn't exist, continue
                }
            }
        }
    } catch (error) {
        console.log(`Could not extract metadata from ${repoPath}:`, error.message);
    }

    return { projectName, projectGoal };
}

// Extract commits from git repositories
async function extractCommitsFromRepos(repoPaths, startDate, endDate) {
    const allCommits = [];

    for (const repoPath of repoPaths) {
        try {
            const git = simpleGit(repoPath);

            // Build git log options using --since and --until
            const logOptions = [
                `--since="${startDate}"`,
                `--until="${endDate}"`,
                '--format=%h|%ai|%s|%an|%ae'
            ];

            const log = await git.raw(['log', ...logOptions]);

            // Parse the log output
            const repoName = repoPath.split('/').pop();
            const lines = log.trim().split('\n').filter(line => line.length > 0);

            lines.forEach(line => {
                const [hash, date, message, authorName, authorEmail] = line.split('|');
                if (hash && date) {
                    allCommits.push({
                        date: date.split(' ')[0],
                        repo: repoName,
                        hash: hash,
                        author: authorName,
                        message: message
                    });
                }
            });

        } catch (error) {
            console.error(`Error reading repo ${repoPath}:`, error.message);
        }
    }

    // Sort by date
    allCommits.sort((a, b) => new Date(a.date) - new Date(b.date));

    return allCommits;
}

// Format commits as markdown table
function formatCommitsAsTable(commits) {
    if (commits.length === 0) {
        return 'No commits found for the specified criteria.';
    }

    let table = '| Date       | Repo                    | Commit ID | Author  | Message                          |\n';
    table += '| ---------- | ----------------------- | --------- | ------- | -------------------------------- |\n';

    commits.forEach(commit => {
        const date = commit.date.padEnd(10);
        const repo = commit.repo.padEnd(23);
        const hash = commit.hash.padEnd(9);
        const author = commit.author.padEnd(7);
        const message = commit.message;
        table += `| ${date} | ${repo} | ${hash} | ${author} | ${message} |\n`;
    });

    return table;
}

// API endpoint to generate summary
app.post('/api/generate-summary', async (req, res) => {
    try {
        const { projectName, projectGoal, repoPaths, startDate, endDate, nextSteps, recipientEmails } = req.body;

        // Validate inputs
        if (!repoPaths || repoPaths.length === 0) {
            return res.status(400).json({
                error: 'Missing required fields: repoPaths are required'
            });
        }

        // Extract project metadata from repositories
        let autoProjectName = projectName;
        let autoProjectGoal = projectGoal;

        if (!autoProjectName || !autoProjectGoal) {
            const metadataPromises = repoPaths.map(path => extractProjectMetadata(path));
            const metadataList = await Promise.all(metadataPromises);

            // Use first repo's metadata or combine names
            if (!autoProjectName) {
                autoProjectName = metadataList.length === 1
                    ? metadataList[0].projectName
                    : metadataList.map(m => m.projectName).join(', ');
            }

            if (!autoProjectGoal) {
                // Use first repo's goal or create generic one
                autoProjectGoal = metadataList.find(m => m.projectGoal)?.projectGoal
                    || `Summary of development activity across ${repoPaths.length} repository/repositories.`;
            }
        }

        // Extract commits from repositories
        const commits = await extractCommitsFromRepos(
            repoPaths,
            startDate,
            endDate
        );

        // Format commits as table
        const commitsTable = formatCommitsAsTable(commits);

        // Build runtime input
        let runtimeInput = `# PROJECT CONTEXT
project_name: ${autoProjectName}
project_goal: ${autoProjectGoal}
audience: Senior stakeholders who want non-technical explanations.
date_range: ${startDate} to ${endDate}

notes_for_emphasis:
- Highlight reductions in manual work.
- Emphasize AI-safety improvements (guardrails, constraints).
- Avoid technical jargon unless explained simply.
`;

        if (nextSteps) {
            runtimeInput += `\nnext_steps:\n${nextSteps}\n`;
        }

        runtimeInput += `\n# COMMITS TABLE\n${commitsTable}`;

        // Generate summary with Gemini
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            systemInstruction: SYSTEM_PROMPT
        });

        const result = await model.generateContent(runtimeInput);
        const response = await result.response;
        const summary = response.text();

        res.json({
            summary,
            commitsCount: commits.length,
            commits: commits
        });

    } catch (error) {
        console.error('Error generating summary:', error);
        res.status(500).json({
            error: error.message || 'Failed to generate summary'
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Discover git repositories endpoint
app.get('/api/discover-repos', async (req, res) => {
    try {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);

        // Search for git repos in Projects directory
        const projectsPath = '/Users/danielcrowder/Desktop/Previous Desktop/Projects';
        const { stdout } = await execAsync(`find "${projectsPath}" -maxdepth 2 -name ".git" -type d | sed 's/\\.git$//' | grep -v node_modules`);

        const repos = stdout
            .trim()
            .split('\n')
            .filter(path => path.length > 0)
            .map(path => ({
                path: path,
                name: path.split('/').pop()
            }));

        res.json({ repositories: repos });

    } catch (error) {
        console.error('Error discovering repos:', error);
        res.status(500).json({ error: 'Failed to discover repositories' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
