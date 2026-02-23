// This file was used for discovery and can be deleted.
import { test } from "@playwright/test";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

test("discover - UI state after successful submission", async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: "networkidle" });

  // Mock a successful 201 response
  await page.route("**/api/orders", (route) => {
    route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ success: true, orderId: "123" }),
    });
  });

  await page.getByRole("textbox", { name: /Full Name/i }).fill("John Doe");
  await page
    .getByRole("textbox", { name: /Project Description/i })
    .fill("Test project");

  await page.getByRole("button", { name: /Submit Request/i }).click();

  // Wait briefly for UI to update
  await page.waitForTimeout(1000);

  // Capture full page HTML after submission
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log("=== BODY TEXT AFTER SUCCESS ===");
  console.log(bodyText);

  // Check for any success-related elements
  const successElements = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll("*"));
    return all
      .filter((el) => {
        const text = (el as HTMLElement).innerText || el.textContent || "";
        return (
          text.toLowerCase().includes("success") ||
          text.toLowerCase().includes("thank") ||
          text.toLowerCase().includes("submitted") ||
          text.toLowerCase().includes("received") ||
          text.toLowerCase().includes("sent")
        );
      })
      .map((el) => ({
        tag: el.tagName,
        text: (((el as HTMLElement).innerText || el.textContent || "") as string).trim().substring(0, 100),
        class: (el as HTMLElement).className,
      }))
      .filter((e) => e.text.length > 0 && e.text.length < 200)
      .slice(0, 10);
  });
  console.log("=== SUCCESS ELEMENTS ===");
  console.log(JSON.stringify(successElements, null, 2));

  // Check if form still visible
  const formVisible = await page
    .getByRole("button", { name: /Submit Request/i })
    .isVisible()
    .catch(() => false);
  console.log("=== SUBMIT BUTTON STILL VISIBLE:", formVisible);
});

test("discover - UI state after failed submission (400)", async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: "networkidle" });

  // Monitor for alert dialog
  let dialogMessage: string | null = null;
  page.on("dialog", async (dialog) => {
    dialogMessage = dialog.message();
    console.log("=== DIALOG MESSAGE ===", dialogMessage);
    await dialog.dismiss();
  });

  // Mock a 400 response
  await page.route("**/api/orders", (route) => {
    route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({ error: "Invalid request" }),
    });
  });

  await page.getByRole("textbox", { name: /Full Name/i }).fill("John Doe");
  await page
    .getByRole("textbox", { name: /Project Description/i })
    .fill("Test project");

  await page.getByRole("button", { name: /Submit Request/i }).click();
  await page.waitForTimeout(1000);

  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log("=== BODY TEXT AFTER 400 ===");
  console.log(bodyText);

  console.log("=== DIALOG WAS:", dialogMessage);
});

