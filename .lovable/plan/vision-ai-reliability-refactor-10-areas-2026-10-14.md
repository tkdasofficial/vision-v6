# VISION — AI Reliability Refactor (10 areas)

Improve the existing chat AI rather than rebuild it. Simple messages keep the fast path; only complex ones get the full checked pipeline.

## What already exists (reused, not replaced)
- Instruction rules, validation, targeted section fixes and model review (Deep Thinking).
- Per-deliverable task engine with saved progress for resume.
- Mode router, model candidates, provider rate limiter with circuit breaker.
- Research web search, tool jobs, file tools, D1 storage, security module.

## Plan by area
1. **Instructions** — extend the existing parser into a requirement list: each rule marked mandatory/optional with status (met, missing, conflicting, impossible). Detect conflicts (e.g. "under 50 words" + "detailed"). Final answer discloses only real unmet items.
2. **Context** — new compact "task brief" (requirements, names, character details, schemas) carried into every split generation step; history trimmed by budget instead of a fixed last-30 cut, always keeping the instructions.
3. **Memory** — keep separate: this message, active task, chat history, saved preferences. Respect the project Memory setting (Default / Project) when building context. Memory failures fall back to normal chat.
4. **Routing & planning** — router scores task needs (reasoning, research, code, files, data, tools) instead of single keywords; existing four modes and Research search stay unchanged. Reuse finished steps; run steps in parallel only when independent.
5. **Tools** — one registry entry per tool with input check, output check, limits and an "is it a write" flag; duplicate write jobs blocked by request id.
6. **Recovery** — one shared failure classifier (temporary, permanent, validation, permission, resource) and retry policy with backoff + jitter, used by chat, Deep engine and jobs. Unfinished work is always labeled.
7. **Response quality** — add checks for tables, code fences, required fields, duplicate sections; repairs only touch failing parts, then recheck.
8. **Performance** — one central limits/budgets config; skip planning calls for simple requests; deadlines and cancellation everywhere; latency/retry/failure metrics without message content.
9. **Security** — treat web results, files and tool output as untrusted (clearly fenced in prompts); keep origin checks, sign-in, rate limits; generic error messages to users.
10. **Cleanup** — clear module boundaries, remove duplicated retry/timeout code, update AGENTS.md notes.

No UI changes.

## Technical details
- New pure modules in `src/lib/ai/`: `requirements.ts`, `context.ts`, `failures.ts` (classifier + retry policy), `limits.ts` (central budgets); extend `deep/instructions.ts`, `deep/validators.ts`, `task-router.ts`, `rate-limiter.ts`.
- `/api/chat` stays an orchestrator; gains context builder + project memory read (owner-checked in D1).
- Tool registry gets zod-style schemas and output validators; jobs dedupe by user+requestId.
- Tests: one new test file per new module plus updates to router, deep engine, rate limiter, jobs; then full suite, tsgo, build log.

## Known limits
- Live AI accuracy can't be tested here (preview sign-in unavailable); tests use sample replies.
- Conflict resolution and consistency are rule-based or reviewer judgement, not guarantees.
