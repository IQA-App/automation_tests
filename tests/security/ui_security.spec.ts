import { test, expect, Page } from "@playwright/test";
import { RequestSubmissionPage } from "../../pages/RequestSubmissionPage";
import { REQUEST_SUBMISSION } from "../../testData";

// ---------------------------------------------------------------------------
// Reusable helpers
// ---------------------------------------------------------------------------

/**
 * Registers a dialog listener on the given page that immediately dismisses
 * any alert / confirm / prompt and fails the test — signal that a payload
 * executed as JavaScript.  Call once per page, typically in beforeEach.
 */
function guardAgainstDialogs(page: Page): void {
  // Remove any previously registered listener before adding a new one.
  // Prevents duplicate listeners when the page instance is reused across hooks.
  page.removeAllListeners("dialog");
  page.on("dialog", async (dialog) => {
    await dialog.dismiss();
    throw new Error(`XSS executed — unexpected dialog: "${dialog.message()}"`);
  });
}

/**
 * Returns the count of <script> elements whose text content contains the
 * given marker string.  Used to detect injected script payloads.
 */
async function countSuspiciousScripts(page: Page, marker: string): Promise<number> {
  return page.evaluate(
    (m) => [...document.querySelectorAll("script")].filter((s) => s.textContent?.includes(m)).length,
    marker
  );
}

/**
 * Returns the count of DOM elements that carry any inline event-handler
 * attribute (onclick, onerror, onload, onmouseover, onfocus, …).
 * More thorough than querying a single attribute selector.
 */
async function countInjectedEventHandlers(page: Page): Promise<number> {
  // Scoped to document.body to avoid scanning <head> script/link elements
  // and to keep the sweep O(n) over visible DOM only — safe for large SPAs.
  return page.evaluate(() => {
    let count = 0;
    document.body.querySelectorAll("*").forEach((el) => {
      for (const attr of Array.from(el.attributes)) {
        if (attr.name.startsWith("on")) count++;
      }
    });
    return count;
  });
}

// NOTE — SQL Injection
// SQL injection is a backend vulnerability and cannot be verified at the UI layer
// when the backend is mocked (mockSuccess() always responds 200 regardless of payload).
// SQL injection coverage lives in:
//   → tests/security/api_security.spec.ts  ("SQL injection attempt in login email")

// NOTE — Reflected output confirmation
// Each encoding test asserts that the payload was stored verbatim in the input
// (via inputValue()) before submission.  This proves the value was not
// stripped, modified, or interpreted as HTML by the browser or framework.
// If the app ever exposes a submission-confirmation element, add:
//   await expect(form.previewField).toContainText(payload);
// to extend coverage to server-rendered output.

