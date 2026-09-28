## ECC (Everything Claude Code) Testing & Quality Assurance Integration

This workspace has integrated the **ECC (Everything Claude Code) Agent & Testing Suite** (by @affaan-m).

### Available Subagents in .agents/agents/
- **`e2e-runner`**: Orchestrates end-to-end user journeys and Playwright automation.
- **`code-reviewer`**: Deep architectural, type safety, and zero-regression code auditor.
- **`security-reviewer`**: Detects auth leaks, permission flaws, and data tampering risks.
- **`silent-failure-hunter`**: Scans for unhandled promises, swallowed errors, and missing try/catch blocks.
- **`react-reviewer`**: Audits React 18 / Next.js renders, memory leaks, and hook dependency arrays.
- **`performance-optimizer`**: Identifies slow queries, excessive DOM nodes, and layout shifts.
- **`a11y-architect`**: Enforces WCAG AAA compliance, high contrast, and accessibility semantics.

### Standard Verification Workflow
1. Run static checks and type validation: `npm run build` or `tsc --noEmit`.
2. Perform targeted unit/integration tests with `tdd-workflow` and `verification-loop`.
3. Audit UI contrast and touch ergonomics according to KlikPOS zero-regression standards.