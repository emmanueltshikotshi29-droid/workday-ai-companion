<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- All AI calls go through the streaming server route `src/routes/api/ai.ts` (Lovable AI Gateway, key stays server-side); the browser uses `src/lib/ai-client.ts`. Why: one place for model, errors and streaming.
- User data (drafts, plans, history, stats) lives in localStorage via `useLocal` in `src/lib/store.ts`; no auth or database. Why: MVP scope.