test.describe("UI Security Tests — XSS Prevention & Output Encoding", () => {
  let form: RequestSubmissionPage;

  test.beforeEach(async ({ page }) => {
    form = new RequestSubmissionPage(page);
    await form.goto();
    await form.mockSuccess();

    // Single dialog guard covering every test in this suite.
    guardAgainstDialogs(page);
  });

  // ========================================================================
  // SECTION 1 — XSS PREVENTION
  // Verifies that script payloads are not executed and are not injected into
  // the DOM as live HTML nodes.
  // ========================================================================

  test("@regression @security 4.1 XSS: <script> tag in Full Name does not execute", async ({
    page,
  }) => {
    await form.fillAndSubmit(
      REQUEST_SUBMISSION.inputs.xss.name,
      REQUEST_SUBMISSION.inputs.xss.description
    );

    // No user-supplied <script> carrying alert('xss') must exist as a DOM node.
    const injectedScripts = await page.evaluate(
      () =>
        [...document.querySelectorAll("script")].filter((s) =>
          s.textContent?.includes("alert")
        ).length
    );
    expect(injectedScripts, "XSS payload must not appear as a <script> node in DOM").toBe(0);

    await expect(form.successHeading).toBeVisible();
  });

  test("@regression @security 4.2 XSS: <img onerror> payload in Description does not execute", async ({
    page,
  }) => {
    await form.fillAndSubmit(
      REQUEST_SUBMISSION.inputs.xss.name,
      REQUEST_SUBMISSION.inputs.xss.description
    );

    // An <img src=x onerror=...> injected as live HTML would be detectable here.
    const onerrorImgs = await page.evaluate(
      () =>
        [...document.querySelectorAll("img")].filter(
          (img) => img.getAttribute("src") === "x" && img.hasAttribute("onerror")
        ).length
    );
    expect(onerrorImgs, "<img onerror> payload must not be rendered as active HTML").toBe(0);

    await expect(form.successHeading).toBeVisible();
  });

  test("@regression @security 4.3 XSS: inline event-handler payload does not execute", async ({
    page,
  }) => {
    // Payload exercises a single handler, but the sweep covers ALL on* attrs
    // so onclick / onerror / onload / onfocus injections are also caught.
    const eventPayload = `<div onmouseover="alert('xss')">hover</div>`;

    // Baseline: record how many on* attributes exist before input is submitted.
    const handlersBefore = await countInjectedEventHandlers(page);

    await form.fillAndSubmit(eventPayload, eventPayload);

    const handlersAfter = await countInjectedEventHandlers(page);
    expect(
      handlersAfter,
      `Inline event-handler payload must not inject new on* attributes (baseline was ${handlersBefore})`
    ).toBe(handlersBefore);

    await expect(form.successHeading).toBeVisible();
  });

  // ========================================================================
  // SECTION 2 — OUTPUT ENCODING
  // Verifies that HTML-sensitive characters are escaped on output, not
  // interpreted as markup.
  //
  // Strategy: capture baseline element counts BEFORE submission, then assert
  // counts did not increase AFTER submission.  This is safe even if the page
  // already contains <b> or <script> elements from its own framework code.
  // ========================================================================

  const htmlEncodingCases: Array<{ id: string; label: string; payload: string }> = [
    { id: "4.4a", label: "angle brackets",           payload: "<b>bold</b>" },
    { id: "4.4b", label: "ampersand",                 payload: "AT&T and A&B" },
    { id: "4.4c", label: "double quotes",             payload: `He said "hello"` },
    { id: "4.4d", label: "single quote / apostrophe", payload: "O'Brien" },
    { id: "4.4e", label: "script fragment break-out", payload: `</script><script>alert(1)</script>` },
  ];

  for (const { id, label, payload } of htmlEncodingCases) {
    test(`@regression @security 4.4 HTML encoding — ${id}: ${label} is not interpreted as markup`, async ({
      page,
    }) => {
      // Capture baselines before any user input is rendered.
      const { boldBefore, scriptsBefore } = await page.evaluate(() => ({
        boldBefore:    document.body.querySelectorAll("b").length,
        scriptsBefore: document.querySelectorAll("script").length,
      }));

      // Fill individually so we can assert the stored value BEFORE submission.
      await form.fillName(payload);
      await form.fillEmail(`qa+${Date.now()}@example.com`);
      await form.fillDescription(payload);

      // Reflected output: the input must store the payload as literal text —
      // not interpret it as HTML, strip it, or encode it into something else.
      const storedValue = await form.fullNameInput.inputValue();
      expect(
        storedValue,
        "Full Name input must store payload verbatim as text, not interpret it as HTML"
      ).toBe(payload);

      await form.submit();
      await expect(form.successHeading).toBeVisible();

      const { boldAfter, scriptsAfter } = await page.evaluate(() => ({
        boldAfter:    document.body.querySelectorAll("b").length,
        scriptsAfter: document.querySelectorAll("script").length,
      }));

      // 4.4a — <b> payload must not create new bold elements.
      expect(boldAfter, `<b> tag in payload must not be rendered as HTML (baseline was ${boldBefore})`).toBe(boldBefore);

      // 4.4e — script fragment break-out: check both total count (no new nodes)
      // AND specifically for alert-bearing content, consistent with test 4.1.
      expect(scriptsAfter, `Script fragment must not inject new <script> nodes (baseline was ${scriptsBefore})`).toBe(scriptsBefore);
      const alertScripts = await countSuspiciousScripts(page, "alert");
      expect(alertScripts, "No <script> with alert() content must exist after script-fragment payload").toBe(0);
    });
  }

  // ========================================================================
  // SECTION 3 — SPECIAL CHARACTER & UNICODE ACCEPTANCE
  // Verifies that legitimate non-ASCII and punctuation characters are accepted
  // without being stripped, corrupted, or causing an unexpected dialog.
  // ========================================================================

  test("@regression @security 4.5 Special characters and Unicode are accepted safely", async () => {
    await form.fillAndSubmit(
      REQUEST_SUBMISSION.inputs.specialChars.name,
      REQUEST_SUBMISSION.inputs.specialChars.description
    );

    await expect(form.successHeading).toBeVisible();
  });

  // ========================================================================
  // SECTION 5 — ADVANCED XSS SCENARIOS
  // Stored XSS: the server returns previously-injected payloads in response
  // fields; the UI must not render those fields as live HTML.
  // Attribute breakout: a double-quote closes the attribute value context,
  // injecting an inline event handler if the template does not escape attrs.
  // ========================================================================

  test("@regression @security 4.11 Stored XSS: API response containing XSS payload is not rendered as markup", async ({
    page,
  }) => {
    // Simulate stored XSS: override the orders stub with a response that
    // carries XSS payloads in its JSON fields, as if a prior attacker stored
    // them server-side and the API now echoes them back.
    // Playwright processes route handlers LIFO — this test-body route is
    // registered AFTER mockSuccess() in beforeEach and therefore wins.
    await page.route(/orders/, (route) => {
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: `<script>alert('stored-xss')</script>`,
          orderId:  `<img src=x onerror=alert('stored-xss')>`,
        }),
      });
    });

    await form.fillAndSubmit(
      REQUEST_SUBMISSION.inputs.standard.name,
      REQUEST_SUBMISSION.inputs.standard.description
    );
    await expect(form.successHeading).toBeVisible();

    // If the app rendered any response field via innerHTML these nodes appear.
    const injectedAlertScripts = await countSuspiciousScripts(page, "stored-xss");
    expect(injectedAlertScripts, "XSS in API response must not produce a <script> node").toBe(0);

    const onerrorImgs = await page.evaluate(() =>
      [...document.querySelectorAll("img")].filter(
        (img) => img.getAttribute("src") === "x" && img.hasAttribute("onerror")
      ).length
    );
    expect(onerrorImgs, "XSS in API response must not produce an <img onerror> element").toBe(0);
  });

  test("@regression @security 4.12 Attribute injection: double-quote breakout does not create event handlers", async ({
    page,
  }) => {
    // Attribute-context payload: the leading `"` closes the surrounding
    // attribute value in an un-escaped template (e.g. <input value="PAYLOAD">)
    // and the injected on* handler executes on hover.
    const attributePayload = `" onmouseover="alert(1)" x="`;

    const handlersBefore = await countInjectedEventHandlers(page);

    await form.fillAndSubmit(attributePayload, attributePayload);

    const handlersAfter = await countInjectedEventHandlers(page);
    expect(
      handlersAfter,
      `Attribute-breakout payload must not inject new on* attributes (baseline was ${handlersBefore})`
    ).toBe(handlersBefore);

    await expect(form.successHeading).toBeVisible();
  });

  // ========================================================================
  // SECTION 6 — LINK SAFETY
  // target="_blank" without rel="noopener" lets the opened tab access
  // window.opener and silently redirect the parent page (reverse tabnapping).
  // ========================================================================

  test(`@regression @security 4.13 All target="_blank" links carry rel="noopener"`, async ({
    page,
  }) => {
    const unsafeLinks = await page.evaluate(() =>
      [...document.querySelectorAll('a[target="_blank"]')]
        .filter((a) => {
          const rel = (a.getAttribute("rel") ?? "").toLowerCase().split(/\s+/);
          return !rel.includes("noopener");
        })
        .map((a) => a.getAttribute("href") ?? "(no href)")
    );

    expect(
      unsafeLinks,
      `Every target="_blank" link must have rel="noopener" — missing on: ${JSON.stringify(unsafeLinks)}`
    ).toHaveLength(0);
  });

  // ========================================================================
  // SECTION 4 — HTTP SECURITY HEADERS
  // Uses the `request` fixture (not page.request) — a standalone HTTP client
  // with no browser context, no navigation dependency, and faster execution.
  // Checks that the server sends the baseline headers required by modern web
  // security policy.
  // These tests use test.fail() — they run, assert the headers, and are
  // reported as "known failures" while the app bug persists (exit code 0).
  // If the server is hardened and the assertions pass, Playwright reports an
  // "unexpected pass" and CI exits 1, forcing removal of test.fail().
  // ========================================================================
  test.describe("HTTP Security Headers", () => {

    // APP BUG: server does not return Content-Security-Policy.
    test("@regression @security 4.6 Content-Security-Policy header is present and safe", async ({ request }) => {
      test.fail(true, "APP BUG: Content-Security-Policy header missing — remove test.fail() once server is hardened");
      const response = await request.get(process.env.BASE_URL!);
      const csp = response.headers()["content-security-policy"];

      expect(csp, "Response must include a Content-Security-Policy header").toBeTruthy();

      // A CSP that allows unsafe-inline or unsafe-eval negates XSS protection
      // entirely — these directives must not appear in a production policy.
      expect(csp, "CSP must not permit unsafe-inline scripts").not.toContain("unsafe-inline");
      expect(csp, "CSP must not permit unsafe-eval").not.toContain("unsafe-eval");
    });

    // APP BUG: server does not return X-Content-Type-Options.
    test("@regression @security 4.7 X-Content-Type-Options header is 'nosniff'", async ({ request }) => {
      test.fail(true, "APP BUG: X-Content-Type-Options header missing — remove test.fail() once server is hardened");
      const response = await request.get(process.env.BASE_URL!);
      const xcto = response.headers()["x-content-type-options"];
      expect(xcto, "Response must include X-Content-Type-Options: nosniff").toBe("nosniff");
    });

    // APP BUG: server does not return X-Frame-Options.
    test("@regression @security 4.8 X-Frame-Options header is present", async ({ request }) => {
      test.fail(true, "APP BUG: X-Frame-Options header missing — remove test.fail() once server is hardened");
      const response = await request.get(process.env.BASE_URL!);
      const xfo = response.headers()["x-frame-options"];
      // Acceptable values are DENY or SAMEORIGIN (case-insensitive per RFC 7034).
      expect(
        xfo?.toUpperCase(),
        "Response must include X-Frame-Options: DENY or SAMEORIGIN"
      ).toMatch(/^(DENY|SAMEORIGIN)$/);
    });

    // APP BUG: server does not return Referrer-Policy.
    test("@regression @security 4.9 Referrer-Policy header is present", async ({ request }) => {
      test.fail(true, "APP BUG: Referrer-Policy header missing — remove test.fail() once server is hardened");
      const response = await request.get(process.env.BASE_URL!);
      const rp = response.headers()["referrer-policy"];
      // Any explicit policy is acceptable; absence means the browser falls back
      // to its default which may leak full URLs to third parties.
      expect(rp, "Response must include a Referrer-Policy header").toBeTruthy();
    });

    // Server returns Strict-Transport-Security — test is green.
    test("@regression @security 4.10 Strict-Transport-Security header is present", async ({ request }) => {
      const response = await request.get(process.env.BASE_URL!);

      // HSTS only has effect over HTTPS — verify the baseline first.
      expect(
        response.url().startsWith("https://"),
        "App must be served over HTTPS for HSTS to take effect"
      ).toBe(true);

      const hsts = response.headers()["strict-transport-security"];
      // Must exist and declare a max-age so browsers enforce HTTPS going forward.
      expect(hsts, "Response must include a Strict-Transport-Security header").toBeTruthy();
      expect(hsts, "HSTS max-age must be declared").toMatch(/max-age=\d+/);
    });

  }); // end: HTTP Security Headers
});
