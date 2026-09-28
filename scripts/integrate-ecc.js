const fs = require('fs');
const path = require('path');

const srcBase = path.join(__dirname, '..', '.temp-ecc');
const targetBase = path.join(__dirname, '..', '.agents');

// 1. Ensure directories exist
const agentsDir = path.join(targetBase, 'agents');
const skillsDir = path.join(targetBase, 'skills');
const workflowsDir = path.join(targetBase, 'workflows');
const rulesDir = path.join(targetBase, 'rules');

[agentsDir, skillsDir, workflowsDir, rulesDir].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// 2. Copy Agents
const srcAgents = path.join(srcBase, 'agents');
if (fs.existsSync(srcAgents)) {
  const agentFiles = fs.readdirSync(srcAgents).filter(f => f.endsWith('.md'));
  agentFiles.forEach(f => {
    fs.copyFileSync(path.join(srcAgents, f), path.join(agentsDir, f));
  });
  console.log(`Copied ${agentFiles.length} agent definition files to .agents/agents/`);
}

// 3. Copy Selected High-Value Testing, QA, Security, and Code Quality Skills
const skillsToCopy = [
  'browser-qa',
  'e2e-testing',
  'react-testing',
  'react-performance',
  'security-review',
  'security-scan',
  'error-handling',
  'verification-loop',
  'tdd-workflow',
  'coding-standards',
  'accessibility',
  'frontend-a11y',
  'windows-desktop-e2e',
  'agentic-engineering',
  'ai-regression-testing',
  'database-migrations',
  'intent-driven-development'
];

skillsToCopy.forEach(skill => {
  const srcSkill = path.join(srcBase, 'skills', skill);
  const destSkill = path.join(skillsDir, skill);
  if (fs.existsSync(srcSkill)) {
    fs.cpSync(srcSkill, destSkill, { recursive: true, force: true });
    console.log(`Copied skill: ${skill}`);
  }
});

// 4. Create an ECC Testing & Agent Suite Rule
const eccRuleContent = `
## ECC (Everything Claude Code) Testing & Quality Assurance Integration

This workspace has integrated the **ECC (Everything Claude Code) Agent & Testing Suite** (by @affaan-m).

### Available Subagents in .agents/agents/
- **\`e2e-runner\`**: Orchestrates end-to-end user journeys and Playwright automation.
- **\`code-reviewer\`**: Deep architectural, type safety, and zero-regression code auditor.
- **\`security-reviewer\`**: Detects auth leaks, permission flaws, and data tampering risks.
- **\`silent-failure-hunter\`**: Scans for unhandled promises, swallowed errors, and missing try/catch blocks.
- **\`react-reviewer\`**: Audits React 18 / Next.js renders, memory leaks, and hook dependency arrays.
- **\`performance-optimizer\`**: Identifies slow queries, excessive DOM nodes, and layout shifts.
- **\`a11y-architect\`**: Enforces WCAG AAA compliance, high contrast, and accessibility semantics.

### Standard Verification Workflow
1. Run static checks and type validation: \`npm run build\` or \`tsc --noEmit\`.
2. Perform targeted unit/integration tests with \`tdd-workflow\` and \`verification-loop\`.
3. Audit UI contrast and touch ergonomics according to KlikPOS zero-regression standards.
`;

fs.writeFileSync(path.join(rulesDir, 'ecc-testing-suite.md'), eccRuleContent.trim());
console.log('Created .agents/rules/ecc-testing-suite.md');

// 5. Clean up temporary clone folder
try {
  fs.rmSync(srcBase, { recursive: true, force: true });
  console.log('Cleaned up .temp-ecc repository.');
} catch (e) {
  console.warn('Note: .temp-ecc cleanup pending or ignored');
}

console.log('ECC Agent & Testing Suite successfully integrated!');
