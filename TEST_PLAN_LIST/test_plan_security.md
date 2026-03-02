# Security Test Plan — XSS, Output Encoding & API Hardening

**Project:** Request Submission Form + Backapp API  
**Tags:** `@security` · `@regression`  
**Test Files:**
- `tests/security/ui_security.spec.ts`
- `tests/security/api_security.spec.ts`

**Total tests:** 37 (13 UI passing · 4 UI known-fail as CI security gates · 16 API passing · 1 API known-fail · 2 API skipped — documented app bugs)

**Run all security tests:**
```bash
npx playwright test --grep "@security"
```

**Run UI security only:**
```bash
npx playwright test tests/security/ui_security.spec.ts
```

**Run API security only:**
```bash
npx playwright test tests/security/api_security.spec.ts
```

---

## Table of Contents

### UI Tests
1. [XSS Prevention](#1-xss-prevention)
2. [Output Encoding](#2-output-encoding)
3. [Special Character & Unicode Acceptance](#3-special-character--unicode-acceptance)
4. [Advanced XSS Scenarios](#4-advanced-xss-scenarios)
5. [Link Safety](#5-link-safety)
6. [HTTP Security Headers](#6-http-security-headers)

### API Tests
7. [Data Validation & Edge Cases](#7-data-validation--edge-cases)
8. [Input Validation — Missing & Malformed Payloads](#8-input-validation--missing--malformed-payloads)
9. [Rate Limiting — Brute Force Protection](#9-rate-limiting--brute-force-protection)
10. [Behavioural — Email Case Sensitivity](#10-behavioural--email-case-sensitivity)
11. [Authorization Bypass](#11-authorization-bypass)
12. [User Enumeration](#12-user-enumeration)
13. [CORS Policy](#13-cors-policy)
14. [Error Leakage](#14-error-leakage)
15. [Error Handling & Responses](#15-error-handling--responses)
16. [API Response Headers](#16-api-response-headers)

### Reference
- [Known App Bugs](#known-app-bugs)
- [Detection Strategy Notes](#detection-strategy-notes)

---

## UI Tests

**File:** `tests/security/ui_security.spec.ts`  
**beforeEach:** navigates to form, mocks API success, registers dialog guard (`guardAgainstDialogs`)  
**Dialog guard:** any `alert()` / `confirm()` / `prompt()` triggered during a test causes immediate failure — proves no payload executed as JavaScript

---

## 1. XSS Prevention

> Verifies that script payloads submitted through form fields are not executed and not injected into the DOM as live HTML nodes.

| # | Test ID | Test Name | Payload | Detection Method | Status |
|---|---------|-----------|---------|-----------------|--------|
| 1 | `4.1` | XSS: `<script>` tag in Full Name does not execute | `<script>alert('xss')</script> John` | Dialog guard + filter all `<script>` nodes whose `textContent` includes `"alert"` → must be 0 | ✅ Pass |
| 2 | `4.2` | XSS: `<img onerror>` payload in Description does not execute | `<img src=x onerror=alert('xss')>` | Dialog guard + query all `img[src=x][onerror]` nodes → must be 0 | ✅ Pass |
| 3 | `4.3` | XSS: inline event-handler payload does not execute | `<div onmouseover="alert('xss')">hover</div>` | Dialog guard + baseline delta of all `on*` attributes across `document.body` → delta must be 0 | ✅ Pass |

---

## 2. Output Encoding

> Verifies that HTML-sensitive characters are treated as data and not interpreted as markup.
>
> **Strategy:** baseline element counts are captured before the form is filled; after submission the counts must not have increased. Input value is also asserted verbatim before submit (reflected output proof).

| # | Test ID | Payload | Encoding Verified | DOM Check | Reflected Output | Status |
|---|---------|---------|-------------------|-----------|-----------------|--------|
| 4 | `4.4a` | `<b>bold</b>` | Angle brackets `< >` | `<b>` count delta = 0 | `inputValue()` === raw payload | ✅ Pass |
| 5 | `4.4b` | `AT&T and A&B` | Ampersand `&` | — | `inputValue()` === raw payload | ✅ Pass |
| 6 | `4.4c` | `He said "hello"` | Double quotes `"` | — | `inputValue()` === raw payload | ✅ Pass |
| 7 | `4.4d` | `O'Brien` | Single quote `'` | — | `inputValue()` === raw payload | ✅ Pass |
| 8 | `4.4e` | `</script><script>alert(1)</script>` | Script context break-out | `<script>` count delta = 0 + content filter for `"alert"` = 0 | `inputValue()` === raw payload | ✅ Pass |

---

## 3. Special Character & Unicode Acceptance

> Verifies that legitimate non-ASCII characters and punctuation are accepted without corruption or unexpected side-effects.

| # | Test ID | Test Name | Input | Expected | Status |
|---|---------|-----------|-------|----------|--------|
| 9 | `4.5` | Special characters and Unicode are accepted safely | `José María García-López O'Brien` / `Web development` | Form submits successfully; dialog guard silent | ✅ Pass |

---

## 4. Advanced XSS Scenarios

> Stored XSS: simulates a server that echoes back previously-injected payloads in API response fields. Attribute injection: tests whether a `"` in input value can break out of an HTML attribute context.

| # | Test ID | Test Name | Technique | Detection Method | Status |
|---|---------|-----------|-----------|-----------------|--------|
| 10 | `4.11` | Stored XSS: API response containing XSS payload is not rendered as markup | Playwright LIFO route override — orders API returns `message: <script>alert('stored-xss')` and `orderId: <img src=x onerror=...>` | `<script>` content filter for `"stored-xss"` = 0 + `img[src=x][onerror]` count = 0 | ✅ Pass |
| 11 | `4.12` | Attribute injection: double-quote breakout does not create event handlers | Payload: `" onmouseover="alert(1)" x="` — closes attribute context in un-escaped templates | Baseline delta of all `on*` attrs across `document.body` → delta must be 0 | ✅ Pass |

---

## 5. Link Safety

> `target="_blank"` without `rel="noopener"` allows the opened tab to access `window.opener` and silently redirect the parent page (reverse tabnapping).

| # | Test ID | Test Name | Check | Expected | Status |
|---|---------|-----------|-------|----------|--------|
| 12 | `4.13` | All `target="_blank"` links carry `rel="noopener"` | Query all `a[target="_blank"]`; filter those missing `"noopener"` in `rel` | Zero unsafe links; failure message lists offending hrefs | ✅ Pass |

---

## 6. HTTP Security Headers

**Sub-describe:** `HTTP Security Headers`  
**Fixture:** `request` (standalone `APIRequestContext` — no browser, no navigation dependency)  
**All 5 tests are skipped** — the server does not currently return any of these headers.  
Tests 4.6–4.9 use `test.fail()` — they run, assert, and are reported as known failures while the app bugs persist. If a header is added server-side, the test becomes an unexpected pass and CI exits 1, forcing removal of `test.fail()`.

| # | Test ID | Header | Assertion | Status |
|---|---------|--------|-----------|--------|
| 13 | `4.6` | `Content-Security-Policy` | Present + does **not** contain `unsafe-inline` or `unsafe-eval` | ❌ Known-fail (APP BUG) |
| 14 | `4.7` | `X-Content-Type-Options` | Equals `nosniff` | ❌ Known-fail (APP BUG) |
| 15 | `4.8` | `X-Frame-Options` | Matches `/^(DENY\|SAMEORIGIN)$/i` (RFC 7034) | ❌ Known-fail (APP BUG) |
| 16 | `4.9` | `Referrer-Policy` | Truthy (any explicit policy) | ❌ Known-fail (APP BUG) |
| 17 | `4.10` | `Strict-Transport-Security` | Present + URL starts with `https://` + `max-age=\d+` present | ✅ Pass |

---

## API Tests

**File:** `tests/security/api_security.spec.ts`  
**Base URL:** `process.env.API_URL`  
**Fixture:** `request` (Playwright `APIRequestContext` — no browser, no navigation)

---

## 7. Data Validation & Edge Cases

**Describe:** `Data Validation & Edge Cases`

> SQL injection payloads are parameterised across three entry points. Every case asserts no 5xx crash and no token issuance on accidental 200.

| # | Test Name | Method | Endpoint | Payload | Expected Status | Notes | Status |
|---|-----------|--------|----------|---------|-----------------|-------|--------|
| 18 | SQL injection in email — classic OR bypass | POST | `/auth/login` | `email: "admin' OR '1'='1"` | 400 / 401 / 404 | 404 acceptable: server treats payload as unknown username | ✅ Pass |
| 19 | SQL injection in email — DROP TABLE | POST | `/auth/login` | `email: "admin@example.com'; DROP TABLE users; --"` | 400 / 401 / 404 | Same as above; must not cause 5xx or issue token | ✅ Pass |
| 20 | SQL injection in password field | POST | `/auth/login` | `password: "' OR '1'='1"` | 400 / 401 / 404 | Password field is also an injection vector | ✅ Pass |
| 21 | XSS attempt in email creation | POST | `/user` | `email: "<script>alert('xss')</script>@test.com"` | 400 / 422 | Must not crash server (no 5xx) | ✅ Pass |
| 22 | Very long email string | POST | `/user` | `email: "a" × 1000 + "@example.com"` | 400 / 413 / 422 | Server must enforce input length limits | ✅ Pass |
| 23 | Special characters in email | POST | `/user` | `email: "user+test_{ts}@domain.co.uk"` | 200 / 201 | RFC 5321 valid chars (`+`, `_`) must be accepted | ✅ Pass |

---

## 8. Input Validation — Missing & Malformed Payloads

**Describe:** `Input Validation`

> Malformed or absent payloads must be rejected before auth logic runs and must never cause a 5xx.

| # | Test Name | Method | Endpoint | Payload | Expected Status | Status |
|---|-----------|--------|----------|---------|-----------------|--------|
| 24 | Login with empty body | POST | `/auth/login` | `{}` | 400 / 401 / 422 | ✅ Pass |
| 25 | Login with malformed JSON | POST | `/auth/login` | `'{ "email": admin_no_quotes }'` (invalid JSON string) | 400 / 422 | ✅ Pass |
| 26 | Create user with empty body | POST | `/user` | `{}` | 400 / 401 / 422 | ✅ Pass |

---

## 9. Rate Limiting — Brute Force Protection

**Describe:** `Rate Limiting`

> Sends up to 6 consecutive failed login attempts and expects the server to throttle the client with 429 before the loop completes. Loop is capped at 6 to avoid CI instability and accidental IP bans.

| # | Test Name | Method | Endpoint | Expected Status (any) | Status |
|---|-----------|--------|----------|-----------------------|--------|
| 27 | Brute-force login attempts trigger rate limiting (429) | POST | `/auth/login` × 6 | 429 within 6 attempts | ⏭ Skipped (APP BUG) |

---

## 10. Behavioural — Email Case Sensitivity

**Describe:** `Behavioural`

> This is a **UX / product behaviour test**, not a security test. RFC 5321 makes the local-part technically case-sensitive, but many systems normalise to lowercase. Both behaviours are acceptable as long as they are consistent. Tagged `@regression` to surface unexpected changes.

| # | Test Name | Method | Endpoint | Payload | Expected Status | Status |
|---|-----------|--------|----------|---------|-----------------|--------|
| 28 | Case sensitivity in email login | POST | `/auth/login` | `email: existing.toUpperCase()` | 200 / 201 (normalised) or 401 / 404 (case-sensitive) | ✅ Pass |

---

## 11. Authorization Bypass

**Describe:** `Authorization`

> Verifies that protected endpoints reject unauthenticated and tampered requests. Does not require seed data — uses a static unsigned JWT (`alg: none`).

| # | Test Name | Method | Endpoint | Auth Header | Expected Status | Notes | Status |
|---|-----------|--------|----------|-------------|-----------------|-------|--------|
| 29 | Protected endpoint rejects request with no token | GET | `/requests` | none | 401 / 403 / 404 | 404 = resource hidden from unauthenticated clients | ✅ Pass |
| 30 | Protected endpoint rejects tampered JWT | GET | `/requests` | `Bearer eyJhbGciOiJub25lIn0...` (`alg: none`) | 401 / 403 / 404 | structurally valid but unsigned — server must not accept | ✅ Pass |

---

## 12. User Enumeration

**Describe:** `User Enumeration`

> **APP BUG (confirmed):** The login endpoint leaks whether an email address is registered:
> - Registered email + wrong password → **401** `"Invalid credentials"`
> - Unknown email → **404** `"This username not found"`
>
> An attacker can silently enumerate the user database with no authentication. The fix is to return 401 with a generic `"Invalid credentials"` message for both cases.

| # | Test Name | Method | Endpoint | Assertion | Status |
|---|-----------|--------|----------|-----------|--------|
| 31 | Login returns same status for known and unknown email | POST | `/auth/login` ×2 | `knownEmail.status() === unknownEmail.status()` | ❌ Known-fail (APP BUG) |

---

## 13. CORS Policy

**Describe:** `CORS Policy`

> A wildcard `Access-Control-Allow-Origin: *` on an authenticated API allows any browser origin to read responses, effectively bypassing the Same-Origin Policy.

| # | Test Name | Method | Endpoint | Assertion | Status |
|---|-----------|--------|----------|-----------|--------|
| 32 | API does not return wildcard Access-Control-Allow-Origin | GET | `/health` | `acao !== "*"` | ✅ Pass |

---

## 14. Error Leakage

**Describe:** `Error Leakage`

> Error responses must never expose internal details. Six patterns are checked:
>
> | Pattern | What it catches |
> |---------|----------------|
> | `/at \w.*\(.*:\d+:\d+\)/` | JS stack frame (`at fn (file.js:1:1)`) |
> | `/\/.*\.js:\d+/` | File system path in response |
> | `/SyntaxError:\|TypeError:\|ReferenceError:/` | Raw JS error constructor names |
> | `/SQL syntax/i` | Database driver error string |
> | `/ORA-\d{5}/` | Oracle error codes |
> | `/SQLSTATE/` | Generic SQL state string |

| # | Test Name | Method | Endpoint | Payload | Assertion | Status |
|---|-----------|--------|----------|---------|-----------|--------|
| 33 | Error response does not leak a stack trace or SQL error | POST | `/auth/login` | Malformed JSON string | No pattern match in body; status < 500 | ✅ Pass |

---

## 15. Error Handling & Responses

**Describe:** `Error Handling & Responses`

| # | Test Name | Method | Endpoint | Expected Status | Status |
|---|-----------|--------|----------|-----------------|--------|
| 34 | Not found endpoint | GET | `/nonexistent-endpoint` | 404 | ✅ Pass |
| 35 | Method not allowed | POST | `/health` | 400 / 404 / 405 | ✅ Pass |

---

## 16. API Response Headers

**Describe:** `API Response Headers`

> A JSON API must declare `Content-Type: application/json` so browsers never MIME-sniff responses as HTML. `X-Content-Type-Options: nosniff` adds a second layer.

| # | Test Name | Method | Endpoint | Assertion | Status |
|---|-----------|--------|----------|-----------|--------|
| 36 | Login response declares Content-Type: application/json | POST | `/auth/login` | `content-type` header contains `"application/json"` | ✅ Pass |
| 37 | API response includes X-Content-Type-Options: nosniff | GET | `/health` | `x-content-type-options === "nosniff"` | ⏭ Skipped (APP BUG) |

---

## Known App Bugs

### UI Bugs (4 known-fail — security gates, `test.fail()`)

These tests run on every CI pass. They fail with a clear assertion error. When the bug is fixed the test becomes an unexpected pass and CI exits 1, forcing removal of `test.fail()`.

| Test ID | Bug | Impact | Fix Required |
|---------|-----|--------|-------------|
| `4.6` | `Content-Security-Policy` header absent | Browser has no script source restrictions; XSS payloads that bypass DOM checks can load external scripts | Add `Content-Security-Policy` response header without `unsafe-inline` / `unsafe-eval` |
| `4.7` | `X-Content-Type-Options` header absent | Browser may MIME-sniff responses and execute uploaded content as script | Add `X-Content-Type-Options: nosniff` |
| `4.8` | `X-Frame-Options` header absent | Page can be embedded in `<iframe>` — clickjacking attack surface | Add `X-Frame-Options: DENY` or `SAMEORIGIN` |
| `4.9` | `Referrer-Policy` header absent | Full URL (including query params / tokens) leaks to third-party domains on navigation | Add `Referrer-Policy: strict-origin-when-cross-origin` or stricter |

### API Bugs (1 known-fail — `test.fail()`, 2 skipped — `test.skip()`)

| Test # | Type | Bug | Impact | Fix Required |
|--------|------|-----|--------|-------------|
| 31 | `test.fail()` | **User Enumeration** — login returns 401 for registered emails, 404 for unknown ones | Attacker can silently enumerate the full user database with zero authentication | Return 401 + generic `"Invalid credentials"` message for both registered and unknown emails |
| 27 | `test.skip()` | **No rate limiting** on `/auth/login` | Unlimited brute-force login attempts; no 429 throttle | Implement per-IP or per-account request throttling with 429 response |
| 37 | `test.skip()` | **`X-Content-Type-Options` absent on API responses** | Browsers may MIME-sniff JSON responses as HTML, enabling script execution | Add `X-Content-Type-Options: nosniff` to all API responses |

---

## Detection Strategy Notes

| Strategy | Used In | Why |
|----------|---------|-----|
| **Dialog guard** (`page.on("dialog")`) | All UI tests via `beforeEach` | Any `alert()` / `confirm()` / `prompt()` = payload executed as JS. `removeAllListeners` first prevents duplicate registration. |
| **`<script>` content filter** | 4.1, 4.4e, 4.11 | Count only `<script>` nodes whose `textContent` includes the marker string — distinguishes payload injection from framework scripts already on the page. |
| **`on*` attribute baseline delta** | 4.3, 4.12 | Captures count of all inline event-handler attributes across `document.body` before and after submission. Delta > 0 = injection. Covers all `on*` names, not just specific ones. Scoped to `body` to avoid framework `<head>` noise. |
| **Element count baseline delta** | 4.4a, 4.4e | Safe against pages that already contain `<b>` or `<script>` from framework code — only new nodes matter. |
| **`inputValue()` reflected output** | 4.4a–4.4e | Proves payload is stored verbatim as text in the input element before submission — not stripped, encoded, or interpreted as markup by the browser or framework. |
| **LIFO route override** | 4.11 | Playwright processes `page.route()` handlers last-registered-first. A test-body route registered after `beforeEach` `mockSuccess()` wins, enabling per-test response body control. |
| **`request` fixture** | 4.6–4.10, API suite | Standalone HTTP client with no browser context — faster, appropriate for header/status checks that do not need a rendered page. |
| **Parameterised `for` loop** | SQL injection (×3) | Runs the same assertion logic across multiple payloads without duplicating test bodies. Each iteration produces an independently named and reported test. |
| **`STACK_TRACE_PATTERNS` array + loop** | Error Leakage | Centralises all leakage patterns in one constant; the assertion loop avoids repetition and produces a clear failure message identifying the matched pattern. |
| **`alg: none` JWT** | Authorization | A JWT with `{"alg":"none"}` header and no signature is structurally valid but must be rejected by any conforming JOSE implementation. Used as a cheap tamper probe that requires no setup. |
