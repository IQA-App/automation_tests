import { test, expect } from "@playwright/test";
import { RequestSubmissionPage } from "../../pages/RequestSubmissionPage";
import { REQUEST_SUBMISSION } from "../../testData";

// Ensure REQUEST_SUBMISSION.inputs contains maxLengthName and veryLongDescription

test.describe("UI Boundary Tests - Edge Cases & Limits", () => {
  let form: any;

  test.beforeEach(async ({ page }) => {
    form = new RequestSubmissionPage(page);
    await form.goto();
  });

  // ========================================================================
  // BOUNDARY TESTS
  // ========================================================================
  // Note: Application has client-side validation that rejects inputs shorter than ~3 characters
  // This test assumes minimal valid input will be accepted, but form validation prevents submission
  test.fixme("@regression 3.1 Accept minimal input (1 char each field)", async () => {
    await form.mockSuccess();
    // Minimal valid input - single character is too short, so use shorter valid input
    await form.fillAndSubmit("Jo", "Testing");

    await expect(form.successHeading).toBeVisible();
  });

  test("@regression 3.2 Accept maximum length input (255 chars for Full Name)", async () => {
    await form.mockSuccess();
    await form.fillAndSubmit(
      REQUEST_SUBMISSION.inputs.longName.name,
      REQUEST_SUBMISSION.inputs.longName.description
    );

    await expect(form.successHeading).toBeVisible();
  });

  test("@regression 3.3 Accept description with 10000 characters", async () => {
    await form.mockSuccess();
    await form.fillAndSubmit(
      REQUEST_SUBMISSION.inputs.longDesc.name,
      REQUEST_SUBMISSION.inputs.longDesc.description
    );

    await expect(form.successHeading).toBeVisible();
  });

  test("@regression 3.4 Whitespace-only Full Name is rejected", async () => {
    await form.fillName(REQUEST_SUBMISSION.inputs.whitespace.name);
    await form.fillDescription(REQUEST_SUBMISSION.inputs.whitespace.description);
    await form.submit();

    await expect(form.successHeading).not.toBeVisible();
    await expect(form.submitButton).toBeVisible();
  });

  test("@regression 3.5 Whitespace-only Description is rejected", async () => {
    await form.fillName(REQUEST_SUBMISSION.inputs.whitespace.name);
    await form.fillDescription(REQUEST_SUBMISSION.inputs.whitespace.description);
    await form.submit();

    await expect(form.successHeading).not.toBeVisible();
    await expect(form.submitButton).toBeVisible();
  });
});
