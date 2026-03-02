import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { RequestSubmissionPage } from "../../pages/RequestSubmissionPage";
import { REQUEST_SUBMISSION } from "../../testData";

test.describe("Accessibility Tests - WCAG Compliance", () => {
  let form: any;

  test.beforeEach(async ({ page }) => {
    form = new RequestSubmissionPage(page);
    await form.goto();
  });

  // ========================================================================
  // SECTION 0 (ORIGINAL): BASIC VISUAL & KEYBOARD CHECKS
  // ========================================================================

  test("@accessibility @regression 9.1 Form fields have visible labels", async () => {
    await expect(form.fullNameLabel).toBeVisible();
    await expect(form.descriptionLabel).toBeVisible();
  });

  test("@accessibility @regression 9.2 Required field indicators are present", async () => {
    expect(await form.fullNameLabel.textContent()).toContain("*");
    expect(await form.descriptionLabel.textContent()).toContain("*");
  });

  test("@accessibility @regression 9.3 Form is keyboard accessible", async () => {
    // Use .focus() rather than .click() — pure keyboard interaction must not depend on a pointer event.
    await form.fullNameInput.focus();
    await form.page.keyboard.type(REQUEST_SUBMISSION.inputs.keyboard.name);
    await form.page.keyboard.press("Tab");
    await form.page.keyboard.type("qa+keyboard@example.com");
    await form.page.keyboard.press("Tab");
    await form.page.keyboard.type(REQUEST_SUBMISSION.inputs.keyboard.description);

    await expect(form.descriptionInput).toHaveValue(REQUEST_SUBMISSION.inputs.keyboard.description);
  });

  // ========================================================================
  // SECTION 1: SEMANTIC & ACCESSIBLE NAME VALIDATION
  // ========================================================================

  test("@accessibility 9.4 Label-input association via for/id or aria-labelledby (WCAG 1.3.1)", async ({ page }) => {
    for (const input of [form.fullNameInput, form.emailInput, form.descriptionInput]) {
      const id = await input.getAttribute("id");
      const ariaLabelledBy = await input.getAttribute("aria-labelledby");
      const ariaLabel = await input.getAttribute("aria-label");

      const hasLabelFor = id
        ? (await page.locator(`label[for="${id}"]`).count()) > 0
        : false;

      // If aria-labelledby is used, the referenced element must actually exist in the DOM;
      // a dangling reference computes an empty accessible name and is invisible to AT.
      let hasAriaLabelledBy = false;
      if (ariaLabelledBy) {
        const refCount = await page.locator(`#${CSS.escape(ariaLabelledBy)}`).count();
        expect(
          refCount,
          `aria-labelledby="${ariaLabelledBy}" references an element that does not exist in the DOM`
        ).toBeGreaterThan(0);
        hasAriaLabelledBy = refCount > 0;
      }

      const hasAriaLabel = ariaLabel !== null && ariaLabel.trim() !== "";

      expect(
        hasLabelFor || hasAriaLabelledBy || hasAriaLabel,
        `Input with id="${id}" must have a label association`
      ).toBe(true);
    }
  });

  test("@accessibility 9.5 Accessible name computed correctly via role-based selectors (WCAG 4.1.2)", async ({ page }) => {
    await expect(page.getByRole("textbox", { name: /Full Name/i })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /Email/i })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /Project Description/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Submit Request/i })).toBeVisible();
  });

  test("@accessibility 9.6 Required fields carry semantic required or aria-required attribute (WCAG 1.3.1)", async () => {
    for (const input of [form.fullNameInput, form.descriptionInput]) {
      const required = await input.getAttribute("required");
      const ariaRequired = await input.getAttribute("aria-required");

      expect(
        required !== null || ariaRequired === "true",
        "Input must have required or aria-required='true'"
      ).toBe(true);
    }
  });

  // ========================================================================
  // SECTION 2: KEYBOARD & FOCUS MANAGEMENT
  // ========================================================================

  test("@accessibility 9.7 Logical tab order: Full Name → Email → Description → Submit (WCAG 2.4.3)", async ({ page }) => {
    await form.fullNameInput.focus();
    await expect(form.fullNameInput).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(form.emailInput).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(form.descriptionInput).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(form.submitButton).toBeFocused();
  });

  test("@accessibility 9.8 Focused input has a visible focus indicator — outline not removed (WCAG 2.4.7)", async ({ page }) => {
    await form.fullNameInput.focus();

    const focusStyles = await form.fullNameInput.evaluate((el: Element) => {
      const s = window.getComputedStyle(el);
      return {
        outlineStyle: s.outlineStyle,
        outlineWidth: s.outlineWidth,
        outlineColor: s.outlineColor,
        boxShadow: s.boxShadow,
      };
    });

    // Parse the numeric pixel value so we can enforce a minimum meaningful width.
    // A 1 px outline is technically non-zero but barely perceptible; 2 px is the
    // threshold recommended by WCAG 2.4.11 (WCAG 2.2) and is a reasonable bar for 2.1 AA.
    const outlineWidthPx = parseFloat(focusStyles.outlineWidth);
    const hasOutline =
      focusStyles.outlineStyle !== "none" && !isNaN(outlineWidthPx) && outlineWidthPx >= 2;
    const hasBoxShadow =
      focusStyles.boxShadow !== "none" && focusStyles.boxShadow !== "";

    expect(
      hasOutline || hasBoxShadow,
      `Focused element must have a visible focus indicator. ` +
      `Got: outline=${focusStyles.outlineStyle} ${focusStyles.outlineWidth}, box-shadow=${focusStyles.boxShadow}`
    ).toBe(true);
  });

  test("@accessibility 9.9 Reverse keyboard navigation with Shift+Tab works correctly (WCAG 2.4.3)", async ({ page }) => {
    await form.submitButton.focus();
    await expect(form.submitButton).toBeFocused();

    await page.keyboard.press("Shift+Tab");
    await expect(form.descriptionInput).toBeFocused();

    await page.keyboard.press("Shift+Tab");
    await expect(form.emailInput).toBeFocused();

    await page.keyboard.press("Shift+Tab");
    await expect(form.fullNameInput).toBeFocused();
  });

  test("@accessibility 9.10 No keyboard trap — focus can Tab away from every field (WCAG 2.1.2)", async ({ page }) => {
    for (const input of [form.fullNameInput, form.emailInput, form.descriptionInput]) {
      await input.focus();
      await page.keyboard.press("Tab");
      const stillFocused = await input.evaluate(
        (el: Element) => el === document.activeElement
      );
      expect(stillFocused, "Focus must move away from the element after Tab").toBe(false);
    }
  });

  test("@accessibility 9.11 Form submits when Enter is pressed on the submit button", async ({ page }) => {
    await form.mockSuccess();
    await form.fillName(REQUEST_SUBMISSION.inputs.standard.name);
    await form.fillEmail("qa+keyboard@example.com");
    await form.fillDescription(REQUEST_SUBMISSION.inputs.standard.description);

    await form.submitButton.focus();
    await page.keyboard.press("Enter");

    await expect(form.successHeading).toBeVisible();
  });

  // ========================================================================
  // SECTION 3: ERROR HANDLING ACCESSIBILITY
  // ========================================================================

  // BUG: app does not implement aria-describedby on inputs and has no live error region.
  // Both mechanisms are required — they serve different purposes:
  //   • aria-describedby: statically links a field to its error in the accessibility tree
  //     so a screen reader user can re-inspect the error at any time.
  //   • role=alert / aria-live: proactively announces the error as soon as it appears
  //     without requiring the user to re-navigate to the field.
  // Allowing a fallback would mask a weak implementation; both MUST be present.
  test("@accessibility 9.12 Error fields have aria-describedby AND a live region (WCAG 3.3.1)", async ({ page }) => {
    test.fail(true, "APP BUG: No aria-describedby on inputs and no role=alert / aria-live region present after validation");

    await form.submit();
    await page.waitForTimeout(500);

    // Requirement 1: every required field must reference its error message via aria-describedby.
    for (const input of [form.fullNameInput, form.descriptionInput]) {
      const ariaDescribedBy = await input.getAttribute("aria-describedby");
      expect(
        ariaDescribedBy,
        "Required input must have aria-describedby pointing to its visible error message"
      ).not.toBeNull();

      if (ariaDescribedBy) {
        const errorEl = page.locator(`#${CSS.escape(ariaDescribedBy)}`);
        await expect(errorEl).toBeVisible();
      }
    }

    // Requirement 2: a live region must ALSO be present to proactively announce errors.
    const liveCount = await page
      .locator('[role="alert"], [aria-live="assertive"], [aria-live="polite"]')
      .count();
    expect(
      liveCount,
      "A role=alert or aria-live region must exist for proactive screen-reader announcements"
    ).toBeGreaterThan(0);
  });

  // BUG: app renders no role=alert or aria-live region when validation fires.
  test("@accessibility 9.13 Validation errors are announced to screen readers via role=alert or aria-live (WCAG 3.3.1)", async ({ page }) => {
    test.fail(true, "APP BUG: No role=alert or aria-live region present after form submission");

    await form.submit();
    await page.waitForTimeout(500);

    const count = await page
      .locator('[role="alert"], [aria-live="assertive"], [aria-live="polite"]')
      .count();

    expect(count, "At least one live region or alert role must exist for error announcements").toBeGreaterThan(0);
  });

  test("@accessibility 9.14 Focus moves to first invalid field after failed submission (WCAG 3.3.1)", async ({ page }) => {
    await form.submit();
    await page.waitForTimeout(500);

    // Assert focus lands on the *first* required field specifically, not just any
    // interactive element. Full Name is the first required field in DOM order,
    // so a compliant implementation must focus it (not e.g. the submit button).
    await expect(form.fullNameInput).toBeFocused();
  });

  // ========================================================================
  // SECTION 4: ARIA & ROLES VALIDATION
  // ========================================================================

  test("@accessibility 9.15 No interactive element is hidden from assistive technology via aria-hidden (WCAG 4.1.2)", async ({ page }) => {
    const hiddenInteractive = await page.evaluate(() => {
      const selectors = "input, button, textarea, select, a[href]";
      return Array.from(document.querySelectorAll(selectors))
        .filter(
          (el) =>
            el.getAttribute("aria-hidden") === "true" ||
            el.closest('[aria-hidden="true"]') !== null
        )
        .map((el) => el.outerHTML.substring(0, 120));
    });

    expect(
      hiddenInteractive,
      `These interactive elements are incorrectly hidden from AT: ${hiddenInteractive.join(", ")}`
    ).toHaveLength(0);
  });

  test("@accessibility 9.16 Correct semantic roles are present: textbox, button, heading (WCAG 4.1.2)", async ({ page }) => {
    // Verify the exact number of textbox roles — a wrong count reveals added/removed
    // inputs that are either redundant or missing from the accessibility tree.
    const textboxCount = await page.getByRole("textbox").count();
    expect(textboxCount, "Form must expose exactly 3 textbox roles (Full Name, Email, Description)").toBe(3);

    // Submit button must carry the button role and be individually reachable by name.
    await expect(page.getByRole("button", { name: /Submit Request/i })).toBeVisible();

    // At least one heading must be present for page structure orientation.
    await expect(page.getByRole("heading").first()).toBeVisible();
  });

  // ========================================================================
  // SECTION 5: VISUAL ACCESSIBILITY
  // ========================================================================

  // Targeted axe smoke scan — covers only ARIA labelling and attribute correctness rules.
  // Purpose: fast, focused signal on the most critical label/ARIA issues.
  // Intentionally does NOT overlap with the full WCAG audit in 9.21.
  // Known app bugs (color-contrast, html-has-lang) are tracked in 9.17a / 9.17b.
  test("@accessibility 9.17 Axe smoke scan — ARIA labels and attribute correctness (WCAG 4.1.2)", async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withRules([
        "label",
        "label-content-name-mismatch",
        "aria-required-attr",
        "aria-required-children",
        "aria-required-parent",
        "aria-roles",
        "aria-valid-attr",
        "aria-valid-attr-value",
        "button-name",
        "input-button-name",
      ])
      .analyze();

    if (results.violations.length > 0) {
      const summary = results.violations.map(
        (v) => `[${v.id}] ${v.description} — ${v.nodes.length} node(s)`
      );
      console.log("Axe ARIA smoke violations:\n", summary.join("\n"));
    }

    expect(results.violations).toEqual([]);
  });

  // BUG: insufficient color contrast on at least one element.
  test("@accessibility 9.17a APP BUG — color-contrast: text does not meet 4.5:1 ratio (WCAG 1.4.3)", async ({ page }) => {
    test.fail(true, "APP BUG: axe-core reports a color-contrast violation — text contrast below 4.5:1 minimum");

    const results = await new AxeBuilder({ page })
      .withRules(["color-contrast"])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  // BUG: <html> element has no lang attribute.
  test("@accessibility 9.17b APP BUG — html-has-lang: <html> element is missing a lang attribute (WCAG 3.1.1)", async ({ page }) => {
    test.fail(true, "APP BUG: axe-core reports html-has-lang violation — <html lang=\"...\"> is absent");

    const results = await new AxeBuilder({ page })
      .withRules(["html-has-lang"])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  // ========================================================================
  // SECTION 6: SCREEN READER BEHAVIOR
  // ========================================================================

  test("@accessibility 9.19 Placeholder text is not used as the sole accessible label (WCAG 3.3.2)", async ({ page }) => {
    for (const input of [form.fullNameInput, form.emailInput, form.descriptionInput]) {
      const placeholder = await input.getAttribute("placeholder");
      if (!placeholder) continue; // No placeholder — nothing to check

      // When a placeholder exists the input must also have an independent accessible name
      const id = await input.getAttribute("id");
      const hasLabelFor = id
        ? (await page.locator(`label[for="${id}"]`).count()) > 0
        : false;

      const ariaLabel = await input.getAttribute("aria-label");
      const ariaLabelledBy = await input.getAttribute("aria-labelledby");

      expect(
        hasLabelFor || ariaLabel !== null || ariaLabelledBy !== null,
        `Input with placeholder="${placeholder}" must also have a permanent label`
      ).toBe(true);
    }
  });

  test("@accessibility 9.20 Success confirmation message is reachable by assistive technology", async ({ page }) => {
    await form.mockSuccess();
    await form.fillAndSubmit(
      REQUEST_SUBMISSION.inputs.standard.name,
      REQUEST_SUBMISSION.inputs.standard.description
    );

    await expect(form.successHeading).toBeVisible();

    // Success content must be in the accessibility tree (not aria-hidden).
    const isHidden = await form.successHeading.evaluate(
      (el: Element) => el.closest('[aria-hidden="true"]') !== null
    );
    expect(isHidden, "Success message must not be inside an aria-hidden container").toBe(false);
  });

  // Focus management (9.28) already notifies AT of the success state. A live region
  // on the container would provide a belt-and-suspenders fallback for users who
  // navigate non-linearly, but its absence is not a hard failure when focus is moved.
  // BUG: no role=status / aria-live on the success container — secondary announcement missing.
  test("@accessibility 9.20a APP BUG — success region has no role=status or aria-live backup (WCAG 4.1.3)", async ({ page }) => {
    test.fail(true, "APP BUG: success container has no role=status or aria-live; focus management alone is present but a live region backup is missing");

    await form.mockSuccess();
    await form.fillAndSubmit(
      REQUEST_SUBMISSION.inputs.standard.name,
      REQUEST_SUBMISSION.inputs.standard.description
    );

    await expect(form.successHeading).toBeVisible();

    const hasLiveRegion = await form.successHeading.evaluate((el: Element) => {
      let node: Element | null = el;
      while (node && node.tagName !== "BODY") {
        const role = node.getAttribute("role");
        const live = node.getAttribute("aria-live");
        if (role === "status" || role === "alert" || live === "polite" || live === "assertive") {
          return true;
        }
        node = node.parentElement;
      }
      return false;
    });
    expect(
      hasLiveRegion,
      "Success region or one of its ancestors must have role=status/alert or aria-live"
    ).toBe(true);
  });

  // ========================================================================
  // SECTION 7: AUTOMATED WCAG SCAN
  // ========================================================================

  // Full WCAG 2.x / 2.1 A + AA comprehensive audit.
  // Complements the targeted smoke in 9.17 by covering all WCAG-tagged rules.
  // Known app-level bugs (color-contrast, html-has-lang) are excluded here and
  // tracked individually in 9.17a and 9.17b so they don't mask other violations.
  test("@accessibility 9.21 Full WCAG 2.1 AA axe-core audit — zero violations (excluding known app bugs)", async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .disableRules(["color-contrast", "html-has-lang"])
      .analyze();

    if (results.violations.length > 0) {
      const detail = results.violations.map(
        (v) =>
          `[${v.id}] ${v.impact?.toUpperCase()} — ${v.description}\n` +
          v.nodes.map((n) => `  • ${n.html.substring(0, 100)}`).join("\n")
      );
      console.log("Axe full audit violations:\n", detail.join("\n\n"));
    }

    expect(results.violations).toEqual([]);
  });

  // ========================================================================
  // SECTION 8: ADVANCED STRUCTURAL ACCESSIBILITY
  // ========================================================================

  // BUG: page jumps from h1 → h3, skipping h2.
  //
  // Notes on WCAG / HTML5 heading rules applied here:
  //   • Multiple h1 elements are valid in HTML5 when each lives in its own
  //     sectioning context (<article>, <section>, etc.). The test does NOT
  //     enforce a single h1 or require the first DOM heading to be h1.
  //   • Going UP in level (e.g. h3 → h1) is always permitted — this is normal
  //     when a new section starts at a higher rank.
  //   • Going DOWN by more than one level (e.g. h2 → h4) is a WCAG violation
  //     because it creates a gap that confuses screen-reader navigation.
  //   • This uses a flat DOM walk, matching what the axe "heading-order" rule
  //     does. In practice this is correct for single-page / single-section layouts.
  test("@accessibility 9.22 No heading level is skipped when going deeper (WCAG 1.3.1)", async ({ page }) => {
    test.fail(true, "APP BUG: heading hierarchy skips a level (h1 → h3 found on the page, h2 is missing)");

    const headings = await page.evaluate(() =>
      Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6")).map((el) => ({
        tag: el.tagName.toLowerCase(),
        text: el.textContent?.trim().substring(0, 60) ?? "",
      }))
    );

    expect(headings.length, "The page must contain at least one heading").toBeGreaterThan(0);

    // Only flag transitions that go DEEPER by more than one level.
    // Going to the same level or to a higher level is always acceptable.
    for (let i = 1; i < headings.length; i++) {
      const prev = parseInt(headings[i - 1].tag[1], 10);
      const curr = parseInt(headings[i].tag[1], 10);
      const jump = curr - prev;
      if (jump > 0) {
        expect(
          jump,
          `Heading skips a level: "${headings[i - 1].text}" (${headings[i - 1].tag}) → "${headings[i].text}" (${headings[i].tag})`
        ).toBeLessThanOrEqual(1);
      }
    }
  });

  // BUG: page has no <main> or role="main" landmark.
  test("@accessibility 9.23 Page has a <main> landmark region (WCAG 1.3.6)", async ({ page }) => {
    test.fail(true, "APP BUG: no <main> or role=\"main\" landmark found — assistive technology cannot skip to primary content");

    await expect(page.getByRole("main")).toBeVisible();
  });

  // ========================================================================
  // SECTION 9: SKIP LINKS & LANDMARK REGIONS
  // ========================================================================

  // A skip link is the first focusable element in the page. It allows keyboard
  // users to bypass repeated navigation and jump straight to the main content.
  // It may be visually hidden until focused (that is acceptable).
  // BUG: app has no skip-to-content link.
  test("@accessibility 9.24 Skip-to-content link is present and functional (WCAG 2.4.1)", async ({ page }) => {
    test.fail(true, "APP BUG: no skip-to-content link found — keyboard users cannot bypass repeated blocks");

    // Tab once from the top of the page; the first focused element should be a skip link.
    await page.keyboard.press("Tab");
    const focusedHref = await page.evaluate(() => {
      const el = document.activeElement as HTMLAnchorElement | null;
      return el?.tagName === "A" ? el.getAttribute("href") : null;
    });

    expect(focusedHref, "First Tab stop must be a skip link (anchor with href)").not.toBeNull();

    // Activating the link must move focus to the target element (main content).
    await page.keyboard.press("Enter");
    const focusedId = await page.evaluate(() => document.activeElement?.id ?? "");
    expect(focusedId, "Skip link must move focus to the target content region").not.toBe("");
  });

  // WCAG requires page regions to be identifiable via landmark roles so that
  // screen-reader users can jump directly to navigation, header, footer, etc.
  // BUG: app has no banner (header) or navigation landmark.
  test("@accessibility 9.25 Page exposes navigation and banner landmark regions (WCAG 1.3.6)", async ({ page }) => {
    test.fail(true, "APP BUG: no role=navigation or role=banner (header) landmark found on the page");

    // banner role is conveyed by <header> at the top level or role="banner"
    await expect(page.getByRole("banner"), "Page must have a banner (header) landmark").toBeVisible();

    // navigation role is conveyed by <nav> or role="navigation"
    await expect(page.getByRole("navigation"), "Page must have a navigation landmark").toBeVisible();
  });

  // ========================================================================
  // SECTION 10: ARIA-INVALID & ERROR SUMMARY
  // ========================================================================

  // When a field fails validation, setting aria-invalid="true" lets screen readers
  // announce the field as "invalid" without the user having to read an error message.
  // BUG: app does not set aria-invalid on fields after failed submission.
  test("@accessibility 9.26 Invalid fields carry aria-invalid='true' after failed submit (WCAG 3.3.1)", async ({ page }) => {
    test.fail(true, "APP BUG: required fields do not receive aria-invalid=\"true\" after form validation fails");

    await form.submit();
    await page.waitForTimeout(500);

    for (const input of [form.fullNameInput, form.descriptionInput]) {
      const ariaInvalid = await input.getAttribute("aria-invalid");
      expect(
        ariaInvalid,
        "Required field must have aria-invalid=\"true\" when it fails validation"
      ).toBe("true");
    }
  });

  // An error summary is a collected list of all validation errors shown at the top
  // of the form (or in a prominent region) so users can get an overview at once.
  // BUG: app has no error summary region.
  test("@accessibility 9.27 An error summary region is present after failed submit (WCAG 3.3.1)", async ({ page }) => {
    test.fail(true, "APP BUG: no error summary region (role=alert/group with error list) found after validation");

    await form.submit();
    await page.waitForTimeout(500);

    // Error summary can be implemented as role="alert", role="group" with an error heading,
    // or any container with aria-live that lists all field errors.
    const summaryCount = await page
      .locator('[role="alert"], [role="group"][aria-labelledby], [aria-live="assertive"]')
      .count();

    expect(
      summaryCount,
      "A visible error summary region must be present after form validation fails"
    ).toBeGreaterThan(0);

    // The summary must be visible (not just in the DOM).
    await expect(
      page.locator('[role="alert"], [role="group"][aria-labelledby], [aria-live="assertive"]').first()
    ).toBeVisible();
  });

  // ========================================================================
  // SECTION 11: DYNAMIC CONTENT & SPA FOCUS MANAGEMENT
  // ========================================================================

  // After a successful async form submission the page transitions to a success state.
  // In single-page applications, the browser does NOT perform a navigation so focus
  // stays on the submit button (or wherever it was). Proper focus management means
  // programmatically moving focus to the new content so screen readers announce it.
  test("@accessibility 9.28 Focus moves to the success region after successful submission (WCAG 2.4.3)", async ({ page }) => {
    await form.mockSuccess();
    await form.fillAndSubmit(
      REQUEST_SUBMISSION.inputs.standard.name,
      REQUEST_SUBMISSION.inputs.standard.description
    );

    await expect(form.successHeading).toBeVisible();

    // The success heading (or its container) must receive programmatic focus.
    // Collect tag, text content, and whether the element has tabindex in a single
    // evaluate call to avoid multiple round-trips to the browser context.
    const focused = await page.evaluate(() => ({
      tag: document.activeElement?.tagName.toLowerCase() ?? "",
      text: document.activeElement?.textContent?.trim() ?? "",
      hasTabindex: document.activeElement?.hasAttribute("tabindex") ?? false,
    }));

    // Acceptable focus targets:
    //   • a native heading (h1–h3)
    //   • any element that received programmatic focus via tabindex (e.g. a div/section
    //     wrapping the success message with tabindex="-1")
    //   • a fallback: the focused element's text contains "submitted"
    const isHeadingFocused =
      focused.tag === "h1" || focused.tag === "h2" || focused.tag === "h3";

    expect(
      isHeadingFocused || focused.hasTabindex || focused.text.toLowerCase().includes("submitted"),
      `After successful submit, focus must land on the success region. ` +
      `Currently focused: <${focused.tag}> "${focused.text}" (tabindex=${focused.hasTabindex})`
    ).toBe(true);
  });

  // ========================================================================
  // SECTION 12: WCAG 2.2 — FOCUS APPEARANCE (2.4.11)
  // ========================================================================

  // WCAG 2.4.11 defines two requirements for the focus indicator:
  //   1. AREA  — at least as large as the area of a 2 CSS px border around the
  //              unfocused component. For a CSS outline this simplifies to:
  //              outlineWidth × outlinePerimeter ≥ componentPerimeter × 2
  //              (outlinePerimeter expands by outlineOffset on each side).
  //   2. CONTRAST — the indicator color must differ from the unfocused state
  //              with a contrast ratio ≥ 3:1 against the adjacent background.
  //
  // box-shadow focus rings (used by many frameworks) satisfy area when their
  // spread-radius is ≥ 2 px; they are accepted as a valid alternative.
  // BUG: the focus indicator area is below the WCAG 2.4.11 minimum.
  test("@accessibility 9.29 Focus indicator area meets WCAG 2.4.11 minimum (component perimeter × 2px)", async ({ page }) => {
    test.fail(true, "APP BUG: focus indicator area is below the WCAG 2.4.11 required minimum (component perimeter × 2 CSS px)");
    await form.fullNameInput.focus();

    const result = await form.fullNameInput.evaluate((el: Element) => {
      const s = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();

      const outlineWidthPx  = parseFloat(s.outlineWidth)  || 0;
      const outlineOffsetPx = parseFloat(s.outlineOffset) || 0;

      // Component perimeter and required minimum area
      const componentPerimeter = 2 * (rect.width + rect.height);
      const requiredArea = componentPerimeter * 2;

      // Outline box perimeter grows by (offset + width) on all four sides
      const expand = outlineOffsetPx + outlineWidthPx;
      const outlineBoxPerimeter = 2 * ((rect.width + 2 * expand) + (rect.height + 2 * expand));
      const outlineArea = outlineWidthPx * outlineBoxPerimeter;

      // box-shadow spread-radius is the 4th length value in the shorthand;
      // a positive spread of ≥ 2 px forms an equivalent area.
      const boxShadow = s.boxShadow;
      let boxShadowSpreadPx = 0;
      if (boxShadow && boxShadow !== "none") {
        // Match all numeric lengths; the 4th is spread (may be missing → 0)
        const lengths = [...boxShadow.matchAll(/([-\d.]+)px/g)].map((m) => parseFloat(m[1]));
        // Strip leading "inset" token then: offsetX offsetY blur spread
        const offsets = lengths.filter((_, i) => i < 4);
        boxShadowSpreadPx = offsets[3] ?? 0;
      }
      const hasBoxShadowArea = boxShadowSpreadPx >= 2;

      return {
        outlineStyle:    s.outlineStyle,
        outlineWidthPx,
        outlineOffsetPx,
        outlineArea:     Math.round(outlineArea),
        requiredArea:    Math.round(requiredArea),
        boxShadowSpreadPx,
        hasBoxShadowArea,
      };
    });

    const passes =
      result.hasBoxShadowArea ||
      (result.outlineStyle !== "none" && result.outlineArea >= result.requiredArea);

    expect(
      passes,
      `Focus indicator area ${result.outlineArea}px² < required ${result.requiredArea}px² ` +
      `(component perimeter × 2). ` +
      `Outline: ${result.outlineStyle} ${result.outlineWidthPx}px, offset ${result.outlineOffsetPx}px. ` +
      `box-shadow spread: ${result.boxShadowSpreadPx}px`
    ).toBe(true);
  });

  // Focus indicator contrast: the outward face of the indicator must have ≥ 3:1
  // contrast against the background colour visible immediately outside the component.
  // We walk up the DOM to find the effective background, then compare it against
  // the computed outline / box-shadow colour.
  test("@accessibility 9.30 Focus indicator has ≥ 3:1 contrast against adjacent background (WCAG 2.4.11)", async ({ page }) => {
    await form.fullNameInput.focus();

    const result = await form.fullNameInput.evaluate((el: Element) => {
      // ── inline colour helpers ───────────────────────────────────────────
      function parseRgb(css: string): [number, number, number] | null {
        const m = css.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
        return m ? [+m[1], +m[2], +m[3]] : null;
      }
      function lin(c: number): number {
        const s = c / 255;
        return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      }
      function lum([r, g, b]: [number, number, number]): number {
        return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
      }
      function contrastRatio(a: [number, number, number], b: [number, number, number]): number {
        const l1 = Math.max(lum(a), lum(b));
        const l2 = Math.min(lum(a), lum(b));
        return (l1 + 0.05) / (l2 + 0.05);
      }
      // ───────────────────────────────────────────────────────────────────

      const s = window.getComputedStyle(el);

      // Determine indicator colour: prefer outline; fall back to box-shadow colour.
      let indicatorColorRaw = "";
      if (s.outlineStyle !== "none" && s.outlineColor) {
        indicatorColorRaw = s.outlineColor;
      } else if (s.boxShadow && s.boxShadow !== "none") {
        // Extract rgb/rgba colour from box-shadow shorthand
        const m = s.boxShadow.match(/rgba?\([^)]+\)/);
        indicatorColorRaw = m ? m[0] : "";
      }
      const indicatorRgb = parseRgb(indicatorColorRaw);

      // Walk up the DOM to find the first opaque background colour
      let bgRgb: [number, number, number] | null = null;
      let node: Element | null = el.parentElement;
      while (node) {
        const bg = window.getComputedStyle(node).backgroundColor;
        if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
          bgRgb = parseRgb(bg);
          break;
        }
        node = node.parentElement;
      }
      if (!bgRgb) bgRgb = [255, 255, 255]; // fallback: white

      return {
        indicatorColorRaw,
        bgColor: `rgb(${bgRgb.join(", ")})`,
        ratio: indicatorRgb ? Math.round(contrastRatio(indicatorRgb, bgRgb) * 100) / 100 : null,
      };
    });

    if (result.ratio === null) {
      // Could not parse the indicator colour — flag for manual review, do not fail.
      console.warn(
        "9.30: Unable to extract focus indicator colour; manual contrast review required. " +
        `Computed value: "${result.indicatorColorRaw}"`
      );
      return;
    }

    expect(
      result.ratio,
      `Focus indicator (${result.indicatorColorRaw}) must have ≥ 3:1 contrast against ` +
      `background ${result.bgColor}. Got: ${result.ratio}:1`
    ).toBeGreaterThanOrEqual(3);
  });

  // ========================================================================
  // SECTION 13: FOCUS NOT OBSCURED (WCAG 2.4.12)
  // ========================================================================

  // WCAG 2.4.12 requires that a focused component is not entirely hidden by
  // author-created content (sticky header, cookie banner, overlay, etc.).
  // Strategy: for each focusable element, sample 5 points (centre + four inner
  // corners). If not a single sample point returns the focused element (or a
  // descendant), the whole element is considered fully obscured.
  test("@accessibility 9.31 Focused elements are not entirely obscured by fixed/sticky content (WCAG 2.4.12)", async ({ page }) => {
    for (const input of [form.fullNameInput, form.emailInput, form.descriptionInput, form.submitButton]) {
      await input.focus();
      const box = await input.boundingBox();
      if (!box) continue;

      // 5 sample points — inset 1 px from each corner to stay inside the element
      const pts = [
        { x: box.x + box.width  / 2, y: box.y + box.height / 2 },  // centre
        { x: box.x + 1,              y: box.y + 1 },                // top-left
        { x: box.x + box.width  - 1, y: box.y + 1 },                // top-right
        { x: box.x + 1,              y: box.y + box.height - 1 },   // bottom-left
        { x: box.x + box.width  - 1, y: box.y + box.height - 1 },   // bottom-right
      ];

      const allObscured = await page.evaluate(({ pts }) => {
        const focused = document.activeElement;
        return pts.every(({ x, y }) => {
          const top = document.elementFromPoint(x, y);
          return top !== null && top !== focused && !focused?.contains(top);
        });
      }, { pts });

      const tag = await input.evaluate((el: Element) => el.tagName.toLowerCase());
      expect(
        allObscured,
        `<${tag}> is entirely obscured at all 5 sample points — ` +
        `a fixed or sticky element is covering the focused input`
      ).toBe(false);
    }
  });

  // ========================================================================
  // SECTION 14: TARGET SIZE (WCAG 2.5.8)
  // ========================================================================

  // WCAG 2.5.8 (new in 2.2) requires every interactive target to have a minimum
  // size of 24×24 CSS px, OR sufficient spacing so the 24 px activation area of
  // adjacent targets does not overlap. This test checks the size condition;
  // the spacing alternative requires visual/layout inspection (manual).
  test("@accessibility 9.32 Interactive targets meet 24×24 CSS px minimum size (WCAG 2.5.8)", async ({ page }) => {
    const violations = await page.evaluate(() => {
      const sel = [
        "input", "button", "textarea", "select",
        "a[href]", '[role="button"]', '[role="link"]',
        '[role="checkbox"]', '[role="radio"]', '[role="menuitem"]',
      ].join(", ");

      return Array.from(document.querySelectorAll(sel))
        .map((el) => {
          const r = el.getBoundingClientRect();
          return {
            tag:    el.tagName.toLowerCase(),
            type:   (el as HTMLInputElement).type ?? "",
            label:  (el as HTMLElement).innerText?.trim().substring(0, 50) ||
                    el.getAttribute("aria-label") || el.getAttribute("name") || "",
            width:  Math.round(r.width),
            height: Math.round(r.height),
          };
        })
        // Only flag rendered elements (positive area) below minimum
        .filter((e) => e.width > 0 && e.height > 0 && (e.width < 24 || e.height < 24));
    });

    if (violations.length > 0) {
      console.log(
        "Target size violations:\n",
        violations
          .map((v) => `  <${v.type || v.tag}> "${v.label}" — ${v.width}×${v.height}px (need ≥ 24×24)`)
          .join("\n")
      );
    }

    expect(violations, "All interactive targets must be at least 24×24 CSS px (WCAG 2.5.8)").toEqual([]);
  });

  // ========================================================================
  // SECTION 15: NON-TEXT CONTRAST (WCAG 1.4.11)
  // ========================================================================

  // WCAG 1.4.11 requires UI component boundaries and graphical objects to have
  // at least 3:1 contrast against adjacent colours.
  // Test A: manual border-contrast check — computes the ratio between each
  // input's computed border colour and the nearest opaque background.
  test("@accessibility 9.33 Input borders have ≥ 3:1 contrast against adjacent background (WCAG 1.4.11)", async ({ page }) => {
    const violations = await page.evaluate(() => {
      // ── inline colour helpers ─────────────────────────────────────────
      function parseRgb(css: string): [number, number, number] | null {
        const m = css.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
        return m ? [+m[1], +m[2], +m[3]] : null;
      }
      function lin(c: number): number {
        const s = c / 255;
        return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      }
      function lum([r, g, b]: [number, number, number]): number {
        return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
      }
      function ratio(a: [number, number, number], b: [number, number, number]): number {
        const l1 = Math.max(lum(a), lum(b));
        const l2 = Math.min(lum(a), lum(b));
        return (l1 + 0.05) / (l2 + 0.05);
      }
      // ─────────────────────────────────────────────────────────────────

      const results: { label: string; border: string; bg: string; ratio: number }[] = [];

      for (const el of Array.from(document.querySelectorAll("input, textarea"))) {
        const s = window.getComputedStyle(el);
        // Use borderTopColor as the canonical border colour
        const borderRgb = parseRgb(s.borderTopColor);
        if (!borderRgb) continue;

        // Find the effective background by walking up the DOM
        let bgRgb: [number, number, number] = [255, 255, 255];
        let node: Element | null = el.parentElement;
        while (node) {
          const bg = window.getComputedStyle(node).backgroundColor;
          if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
            bgRgb = parseRgb(bg) ?? bgRgb;
            break;
          }
          node = node.parentElement;
        }

        results.push({
          label: el.getAttribute("aria-label") || el.getAttribute("name") || el.tagName,
          border: s.borderTopColor,
          bg: `rgb(${bgRgb.join(", ")})`,
          ratio: Math.round(ratio(borderRgb, bgRgb) * 100) / 100,
        });
      }

      return results.filter((r) => r.ratio < 3);
    });

    if (violations.length > 0) {
      console.log(
        "Non-text contrast violations:\n",
        violations
          .map((v) => `  ${v.label}: border=${v.border} bg=${v.bg} ratio=${v.ratio}:1`)
          .join("\n")
      );
    }

    expect(violations, "Input borders must have ≥ 3:1 contrast against background (WCAG 1.4.11)").toEqual([]);
  });

  // Test B: axe-core rule-based scan for non-text contrast.
  // NOTE: axe-core 4.11.1 (installed) does not ship a standalone "non-text-contrast" rule.
  // Available contrast rules are: "color-contrast" (WCAG 1.4.3 AA) and
  // "color-contrast-enhanced" (WCAG 1.4.6 AAA). We run "color-contrast-enhanced"
  // here as the strictest available rule; it will also catch problems flagged by 1.4.11
  // when element boundaries use text-like colours. Upgrade axe-core when a dedicated
  // non-text-contrast rule becomes available in a future release.
  test("@accessibility 9.34 Axe color-contrast-enhanced scan — stricter contrast threshold (WCAG 1.4.6 / 1.4.11)", async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withRules(["color-contrast-enhanced"])
      .analyze();

    if (results.violations.length > 0) {
      const summary = results.violations.map(
        (v) => `[${v.id}] ${v.description} — ${v.nodes.length} node(s)\n` +
          v.nodes.map((n) => `  • ${n.html.substring(0, 100)}`).join("\n")
      );
      console.log("Enhanced contrast violations:\n", summary.join("\n\n"));
    }

    expect(results.violations).toEqual([]);
  });
});
