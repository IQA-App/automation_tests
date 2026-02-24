const BASE_URL = process.env.BASE_URL;

export class RequestSubmissionPage {
  page: any;
  fullNameInput: any;
  emailInput: any;
  descriptionInput: any;
  submitButton: any;
  successHeading: any;
  successMessage: any;
  fullNameLabel: any;
  descriptionLabel: any;

  constructor(page: any) {
    this.page = page;

    // Form inputs
    this.fullNameInput = page.getByRole("textbox", { name: /Full Name/i });
    this.emailInput = page.getByRole("textbox", { name: /Email/i });
    this.descriptionInput = page.getByRole("textbox", { name: /Project Description/i });
    this.submitButton = page.getByRole("button", { name: /Submit Request/i });

    // Success state
    this.successHeading = page.getByRole("heading", { name: /Request Submitted!/i });
    this.successMessage = page.getByText(
      "We've received your request and will contact you soon."
    );

    // Labels
    this.fullNameLabel = page.getByText(/Full Name/i).first();
    this.descriptionLabel = page.getByText(/Project Description/i).first();
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  async goto() {
    await this.page.goto(BASE_URL, { waitUntil: "networkidle" });
  }

  // ---------------------------------------------------------------------------
  // Form interactions
  // ---------------------------------------------------------------------------

  async fillName(name: string) {
    await this.fullNameInput.fill(name);
  }

  async fillDescription(description: string) {
    await this.descriptionInput.fill(description);
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async submit() {
    await this.submitButton.click();
  }

  /** Fill both fields and click submit in one call. */
  async fillAndSubmit(name: string, description: string, email?: string) {
    await this.fillName(name);
    await this.fillEmail(email ?? `qa+${Date.now()}@example.com`);
    await this.fillDescription(description);
    await this.submit();
  }

  // ---------------------------------------------------------------------------
  // API route mocking helpers
  // ---------------------------------------------------------------------------

  async routeOrders(handler: (route: any) => void) {
    await this.page.route("**/api/orders*", handler);
    await this.page.route("**/orders*", handler);
  }

  /** Stub the orders API with a successful 201 response. */
  async mockSuccess(responseBody = { success: true }) {
    const fulfill = (route: any) =>
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(responseBody),
      });

    await this.routeOrders(fulfill);
  }

  /** Stub the orders API with an error response (default 400). */
  async mockError(status = 400, responseBody = { error: "Request failed" }) {
    const fulfill = (route: any) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(responseBody),
      });

    await this.routeOrders(fulfill);
  }

  /**
   * Stubs a successful response AND captures the outgoing request payload.
   * Returns { getPayload } — call getPayload() after submit to read the payload.
   */
  async mockSuccessAndCapturePayload(responseBody = { success: true }) {
    let capturedPayload: any = null;
    let resolvePayload: (value: any) => void = () => {};
    const payloadReady = new Promise<any>((resolve) => {
      resolvePayload = resolve;
    });

    const handler = (route: any) => {
      capturedPayload = route.request().postDataJSON();
      resolvePayload(capturedPayload);
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(responseBody),
      });
    };

    await this.routeOrders(handler);
    return {
      getPayload: () => capturedPayload,
      waitForPayload: () => payloadReady,
    };
  }

  /**
   * Intercepts the outgoing request and fulfills it with a 201 success stub.
   * Returns { getRequest } — call getRequest() after submit to inspect the request.
   */
  async interceptRequest() {
    let capturedRequest: any = null;
    let resolveRequest: (value: any) => void = () => {};
    const requestReady = new Promise<any>((resolve) => {
      resolveRequest = resolve;
    });

    const handler = (route: any) => {
      capturedRequest = route.request();
      resolveRequest(capturedRequest);
      // Fulfill with success so the app never shows an error dialog
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    };

    await this.routeOrders(handler);
    return {
      getRequest: () => capturedRequest,
      waitForRequest: () => requestReady,
    };
  }

  /**
   * Intercepts the outgoing request, captures the JSON payload, and fulfills with a 201 stub.
   * Returns { getPayload } — call getPayload() after submit to read the payload.
   */
  async interceptAndCapturePayload() {
    let capturedPayload: any = null;
    let resolvePayload: (value: any) => void = () => {};
    const payloadReady = new Promise<any>((resolve) => {
      resolvePayload = resolve;
    });

    const handler = (route: any) => {
      capturedPayload = route.request().postDataJSON();
      resolvePayload(capturedPayload);
      // Fulfill with success so the app never shows an error dialog
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    };

    await this.routeOrders(handler);
    return {
      getPayload: () => capturedPayload,
      waitForPayload: () => payloadReady,
    };
  }

  // ---------------------------------------------------------------------------
  // State helpers
  // ---------------------------------------------------------------------------

  async isSuccessVisible() {
    return this.successHeading.isVisible().catch(() => false);
  }
}
