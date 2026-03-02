# Accessibility Test Plan — WCAG 2.1 AA / 2.2 Compliance

**Project:** Request Submission Form  
**Standard:** WCAG 2.1 AA (primary) · WCAG 2.2 (partial)  
**Tags:** `@accessibility` · `@regression`  
**File:** `tests/accessibility/ui_accessibility.spec.ts`  
**Tooling:** Playwright · @axe-core/playwright 4.11.1  
**Total tests:** 36 (25 passing · 11 `test.fail` — documented app bugs)

**Run all accessibility tests:**
```bash
npx playwright test tests/accessibility/ui_accessibility.spec.ts
```

**Run regression subset only:**
```bash
npx playwright test --grep "@regression"
```

**Run a single test by ID:**
```bash
npx playwright test --grep "9\.14"
```

---

## Table of Contents

0. [Basic Visual & Keyboard Checks](#section-0-basic-visual--keyboard-checks)
1. [Semantic & Accessible Name Validation](#section-1-semantic--accessible-name-validation)
2. [Keyboard & Focus Management](#section-2-keyboard--focus-management)
3. [Error Handling Accessibility](#section-3-error-handling-accessibility)
4. [ARIA & Roles Validation](#section-4-aria--roles-validation)
5. [Visual Accessibility — Axe Scans](#section-5-visual-accessibility--axe-scans)
6. [Screen Reader Behavior](#section-6-screen-reader-behavior)
7. [Full WCAG Audit](#section-7-full-wcag-audit)
8. [Advanced Structural Accessibility](#section-8-advanced-structural-accessibility)
9. [Skip Links & Landmark Regions](#section-9-skip-links--landmark-regions)
10. [ARIA-Invalid & Error Summary](#section-10-aria-invalid--error-summary)
11. [Dynamic Content & SPA Focus Management](#section-11-dynamic-content--spa-focus-management)
12. [Focus Appearance — WCAG 2.2](#section-12-focus-appearance--wcag-22)
13. [Focus Not Obscured — WCAG 2.2](#section-13-focus-not-obscured--wcag-22)
14. [Target Size — WCAG 2.2](#section-14-target-size--wcag-22)
15. [Non-Text Contrast](#section-15-non-text-contrast)
- [Known App Bugs](#known-app-bugs)
- [WCAG Coverage Summary](#wcag-coverage-summary)
- [Automation Limits](#automation-limits)

---

## Section 0: Basic Visual & Keyboard Checks

> Smoke-level sanity checks included in the `@regression` suite.

| # | Test ID | Description | WCAG | Status |
|---|---------|-------------|------|--------|
| 1 | `9.1` | Form label elements (`Full Name`, `Project Description`) are visible in the DOM | — | ✅ Pass |
| 2 | `9.2` | Required field labels contain an asterisk `*` indicator | — | ✅ Pass |
| 3 | `9.3` | Form is fully operable via keyboard only — `.focus()` triggers input; Tab traverses fields; values are accepted | — | ✅ Pass |

---

## Section 1: Semantic & Accessible Name Validation

> Verifies that every input has a programmatically determinable name reachable by assistive technology.

| # | Test ID | Description | WCAG | Status |
|---|---------|-------------|------|--------|
| 4 | `9.4` | Each input has a valid label association: `for`/`id`, `aria-labelledby` (with DOM reference verified), or non-empty `aria-label` | 1.3.1 | ✅ Pass |
| 5 | `9.5` | Accessible name is computed correctly — inputs and button reachable by exact role + name via Playwright's accessibility tree | 4.1.2 | ✅ Pass |
| 6 | `9.6` | Required inputs carry the `required` attribute or `aria-required="true"` | 1.3.1 | ✅ Pass |

---

## Section 2: Keyboard & Focus Management

> Verifies full keyboard operability and correct focus behaviour.

| # | Test ID | Description | WCAG | Status |
|---|---------|-------------|------|--------|
| 7 | `9.7` | Tab order is logical: Full Name → Email → Description → Submit | 2.4.3 | ✅ Pass |
| 8 | `9.8` | Focused input has a visible indicator: `outline-width ≥ 2 px` or non-zero `box-shadow` spread | 2.4.7 | ✅ Pass |
| 9 | `9.9` | Shift+Tab navigates in reverse order: Submit → Description → Email → Full Name | 2.4.3 | ✅ Pass |
| 10 | `9.10` | No keyboard trap — pressing Tab from every input moves focus away | 2.1.2 | ✅ Pass |
| 11 | `9.11` | Form submits correctly when Enter is pressed on the focused Submit button | — | ✅ Pass |

---

## Section 3: Error Handling Accessibility

> Verifies that validation errors are communicated to assistive technology.

| # | Test ID | Description | WCAG | Status |
|---|---------|-------------|------|--------|
| 12 | `9.12` | Required inputs have `aria-describedby` pointing to a visible error element AND a `role=alert` / `aria-live` region is present | 3.3.1 | 🐛 Bug |
| 13 | `9.13` | After failed submit, at least one `role=alert`, `aria-live="assertive"`, or `aria-live="polite"` region exists | 3.3.1 | 🐛 Bug |
| 14 | `9.14` | After failed submit, focus lands specifically on `fullNameInput` — the first invalid field in DOM order | 3.3.1 | ✅ Pass |

---

## Section 4: ARIA & Roles Validation

> Verifies correct use of roles and that ARIA attributes do not hide interactive elements from AT.

| # | Test ID | Description | WCAG | Status |
|---|---------|-------------|------|--------|
| 15 | `9.15` | No `input`, `button`, `textarea`, `select`, or `a[href]` is inside or directly carries `aria-hidden="true"` | 4.1.2 | ✅ Pass |
| 16 | `9.16` | Exactly 3 textbox roles present; Submit button reachable by name; at least one heading role exists | 4.1.2 | ✅ Pass |

---

## Section 5: Visual Accessibility — Axe Scans

> Automated axe-core rule-based scans targeting specific ARIA and label correctness rules.

| # | Test ID | Description | WCAG | Status |
|---|---------|-------------|------|--------|
| 17 | `9.17` | Axe smoke scan on 10 targeted ARIA / label rules: `label`, `aria-roles`, `aria-valid-attr`, `button-name`, etc. | 4.1.2 | ✅ Pass |
| 18 | `9.17a` | axe `color-contrast` rule — text contrast ≥ 4.5:1 | 1.4.3 | 🐛 Bug |
| 19 | `9.17b` | axe `html-has-lang` rule — `<html>` element must have a `lang` attribute | 3.1.1 | 🐛 Bug |

---

## Section 6: Screen Reader Behavior

> Verifies content is perceivable by screen readers without sighted interaction.

| # | Test ID | Description | WCAG | Status |
|---|---------|-------------|------|--------|
| 20 | `9.19` | When a `placeholder` attribute is present, the input must also have a permanent label (`label[for]`, `aria-label`, or `aria-labelledby`) | 3.3.2 | ✅ Pass |
| 21 | `9.20` | After successful submit, the success heading is visible and not inside an `aria-hidden` container | — | ✅ Pass |
| 22 | `9.20a` | Success heading or its ancestor carries `role=status`, `role=alert`, `aria-live="polite"`, or `aria-live="assertive"` | 4.1.3 | 🐛 Bug |

---

## Section 7: Full WCAG Audit

> Comprehensive axe-core WCAG 2.1 A + AA audit; known unfixable app bugs are excluded and tracked individually.

| # | Test ID | Description | WCAG | Status |
|---|---------|-------------|------|--------|
| 23 | `9.21` | Full axe-core scan tagged `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` with zero violations. Rules `color-contrast` and `html-has-lang` excluded (tracked in 9.17a / 9.17b) | 2.1 AA | ✅ Pass |

---

## Section 8: Advanced Structural Accessibility

> Page-level structure checks for heading hierarchy and landmark regions.

| # | Test ID | Description | WCAG | Status |
|---|---------|-------------|------|--------|
| 24 | `9.22` | No heading level is skipped when descending (e.g. h1 → h3 is invalid; ascending jumps are permitted) | 1.3.1 | 🐛 Bug |
| 25 | `9.23` | Page contains a `<main>` element or `role="main"` landmark | 1.3.6 | 🐛 Bug |

---

## Section 9: Skip Links & Landmark Regions

> Verifies page navigation shortcuts required for keyboard-only users.

| # | Test ID | Description | WCAG | Status |
|---|---------|-------------|------|--------|
| 26 | `9.24` | First Tab stop is a skip-to-content anchor; activating it moves focus to the target region | 2.4.1 | 🐛 Bug |
| 27 | `9.25` | Page exposes `role=banner` (header) and `role=navigation` (nav) landmark regions | 1.3.6 | 🐛 Bug |

---

## Section 10: ARIA-Invalid & Error Summary

> Verifies programmatic invalid-state signalling and error summarisation.

| # | Test ID | Description | WCAG | Status |
|---|---------|-------------|------|--------|
| 28 | `9.26` | After failed submit, required inputs carry `aria-invalid="true"` | 3.3.1 | 🐛 Bug |
| 29 | `9.27` | After failed submit, a visible error summary region (`role=alert`, `role=group[aria-labelledby]`, or `aria-live="assertive"`) is present | 3.3.1 | 🐛 Bug |

---

## Section 11: Dynamic Content & SPA Focus Management

> Verifies correct focus movement after asynchronous state transitions.

| # | Test ID | Description | WCAG | Status |
|---|---------|-------------|------|--------|
| 30 | `9.28` | After successful submit the success heading (or a `tabindex`-enabled container) receives programmatic focus | 2.4.3 | ✅ Pass |

---

## Section 12: Focus Appearance — WCAG 2.2

> WCAG 2.4.11 (new in 2.2): focus indicator must meet minimum area and contrast requirements.

| # | Test ID | Description | WCAG | Status |
|---|---------|-------------|------|--------|
| 31 | `9.29` | Focus indicator area ≥ component perimeter × 2 px (computed from `outline-width`, `outline-offset`, and `box-shadow` spread) | 2.4.11 | 🐛 Bug |
| 32 | `9.30` | Focus indicator colour has ≥ 3:1 contrast ratio against the nearest opaque background, computed using WCAG linearised luminance | 2.4.11 | ✅ Pass |

---

## Section 13: Focus Not Obscured — WCAG 2.2

> WCAG 2.4.12 (new in 2.2): focused elements must not be entirely hidden by sticky or fixed content.

| # | Test ID | Description | WCAG | Status |
|---|---------|-------------|------|--------|
| 33 | `9.31` | Each focusable element is sampled at 5 points (centre + 4 corners) via `elementFromPoint`; fails only if all points are covered by a different layer | 2.4.12 | ✅ Pass |

---

## Section 14: Target Size — WCAG 2.2

> WCAG 2.5.8 (new in 2.2): interactive targets must be at least 24×24 CSS px.

| # | Test ID | Description | WCAG | Status |
|---|---------|-------------|------|--------|
| 34 | `9.32` | All rendered `input`, `button`, `textarea`, `a[href]`, and ARIA-equivalent elements have `width ≥ 24` and `height ≥ 24` CSS px via `getBoundingClientRect` | 2.5.8 | ✅ Pass |

---

## Section 15: Non-Text Contrast

> WCAG 1.4.11: UI component boundaries must have ≥ 3:1 contrast against adjacent colours.

| # | Test ID | Description | WCAG | Status |
|---|---------|-------------|------|--------|
| 35 | `9.33` | Input `borderTopColor` vs nearest opaque background — contrast ratio ≥ 3:1, computed inline using WCAG luminance formula | 1.4.11 | ✅ Pass |
| 36 | `9.34` | axe-core `color-contrast-enhanced` rule (7:1 AAA threshold — strictest available in axe 4.11.1; no standalone `non-text-contrast` rule exists in this version) | 1.4.6 / 1.4.11 | ✅ Pass |

---

## Known App Bugs

All bugs are tracked as `test.fail()` — they run and assert; CI reports them as **expected failures**.  
They will automatically flip to **unexpected passes** once the app fixes each issue.

| Test ID | Bug | WCAG | Priority |
|---------|-----|------|----------|
| `9.12` | Inputs have no `aria-describedby` linking to error messages; no `role=alert` / `aria-live` region present after validation | 3.3.1 | 🔴 Critical |
| `9.13` | No `role=alert` or `aria-live` region populated after form submission fails | 3.3.1 | 🔴 Critical |
| `9.17a` | `color-contrast` axe violation — text contrast below 4.5:1 | 1.4.3 | 🔴 Critical |
| `9.17b` | `<html>` element has no `lang` attribute | 3.1.1 | 🔴 Critical |
| `9.20a` | Success container has no `role=status` or `aria-live` — focus management alone is present | 4.1.3 | 🟡 Major |
| `9.22` | Heading hierarchy skips h2 (h1 → h3 found on page) | 1.3.1 | 🟡 Major |
| `9.23` | No `<main>` or `role="main"` landmark on the page | 1.3.6 | 🟡 Major |
| `9.24` | No skip-to-content link as first focusable element | 2.4.1 | 🟡 Major |
| `9.25` | No `role=banner` (header) or `role=navigation` landmark | 1.3.6 | 🟡 Major |
| `9.26` | Inputs do not receive `aria-invalid="true"` after failed validation | 3.3.1 | 🔴 Critical |
| `9.27` | No error summary region after failed submission | 3.3.1 | 🔴 Critical |
| `9.29` | Focus indicator area is below the WCAG 2.4.11 minimum (perimeter × 2 px) | 2.4.11 | 🟡 Major |

---

## WCAG Coverage Summary

| WCAG Criterion | Description | Covered by | Auto? |
|----------------|-------------|------------|-------|
| 1.3.1 | Info and Relationships | 9.4, 9.6, 9.22 | ✅ |
| 1.3.6 | Identify Purpose | 9.23, 9.25 | ✅ |
| 1.4.1 | Use of Color | 9.2 (symbol check) | ✅ partial |
| 1.4.3 | Contrast (Minimum) | 9.17a, 9.21 | ✅ |
| 1.4.6 | Contrast (Enhanced) | 9.34 | ✅ |
| 1.4.11 | Non-text Contrast | 9.33, 9.34 | ✅ partial |
| 2.1.2 | No Keyboard Trap | 9.10 | ✅ |
| 2.4.1 | Bypass Blocks (skip link) | 9.24 | ✅ |
| 2.4.3 | Focus Order | 9.7, 9.9, 9.28 | ✅ |
| 2.4.7 | Focus Visible | 9.8 | ✅ |
| 2.4.11 | Focus Appearance *(2.2)* | 9.29, 9.30 | ✅ partial |
| 2.4.12 | Focus Not Obscured *(2.2)* | 9.31 | ✅ partial |
| 2.5.8 | Target Size *(2.2)* | 9.32 | ✅ |
| 3.1.1 | Language of Page | 9.17b | ✅ |
| 3.3.1 | Error Identification | 9.12, 9.13, 9.14, 9.26, 9.27 | ✅ |
| 3.3.2 | Labels or Instructions | 9.19 | ✅ |
| 4.1.2 | Name, Role, Value | 9.5, 9.15, 9.16, 9.17 | ✅ |
| 4.1.3 | Status Messages | 9.20, 9.20a | ✅ |

---

## Automation Limits

The following WCAG 2.2 criteria cannot be meaningfully automated and require **manual audit**:

| Criterion | Reason |
|-----------|--------|
| **2.4.11** Focus Appearance — offset & obscuring | Computing whether the indicator is obscured by the component itself requires pixel-level rendering inspection beyond CSS computed styles |
| **2.4.13** Focus Not Obscured (Enhanced) | Requires testing with every possible sticky/overlay combination across scroll positions |
| **3.2.6** Consistent Help | UX/conceptual criterion — requires a human to judge whether help appears consistently |
| **3.3.7** Redundant Entry | Depends on multi-step business flow context; not determinable from DOM state alone |
| **3.3.8** Accessible Authentication | Cognitive burden assessment is not machine-detectable; paste restriction is testable (not applicable here) |
| **1.4.11** Non-text Contrast (icons/graphics) | axe 4.11.1 has no `non-text-contrast` rule; icon and graphic boundaries require visual review |
| Real screen reader experience | VoiceOver / NVDA / JAWS announcement quality cannot be observed from Playwright |
