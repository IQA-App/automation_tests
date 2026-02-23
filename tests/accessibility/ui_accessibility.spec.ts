import { test, expect } from "@playwright/test";
import { RequestSubmissionPage } from "../../pages/RequestSubmissionPage";
import { REQUEST_SUBMISSION } from "../../testData";

test.describe("Accessibility Tests - WCAG Compliance", () => {
  let form: any;

  test.beforeEach(async ({ page }) => {
    form = new RequestSubmissionPage(page);
    await form.goto();
  });

  // ========================================================================
  // ACCESSIBILITY
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
    await form.fullNameInput.click();
    await form.page.keyboard.type(REQUEST_SUBMISSION.inputs.keyboard.name);
    await form.page.keyboard.press("Tab");
    await form.page.keyboard.type("qa+keyboard@example.com");
    await form.page.keyboard.press("Tab");
    await form.page.keyboard.type(REQUEST_SUBMISSION.inputs.keyboard.description);

    await expect(form.descriptionInput).toHaveValue(REQUEST_SUBMISSION.inputs.keyboard.description);
  });
});
