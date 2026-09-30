---
name: anti-frankenstein-architect
description: Senior Architecture Guardian and Anti-Frankenstein Protocol. Enforces strict modularity, bans God Components (>400 lines), prevents duplicate source mirroring, establishes a unified storage layer, isolates pure domain logic from UI, and audits every new feature against architectural bloating.
version: "1.0.0"
---

# 🛡️ Anti-Frankenstein Architecture Protocol & Guardian

This skill acts as a strict architectural guardian for software development. It prevents projects from degrading into "Frankenstein MVPs"—systems composed of massive monolithic files, duplicated source trees, mixed persistence paradigms, and unmaintainable feature stitching.

---

## 🛑 The 5 Golden Rules (Strict Enforcement)

### 1. The 400-Line Component Limit (No "God Components")
* **Rule**: No React component, page (`page.tsx`), or layout (`layout.tsx`) may exceed **400 lines of code**.
* **Enforcement**:
  - Modals **MUST** live in `src/components/<domain>/<ModalName>.tsx`.
  - Tables and complex lists **MUST** live in `src/components/<domain>/<TableName>.tsx`.
  - Keypads, headers, and auxiliary widgets **MUST** be extracted immediately upon exceeding 150 lines.
  - Presentation components must contain **zero direct hardware I/O or raw database queries**.

### 2. Single Source of Truth (Zero Code Mirroring)
* **Rule**: Never maintain identical duplicate directories (e.g. `src/` and `desktop/src/` or `app/` and `app-mobile/`).
* **Enforcement**:
  - All targets (Desktop, Web, PWA, Electron, Capacitor) must consume the same unified `src/` codebase.
  - Packaging scripts (Inno Setup, Tauri, Electron-builder) must point directly to the central build artifacts.
  - Feature flags and platform adapters (`isDesktop()`, `isMobile()`) must handle environmental differences dynamically.

### 3. Unified Storage Layer (No Raw `localStorage` Sprawl)
* **Rule**: Presentation components are strictly forbidden from directly calling raw `localStorage.getItem` or `localStorage.setItem` in rendering loops.
* **Enforcement**:
  - All storage operations must go through a single typed `StorageService` or `Repository`.
  - Storage operations must provide memory caching to prevent redundant disk/storage access on every render cycle.
  - Clear separation between ephemeral UI state (`useState`), persistent local data (IndexedDB / Dexie), and remote synchronization (Firebase / REST).

### 4. Domain Logic & Business Rules Isolation
* **Rule**: Mathematical calculations, currency conversions, billing rules, and tax liquidations must be **pure TypeScript functions** with zero React/DOM dependencies.
* **Enforcement**:
  - Put all calculation logic in `src/lib/<domain>/`.
  - Calculation functions must be 100% testable without mounting a React component or initializing window events.

### 5. The Grafting Gate (Clean Feature Integration)
* **Rule**: Never inject an entire new feature (e.g. AI models, Bluetooth scale polling, WebSockets, scrapers) inline into an existing UI page.
* **Enforcement**:
  - Wrap third-party integrations or hardware drivers in dedicated custom hooks (e.g., `useVisualScanner()`, `useDigitalScale()`, `useThermalPrinter()`).
  - The UI page only calls the hook and renders the returned state.

---

## 🔍 Pre-Commit Anti-Frankenstein Checklist

Before finishing any feature or committing code, the agent MUST verify:
- [ ] Are all modified or created files under 400 lines?
- [ ] Is there any duplicated file copy between folders?
- [ ] Are financial / currency calculations isolated in pure helper functions?
- [ ] Are `useMemo` and `useCallback` used for high-frequency contexts?
- [ ] Is all state storage centralized instead of scattered in ad-hoc `localStorage` calls?
- [ ] Are object URLs and event listeners cleanly disposed on unmount?

---

## 🚀 Refactoring Playbook (How to Deconstruct Legacy Monoliths)

1. **Step 1 - Isolate Types & State**: Extract interfaces and state contracts into `<domain>.types.ts`.
2. **Step 2 - Extract Subcomponents**: Move modals, sidebars, summary cards, and tables into separate files.
3. **Step 3 - Extract Business Hook**: Move `useEffect`, handlers, and async actions into a custom `use<Feature>()` hook.
4. **Step 4 - Clean Page Shell**: The main `page.tsx` becomes a clean, readable orchestrator of under 200 lines.
