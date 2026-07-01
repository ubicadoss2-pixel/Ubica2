# Verify and Enforce Consistent Fraunces Font Across the App

## Goal Description
The user wants the entire application to use the same typography as the "Ubica2" logo, which is the **Fraunces** font. While global variables have been set, many component‑level styles still reference other fonts (e.g., `Outfit`, `Inter`, or hard‑coded `sans-serif`). This plan outlines how to audit the codebase, replace any overrides, and guarantee a unified font experience.

## User Review Required
- **Confirm** that it is acceptable to replace all occurrences of other fonts with the global `var(--font-display)` token (which resolves to Fraunces).  
- **Approve** the list of files that will be modified.  
- If any component should keep a distinct font (unlikely), let us know which and why.

## Open Questions
> [!IMPORTANT]
> *Do you want any component to retain a custom font (e.g., `monospace` for code blocks) or is the Fraunces font for **every** textual element?*

## Proposed Changes
### 1. Audit Font Declarations
- Run a recursive search for `font-family` across `fronted/src/app`.
- Identify lines that:
  - Use a fallback other than `var(--font-display)` (e.g., `Outfit`, `Inter`).
  - Hard‑code a specific family (`sans-serif`, `monospace`).
  - Declare fonts via custom CSS variables (`--font-sans`, `--font-display`) but include unexpected fallbacks.

### 2. Update Component SCSS Files
For each file where a non‑Fraunces font is found, replace the declaration with the global token:
```scss
font-family: var(--font-display);
```
- **admin.component.scss**: line 16 currently uses `var(--font-display, 'Outfit', sans-serif)` → remove fallbacks.
- **shell.component.scss** (shared layout): uses `'Inter', sans-serif` → replace.
- Any other component SCSS files that reference `'Outfit'`, `'Inter'`, or other families.

### 3. Update Inline Styles / HTML Templates (if any)
Search HTML templates (`*.component.html`) for `style="font-family:` or `<style>` blocks and replace accordingly.

### 4. Verify Global Variables
- Ensure `--font-display` and `--font-sans` are both set to `'Fraunces', Georgia, serif` in `styles.scss` (already done).
- Remove any redundant font‑family definitions in `:root` that could conflict.

### 5. Testing & Validation
- Run the application locally (`npm run dev`).
- Visually inspect multiple routes (home, admin, place‑detail, agenda, etc.) for font consistency.
- Use browser dev tools to confirm computed `font-family` resolves to `Fraunces`.

## Verification Plan
### Automated Tests
- No unit tests exist for styling; we'll rely on manual visual checks.

### Manual Verification
1. Launch the dev server.
2. Navigate to each major view:
   - Home page
   - Admin dashboard
   - Place detail popup
   - Agenda view
   - Settings page
3. Open the browser inspector on a representative element (e.g., `<h1>`, `<button>`, paragraph) and verify `font-family` resolves to `Fraunces`.
4. Capture screenshots of a few pages as proof.

---
*Once approved, the task list will be generated and work will commence.*
