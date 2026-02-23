import { test, expect } from "@playwright/test";
import { RequestSubmissionPage } from "../../pages/RequestSubmissionPage";
import { REQUEST_SUBMISSION } from "../../testData";

test.describe("UI Smoke Tests", () => {
  let form: any;

  test.beforeEach(async ({ page }) => {
    form = new RequestSubmissionPage(page);
    await form.goto();
  });

  test("@smoke @regression Submit valid request with standard data", async () => {
    await form.mockSuccess();
    await form.fillAndSubmit(
      REQUEST_SUBMISSION.inputs.standard.name,
      REQUEST_SUBMISSION.inputs.standard.description
    );

    // Success: confirmation heading visible, form is gone
    await expect(form.successHeading).toBeVisible();
    await expect(form.successMessage).toBeVisible();
    await expect(form.submitButton).not.toBeVisible();
  });

  test("@smoke @regression Form elements render correctly on load", async () => {
    await expect(form.fullNameInput).toBeVisible();
    await expect(form.descriptionInput).toBeVisible();
    await expect(form.submitButton).toBeVisible();
  });
});
