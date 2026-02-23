import { test, expect } from "@playwright/test";
import { RequestSubmissionPage } from "../../pages/RequestSubmissionPage";
import { REQUEST_SUBMISSION } from "../../testData";

test.describe("UI Validation Tests - Form Field Validation", () => {
  let form: any;

  test.beforeEach(async ({ page }) => {
    form = new RequestSubmissionPage(page);
    await form.goto();
  });

  // ========================================================================
  // FIELD VERIFICATION - ERROR HANDLING
  // ========================================================================
  test("@regression renders all required form controls", async () => {
    await expect(form.fullNameInput).toBeVisible();
    await expect(form.descriptionInput).toBeVisible();
    await expect(form.submitButton).toBeVisible();
    await expect(form.submitButton).toBeEnabled();
  });

  test("@regression keeps form on page when Full Name is missing", async () => {
    await form.fillDescription("Only description provided");
    await form.submit();

    await expect(form.fullNameInput).toBeVisible();
    await expect(form.descriptionInput).toBeVisible();
    await expect(form.successHeading).not.toBeVisible();
    await expect(form.submitButton).toBeVisible();
    await expect(form.descriptionInput).toHaveValue("Only description provided");
  });

  test("@regression keeps form on page when Project Description is missing", async () => {
    await form.fillName("John Doe");
    await form.submit();

    await expect(form.fullNameInput).toBeVisible();
    await expect(form.descriptionInput).toBeVisible();
    await expect(form.successHeading).not.toBeVisible();
    await expect(form.submitButton).toBeVisible();
    await expect(form.fullNameInput).toHaveValue("John Doe");
  });

  test("@regression allows editing fields after blocked submit", async () => {
    await form.submit();

    await expect(form.successHeading).not.toBeVisible();
    await expect(form.fullNameInput).toBeEditable();
    await expect(form.descriptionInput).toBeEditable();

    await form.fillName("Alex Johnson");
    await form.fillDescription("Website update request");

    await expect(form.fullNameInput).toHaveValue("Alex Johnson");
    await expect(form.descriptionInput).toHaveValue("Website update request");
    await expect(form.submitButton).toBeEnabled();
  });

  // ========================================================================
  // INPUT VALIDATION
  // ========================================================================
  test("@regression 2.1 Reject submission when Full Name is missing", async () => {
    await form.fillDescription(REQUEST_SUBMISSION.inputs.standard.description);
    await form.submit();

    await expect(form.submitButton).toBeVisible();
    await expect(form.successMessage).not.toBeVisible();
  });

  test("@regression 2.2 Reject submission when Project Description is missing", async () => {
    await form.fillName(REQUEST_SUBMISSION.inputs.standard.name);
    await form.submit();

    await expect(form.submitButton).toBeVisible();
    await expect(form.successMessage).not.toBeVisible();
  });

  test("@regression 2.3 Accept submission with both fields filled", async () => {
    await form.mockSuccess();
    await form.fillAndSubmit(REQUEST_SUBMISSION.inputs.standard.name, REQUEST_SUBMISSION.inputs.standard.description);

    await expect(form.successHeading).toBeVisible();
  });

  test("@regression 2.4 Accept very long description (5000 chars)", async () => {
    await form.mockSuccess();
    await form.fillAndSubmit(
      REQUEST_SUBMISSION.inputs.longDesc.name,
      REQUEST_SUBMISSION.inputs.longDesc.description
    );

    await expect(form.successHeading).toBeVisible();
  });

  // ========================================================================
  // USER EXPERIENCE AND INTERACTION
  // ========================================================================
  test("@regression Placeholder text is present on both fields", async () => {
    const namePlaceholder = await form.fullNameInput.getAttribute("placeholder");
    const descPlaceholder = await form.descriptionInput.getAttribute("placeholder");

    expect(namePlaceholder).toBeTruthy();
    expect(descPlaceholder).toBeTruthy();
  });
});
