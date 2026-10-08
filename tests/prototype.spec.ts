import { expect, test, type Page } from "@playwright/test";

const navigation = (page: Page) =>
  page.getByRole("navigation", { name: "Main navigation" });
const accountRow = (page: Page, name: string) =>
  page.locator(".account-list").getByRole("button", { name: new RegExp(name) });

async function importDemo(page: Page) {
  await page.goto("./");
  await page.getByRole("button", { name: "Import demo accounts" }).click();
  await expect(
    page.getByRole("heading", { name: "Vault", exact: true }),
  ).toBeVisible();
}

test("quick start opens a populated demo vault with safe defaults", async ({
  page,
}) => {
  await page.goto("./");
  await expect(
    page.getByRole("heading", { name: /Quick start/ }),
  ).toBeVisible();
  await expect(
    page.getByText("Fictional accounts. No browser access needed."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Advanced options" }).click();
  await expect(
    page.getByRole("switch", { name: "Auto-lock preset" }),
  ).toBeChecked();
  await expect(
    page.getByRole("switch", { name: "Reuse alerts" }),
  ).toBeChecked();
  await page.getByRole("button", { name: "Import demo accounts" }).click();
  await expect(page.locator(".account-list").getByRole("button")).toHaveCount(
    5,
  );
  await expect(page.locator(".health-card")).toContainText("3 need attention");
  await expect(accountRow(page, "Spotify")).toContainText("Reused");
  await expect(accountRow(page, "Google")).toContainText("Reused");
  await expect(
    navigation(page).getByRole("button", { name: "Vault", exact: true }),
  ).toHaveAttribute("aria-current", "page");
});

test("one quick fix resolves both reused accounts and preserves the unrelated warning", async ({
  page,
}) => {
  await importDemo(page);
  await page
    .getByRole("button", { name: "Fix Spotify password", exact: true })
    .click();
  const fix = page.getByRole("dialog", { name: "Quick fix" });
  await expect(
    fix.getByRole("heading", { name: "Make Spotify unique." }),
  ).toBeVisible();
  await expect(fix.getByText("Same password as Google")).toBeVisible();
  await expect(fix.getByText("Updates this demo vault only.")).toBeVisible();
  const generated = await fix.locator("code").innerText();
  await fix.getByRole("button", { name: "Use unique password" }).click();
  const success = page.getByRole("dialog", { name: "All done" });
  await expect(
    success.getByRole("heading", { name: "Spotify is now unique." }),
  ).toBeVisible();
  await expect(
    success.getByText("Google’s reuse warning is cleared, too."),
  ).toBeVisible();
  await success.getByRole("button", { name: "Back to vault" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(accountRow(page, "Spotify")).toContainText("Safe");
  await expect(accountRow(page, "Google")).toContainText("Safe");
  await expect(accountRow(page, "GitHub")).toContainText("Weak");
  await expect(page.locator(".health-card")).toContainText("1 needs attention");
  await expect(
    page.getByRole("button", { name: "Fix GitHub password" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Vault", exact: true }),
  ).toBeFocused();
  await accountRow(page, "Spotify").click();
  await expect(
    page.getByRole("dialog", { name: "Account details" }).locator("code"),
  ).toHaveText(generated);
});

test("not now and Escape close the fix without changing the vault", async ({
  page,
}) => {
  await importDemo(page);
  const trigger = page.getByRole("button", {
    name: "Fix Spotify password",
    exact: true,
  });
  await trigger.click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Not now" })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(accountRow(page, "Spotify")).toContainText("Reused");
  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page.locator(".health-card")).toContainText("3 need attention");
});

test("search, clear and attention filter remain recoverable", async ({
  page,
}) => {
  await importDemo(page);
  const search = page.getByRole("textbox", { name: "Search accounts" });
  await search.fill("sPoTiFy");
  await expect(page.locator(".account-list").getByRole("button")).toHaveCount(
    1,
  );
  await expect(accountRow(page, "Spotify")).toBeVisible();
  await search.fill("karim.work@example.com");
  await expect(page.locator(".account-list").getByRole("button")).toHaveCount(
    2,
  );
  await search.fill("missing service");
  await expect(
    page.getByRole("heading", { name: "No accounts found." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Show all accounts" }).click();
  await expect(search).toHaveValue("");
  await expect(page.locator(".account-list").getByRole("button")).toHaveCount(
    5,
  );
  await page.getByRole("button", { name: /Needs attention/ }).click();
  await expect(page.locator(".account-list").getByRole("button")).toHaveCount(
    3,
  );
  await page.getByRole("button", { name: /All accounts/ }).click();
  await expect(page.locator(".account-list").getByRole("button")).toHaveCount(
    5,
  );
  await page.keyboard.press("/");
  await expect(search).toBeFocused();
});

test("navigation offers direct security and generator actions and preserves fixes", async ({
  page,
}) => {
  await importDemo(page);
  await navigation(page)
    .getByRole("button", { name: /Security/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Security", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Fix Spotify password" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Use unique password" })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Back to vault" })
    .click();
  await navigation(page)
    .getByRole("button", { name: /Security/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "1 account needs a fix." }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Reused password" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Strengthen GitHub" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Use unique password" })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Back to vault" })
    .click();
  await expect(page.getByText("All clear.", { exact: true })).toBeVisible();
  await navigation(page)
    .getByRole("button", { name: "Generator", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Generator", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("slider", { name: "Password length" }),
  ).toHaveValue("20");
  await expect(
    page.getByRole("switch", { name: "Include numbers" }),
  ).toBeChecked();
  await expect(
    page.getByRole("switch", { name: "Include symbols" }),
  ).toBeChecked();
  const password = await page.locator(".generated-password").innerText();
  await page.getByRole("button", { name: "Generate another password" }).click();
  await expect(page.locator(".generated-password")).not.toHaveText(password);
  await navigation(page)
    .getByRole("button", { name: "Vault", exact: true })
    .click();
  await expect(page.locator(".account-list .status-safe")).toHaveCount(5);
});

test("empty vault can add a fictional account with an automatic unique password", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Start with an empty vault" }).click();
  await expect(
    page.getByRole("heading", { name: "A fresh start." }),
  ).toBeVisible();
  await page
    .locator(".empty-state")
    .getByRole("button", { name: "Add demo account" })
    .click();
  const add = page.getByRole("dialog", { name: "Add account" });
  await add
    .getByRole("textbox", { name: "Website or app" })
    .fill("Demo Study App");
  await add
    .getByRole("textbox", { name: "Email / username" })
    .fill("student@example.com");
  await add.getByRole("button", { name: "Add to demo vault" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(accountRow(page, "Demo Study App")).toContainText("Safe");
  await expect(
    page.getByText("Demo account added with a unique password"),
  ).toBeVisible();
  await accountRow(page, "Demo Study App").click();
  await expect(
    page.getByRole("dialog", { name: "Account details" }).locator("code"),
  ).toContainText("Demo");
});

test("empty vault can load the research demo data", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Start with an empty vault" }).click();
  await page.getByRole("button", { name: "Load demo accounts" }).click();
  await expect(page.locator(".account-list").getByRole("button")).toHaveCount(
    5,
  );
  await expect(
    page.getByRole("button", { name: "Fix Spotify password" }),
  ).toBeVisible();
});

test("settings preferences apply during the session and reset restores defaults", async ({
  page,
}) => {
  await importDemo(page);
  await navigation(page)
    .getByRole("button", { name: "Settings", exact: true })
    .click();
  const reuse = page.getByRole("switch", { name: "Reuse alerts" });
  await expect(reuse).toBeChecked();
  await reuse.click();
  await page.getByRole("switch", { name: "Auto-lock preset" }).click();
  await navigation(page)
    .getByRole("button", { name: "Vault", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Fix Spotify password" }),
  ).toHaveCount(0);
  await expect(accountRow(page, "Spotify")).toContainText("Reused");
  await expect(
    page.getByRole("button", { name: "Fix GitHub password" }),
  ).toBeVisible();
  await navigation(page)
    .getByRole("button", { name: "Settings", exact: true })
    .click();
  await expect(reuse).not.toBeChecked();
  await page.getByRole("button", { name: "Reset demo" }).click();
  await expect(
    page.getByRole("heading", { name: /Quick start/ }),
  ).toBeVisible();
  await expect(navigation(page)).toHaveCount(0);
  await page.getByRole("button", { name: "Advanced options" }).click();
  await expect(
    page.getByRole("switch", { name: "Reuse alerts" }),
  ).toBeChecked();
  await expect(
    page.getByRole("switch", { name: "Auto-lock preset" }),
  ).toBeChecked();
  await page.getByRole("button", { name: "Import demo accounts" }).click();
  await expect(page.locator(".health-card")).toContainText("3 need attention");
});

test("clipboard failure is reported honestly inside the active dialog", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error("Clipboard unavailable for this test");
        },
      },
    });
  });
  await importDemo(page);
  await page.getByRole("button", { name: "Fix Spotify password" }).click();
  const dialog = page.getByRole("dialog", { name: "Quick fix" });
  await dialog
    .getByRole("button", { name: "Copy password", exact: true })
    .click();
  await expect(dialog.getByRole("status")).toHaveText(
    "Copy unavailable. Select the password to copy it.",
  );
  await expect(dialog.getByText("Demo password copied")).toHaveCount(0);
  await dialog.getByRole("button", { name: "Not now" }).click();
  await expect(accountRow(page, "Spotify")).toContainText("Reused");
});

test("fixing Google names Spotify as the other resolved reuse warning", async ({
  page,
}) => {
  await importDemo(page);
  await accountRow(page, "Google").click();
  await page
    .getByRole("dialog", { name: "Quick fix" })
    .getByRole("button", { name: "Use unique password" })
    .click();
  const success = page.getByRole("dialog", { name: "All done" });
  await expect(
    success.getByRole("heading", { name: "Google is now unique." }),
  ).toBeVisible();
  await expect(
    success.getByText("Spotify’s reuse warning is cleared, too."),
  ).toBeVisible();
  await expect(
    success.getByText("Google’s reuse warning is cleared, too."),
  ).toHaveCount(0);
});

test("quiet reuse alerts cannot claim all clear while shared passwords remain", async ({
  page,
}) => {
  await importDemo(page);
  await navigation(page)
    .getByRole("button", { name: "Settings", exact: true })
    .click();
  await page.getByRole("switch", { name: "Reuse alerts" }).click();
  await navigation(page)
    .getByRole("button", { name: "Vault", exact: true })
    .click();
  await page.getByRole("button", { name: "Fix GitHub password" }).click();
  await page
    .getByRole("dialog", { name: "Quick fix" })
    .getByRole("button", { name: "Use unique password" })
    .click();
  await page
    .getByRole("dialog", { name: "All done" })
    .getByRole("button", { name: "Back to vault" })
    .click();
  await expect(page.locator(".health-card")).toContainText("2 need attention");
  await expect(accountRow(page, "Spotify")).toContainText("Reused");
  await expect(accountRow(page, "Google")).toContainText("Reused");
  await expect(accountRow(page, "GitHub")).toContainText("Safe");
  await expect(page.getByText("All clear.", { exact: true })).toHaveCount(0);
});

test("security explains the remaining weak password after reuse is resolved", async ({
  page,
}) => {
  await importDemo(page);
  await page.getByRole("button", { name: "Fix Spotify password" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Use unique password" })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Back to vault" })
    .click();
  await navigation(page)
    .getByRole("button", { name: /Security/ })
    .click();
  await expect(page.locator(".security-summary")).toContainText(
    "1 account needs a fix.",
  );
  await expect(page.locator(".security-summary")).toContainText(/weak/i);
  await expect(page.locator(".security-summary")).not.toContainText(/reuse/i);
  await expect(
    page.getByRole("heading", { name: "Weak password" }),
  ).toBeVisible();
});

for (const option of ["short length", "no numbers"] as const) {
  test(`generator produces distinct demo passwords across eight runs with ${option}`, async ({
    page,
  }) => {
    await importDemo(page);
    await navigation(page)
      .getByRole("button", { name: "Generator", exact: true })
      .click();
    if (option === "short length") {
      await page.getByRole("slider", { name: "Password length" }).focus();
      await page.keyboard.press("Home");
      await expect(
        page.getByRole("slider", { name: "Password length" }),
      ).toHaveValue("12");
    } else {
      await page.getByRole("switch", { name: "Include numbers" }).click();
      await expect(
        page.getByRole("switch", { name: "Include numbers" }),
      ).not.toBeChecked();
    }
    const values: string[] = [];
    for (let index = 0; index < 8; index++) {
      const value = await page.locator(".generated-password").innerText();
      expect(values).not.toContain(value);
      expect(value).toHaveLength(option === "short length" ? 12 : 20);
      if (option === "no numbers") expect(value).not.toMatch(/[0-9]/);
      values.push(value);
      await page
        .getByRole("button", { name: "Generate another password" })
        .click();
    }
    await expect(page.locator(".quiet-card")).not.toContainText(
      "Safe defaults are on",
    );
  });
}

for (const width of [320, 390, 1440]) {
  test(`layout stays usable at ${width}px with visible navigation and no horizontal overflow`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await importDemo(page);
    const dimensions = await page.evaluate(() => ({
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
    }));
    expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewport);
    expect(dimensions.bodyWidth).toBeLessThanOrEqual(dimensions.viewport);
    const nav = await navigation(page).boundingBox();
    const content = await page.getByRole("main").boundingBox();
    expect(nav).not.toBeNull();
    expect(content).not.toBeNull();
    expect(content!.y + content!.height).toBeLessThanOrEqual(nav!.y + 1);
    expect(nav!.y + nav!.height).toBeLessThanOrEqual(844);
    for (const button of await navigation(page).getByRole("button").all()) {
      const box = await button.boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
    await page.getByRole("button", { name: "Fix Spotify password" }).click();
    const dialog = page.getByRole("dialog", { name: "Quick fix" });
    await expect(dialog).toBeVisible();
    const bounds = await dialog.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width + 1);
    await expect(
      dialog.getByRole("button", { name: "Use unique password" }),
    ).toBeInViewport();
  });
}
