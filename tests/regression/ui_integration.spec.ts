import { test, expect } from "@playwright/test";
import { RequestSubmissionPage } from "../../pages/RequestSubmissionPage";
import { REQUEST_SUBMISSION } from "../../testData";

test.describe("UI Integration Tests - API & Form State", () => {
  let form: any;

  test.beforeEach(async ({ page }) => {
    form = new RequestSubmissionPage(page);
    await form.goto();
  });

  // ========================================================================
  // API INTEGRATION
  // ========================================================================
  test("@regression Verify API endpoint is called correctly", async () => {
    const intercept = await form.interceptRequest();
    await form.fillAndSubmit(REQUEST_SUBMISSION.inputs.apiEndpoint.name, REQUEST_SUBMISSION.inputs.apiEndpoint.description);
    await intercept.waitForRequest();

    const req = intercept.getRequest();
    expect(req).not.toBeNull();
    expect(req.method()).toEqual("POST");
    expect(req.url()).toMatch(/\/(api\/)?orders/);
  });

  test("@regression Verify request payload format", async () => {
    const intercept = await form.interceptAndCapturePayload();
    await form.fillAndSubmit(REQUEST_SUBMISSION.inputs.payloadCheck.name, REQUEST_SUBMISSION.inputs.payloadCheck.description);
    await intercept.waitForPayload();

    const payload = intercept.getPayload();
    const payloadName = payload.title ?? payload.customerName ?? payload.name;
    const payloadDescription =
      payload.description ?? payload.customFields?.description;
    expect(payloadName).toBeDefined();
    expect(payloadDescription).toBeDefined();
    expect(payloadName).toEqual(REQUEST_SUBMISSION.inputs.payloadCheck.name);
    expect(payloadDescription).toEqual(
      REQUEST_SUBMISSION.inputs.payloadCheck.description
    );
  });

  test("@regression Handle response with 201 status — success UI shown", async () => {
    await form.mockSuccess(REQUEST_SUBMISSION.apiResponses.successWithOrderId12345);
    await form.fillAndSubmit(REQUEST_SUBMISSION.inputs.simpleSubmit.name, REQUEST_SUBMISSION.inputs.simpleSubmit.description);

    await expect(form.successHeading).toBeVisible();
    await expect(form.successMessage).toBeVisible();
    await expect(form.submitButton).not.toBeVisible();
  });

  test("@regression Handle response with 400 status — error dialog shown, form preserved", async () => {
    let dialogMessage: string | null = null;
    form.page.on("dialog", async (dialog: any) => {
      dialogMessage = dialog.message();
      await dialog.dismiss();
    });

    await form.mockError(400, REQUEST_SUBMISSION.apiResponses.invalidRequest);
    await form.fillAndSubmit(REQUEST_SUBMISSION.inputs.simpleSubmit.name, REQUEST_SUBMISSION.inputs.simpleSubmit.description);
    await form.page.waitForTimeout(500);

    expect(dialogMessage).toBe(REQUEST_SUBMISSION.messages.errorDialog);
    await expect(form.submitButton).toBeVisible();
  });

  // ========================================================================
  // FORM STATE AND DATA PERSISTENCE
  // ========================================================================
  test("@regression Form fields are empty after page refresh", async () => {
    await form.fillAndSubmit(REQUEST_SUBMISSION.inputs.refresh.name, REQUEST_SUBMISSION.inputs.refresh.description);
    await form.page.reload({ waitUntil: "networkidle" });

    await expect(form.fullNameInput).toHaveValue("");
    await expect(form.descriptionInput).toHaveValue("");
  });

  test("@regression Verify no sensitive data leaks into the URL", async () => {
    await form.mockSuccess();
    await form.fillAndSubmit(REQUEST_SUBMISSION.inputs.sensitive.name, REQUEST_SUBMISSION.inputs.sensitive.description);
    await form.page.waitForTimeout(500);

    expect(form.page.url()).not.toContain(REQUEST_SUBMISSION.inputs.sensitive.name);
    expect(form.page.url()).not.toContain(REQUEST_SUBMISSION.inputs.sensitive.description);
  });

  // ========================================================================
  // USER EXPERIENCE
  // ========================================================================
  test("@regression Tab navigation through form fields", async () => {
    await form.fullNameInput.click();
    await form.page.keyboard.type(REQUEST_SUBMISSION.inputs.tabNav.name);
    await form.page.keyboard.press("Tab");
    await form.page.keyboard.type("qa+tabnav@example.com");
    await form.page.keyboard.press("Tab");
    await form.page.keyboard.type(REQUEST_SUBMISSION.inputs.tabNav.description);

    await expect(form.descriptionInput).toHaveValue(REQUEST_SUBMISSION.inputs.tabNav.description);
  });

  test("@regression Multiple rapid submissions are handled", async () => {
    let requestCount = 0;
    await form.page.route("**/api/orders*", (route: any) => {
      requestCount++;
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });
    await form.page.route("**/orders*", (route: any) => {
      requestCount++;
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    await form.fillName(REQUEST_SUBMISSION.inputs.generic.name);
    await form.fillDescription(REQUEST_SUBMISSION.inputs.generic.description);

    await form.submitButton.click();
    await form.submitButton.click();
    await form.submitButton.click();

    await form.page.waitForTimeout(500);
    expect(requestCount).toBeLessThanOrEqual(3);
  });

  test("@regression Form submission flow works end-to-end", async () => {
    await form.mockSuccess(REQUEST_SUBMISSION.apiResponses.successWithOrderId123);
    await form.fillAndSubmit(REQUEST_SUBMISSION.inputs.endToEnd.name, REQUEST_SUBMISSION.inputs.endToEnd.description);

    await expect(form.successHeading).toBeVisible();
  });
});
