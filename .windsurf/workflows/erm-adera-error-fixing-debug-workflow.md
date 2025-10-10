---
description: For Debugging and Revising as well as Error Fixing upon call.
auto_execution_mode: 1
---



# Adera — Ultimate Debug & Revision Workflow (Enhanced)

**Purpose**: A rigorous, persistent workflow for investigating, debugging, revising files, and resolving persistent errors in the Adera monorepo. The workflow requires the agent to read project files, update the memory-bank from chat history, consult official docs when necessary, and persist until the issue is resolved. A strict terminal-wait rule is included: **the agent must wait for terminal commands to complete and then parse the console output before taking subsequent actions**.

> Refer to the project context and monorepo rules: Adera-App-Context-expo.md & ermi-adera-hybrid-proj-rule.md. fileciteturn0file1 fileciteturn0file0

> Refer to the developers documentation of the tech stack for deeper insights while resolving. Browse the web and gather adequate information when needed or issue persists. Important links of the major tech stacks and modules are listed in the app context file.

---

## Core Principles (always)
- **Reproduce first**.
- **Make small, reversible changes**.
- **Document everything** in `.adera/memory/` and changelogs.
- **Wait for terminal completion**: after issuing any command that runs in a terminal (build, test, package, deploy), the agent must not proceed until the command returns exit status and console output is available for parsing. Use the logs to guide the next step.
- **Ask before assuming** when unclear.

---

## Triage & Severity (quick)
- **P0**: production crash — hotfix & immediate release.
- **P1**: blocking flows — high priority.
- **P2**: functional but non-blocking.
- **P3**: minor / cosmetic.

Record severity in the issue title and memory entry.

---

## Debugging Steps (detailed)

### 1) Gather 
- Create/update issue with environment, git sha, and reproducible steps.
- Collect evidence (logs, screenshots, HAR, CI artifacts).
- Snapshot: `git rev-parse --short HEAD`, `node -v`, `expo --version`, `pnpm -v`.

### 2) Reproduce & Isolate 
- Reproduce locally or create a minimal repro branch.
- Use `git bisect` if unknown regression origin.
- Narrow to package/module and form hypothesis.

### 3) Run commands — WAIT FOR COMPLETION (mandatory)
- **Before running**: state expected outcome in memory entry.
- **Run command** (example):
  ```bash
  pnpm -w test
  ```
- **Wait** until the command completes and capture exit code & full output.
- **Parse logs**: search for stack traces, failing test names, network errors, or uncaught exceptions.
- **Record** the console output into the memory entry as an artifact (attach path or paste snippet).

> **Why this matters**: race conditions and intermittent errors often need the full console context. The agent must rely on actual terminal output before changing code or concluding success/failure.

### 4) Implement minimal fix & test
- Create branch: `fix/<area>/<short>` or `hotfix/<id>`.
- Make minimal change, add unit tests if feasible.
- Run relevant commands and **wait** for them to finish:
  - `pnpm -w lint`
  - `pnpm -w test`
  - `pnpm -w typecheck`
  - `cd apps/adera-ptp && expo start --platform web` (when verifying web builds)
- Add verbose logs if needed to capture failing condition reproducibly.

### 5) PR, CI & Verification
- Push branch, open PR with memory-entry link and reproduction steps.
- CI must run automatically; agent watches CI and waits for full run completion, then parses CI artifacts & logs.
- Do not merge until tests/builds pass and a human reviewer approves.

### 6) Deploy & Observe
- Deploy to staging; run smoke tests (agent-run)
- Agent waits for deployment commands to complete and parses deployment logs.
- Observe monitoring (Sentry, metrics) for short observation window as specified in memory entry.

### 7) Close & Postmortem
- Update memory entry: root cause, fix, tests, files, PR link, deployment IDs.
- If P0/P1: write a short postmortem with prevention steps.
- Add follow-up tasks to backlog (e.g., increased test coverage or improved alerts).

---

## Memory entry template (must be saved for each debug task)
Save under `.adera/memory/` as `YYYYMMDD-ISSUE-<ID>-debug.md`

```
# Debug Memory: ISSUE-<ID> - <short-title>
- Date, Branch, Git SHA
- Severity: P0/P1/P2/P3
- Repro steps
- Commands run (with exact stdout/stderr captures and exit codes)
- Console artifacts: path or inline snippet
- Root cause hypothesis
- Fix summary + tests added
- Deployment & monitoring links
- Next steps & owner
```

---

## Useful commands & tips
- Monorepo start: `pnpm install && pnpm turbo run dev`
- Run unit tests: `pnpm -w test`
- Run lint/type: `pnpm -w lint && pnpm -w typecheck`
- Recreate RN build: follow Expo/EAS docs (agent must reference them before heavy operations). fileciteturn0file1
- Capture Android logs: `adb logcat`
- Capture iOS logs: `xcrun simctl spawn booted log stream --level debug`

---

## Acceptance criteria
- All repro steps succeed locally & on staging.
- Unit/E2E tests pass in CI.
- Monitoring shows no regressions in the observation window.
- Memory entry + changelog updated and PR merged per project rule.

---

## Escalation & templates
- **P0 Slack/Email**: include memory entry link, PR, hotfix branch, and contact oncall.
- **Postmortem**: short cause, impact, fix, prevention, owner.

---

**End of Debug Workflow**
