# Workday AI Companion

Build "Workplace AI Assistant", a modern, responsive SaaS productivity dashboard that helps professionals streamline daily workplace tasks.

Design & Layout:
- Theme: Clean, modern SaaS aesthetic with white cards, subtle shadows, modern typography, and deep teal / emerald accents.
- Navigation: Collapsible sidebar with navigation to Dashboard Overview, Email Generator, Task Planner, Research Assistant, and Workplace Chat.
- Mobile-responsive layout throughout.

Core Features:
1. Dashboard Overview: Quick stats (tasks planned, emails drafted, etc.), recent activity, and quick-launch action cards for each tool.
2. Smart Email Generator: Inputs for recipient, purpose, key points, and tone (Formal, Friendly, Direct, Persuasive). Displays editable output with copy-to-clipboard and tone adjustment actions.
3. AI Task Planner: Inputs for tasks, deadlines, priorities, and available hours. Generates an organized daily/weekly schedule with priority tags, editable items, and completion checkboxes.
4. AI Research Assistant: Input for topic, questions, or pasted text. Generates an executive summary, key insights, and actionable takeaways.
5. Workplace Chatbot: Clean chat interface for quick contextual work questions, brainstorming, and drafting.

Technical & AI Requirements:
- AI Integration: Use Lovable AI powered by a Lovable Cloud edge function for dynamic, contextual AI generation. Do not use external third-party API keys or hardcoded mock text.
- Data Storage: Use localStorage to save user history, draft emails, and task lists locally across sessions. No user authentication or database tables required for this MVP.
- UI Polish: Loading skeletons/spinners for AI generation states, error toasts, copy-to-clipboard buttons, and editable output cards.
- Disclaimer: Include a subtle footer disclaimer: "AI-generated content may contain inaccuracies. Please review before professional use and avoid submitting confidential data."

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6d4146dc-8052-41fc-b38f-c3dccbc4bce5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
