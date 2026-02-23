import { test, expect } from "@playwright/test";
import { RequestSubmissionPage } from "../../pages/RequestSubmissionPage";
import { REQUEST_SUBMISSION } from "../../testData";

test.describe("UI Security Tests - XSS & SQL Injection", () => {
  let form: any;

  test.beforeEach(async ({ page }) => {
    form = new RequestSubmissionPage(page);
    await form.goto();
  });

  // ========================================================================
  // SECURITY TESTS
  // ========================================================================
  test("@regression @security 4.1 Handle special characters in Full Name", async () => {
    await form.mockSuccess();
    await form.fillAndSubmit(
      REQUEST_SUBMISSION.inputs.specialChars.name,
      REQUEST_SUBMISSION.inputs.specialChars.description
    );

    await expect(form.successHeading).toBeVisible();
  });

  test("@regression @security 4.2 Handle special characters in Description", async () => {
    await form.mockSuccess();
    await form.fillAndSubmit(
      REQUEST_SUBMISSION.inputs.specialChars.name,
      REQUEST_SUBMISSION.inputs.specialChars.description
    );

    await expect(form.successHeading).toBeVisible();
  });

  test("@regression @security 4.3 XSS attempt: Script tag in Full Name", async () => {
    await form.mockSuccess();
    await form.fillAndSubmit(REQUEST_SUBMISSION.inputs.xss.name, REQUEST_SUBMISSION.inputs.xss.description);

    await expect(form.successHeading).toBeVisible();
  });

  test("@regression @security 4.4 SQL injection attempt in Description", async () => {
    await form.mockSuccess();
    await form.fillAndSubmit(
      REQUEST_SUBMISSION.inputs.sqlInjection.name,
      REQUEST_SUBMISSION.inputs.sqlInjection.description
    );

    await expect(form.successHeading).toBeVisible();
  });
});
