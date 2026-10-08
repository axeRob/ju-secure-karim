import { expect, test, type Locator, type Page } from "@playwright/test";

const navigation = (page: Page) =>
  page.getByRole("navigation", { name: "Main navigation" });
const accountRow = (page: Page, name: string) =>
  page.locator(".account-list").getByRole("button", { name: new RegExp(name) });

async function revealPassword(dialog: Locator) {
  const show = dialog.getByRole("button", {
    name: "Show password",
    exact: true,
  });
  if (await show.isVisible()) await show.click();
  return dialog.locator("code").innerText();
}

async function expectCounts(
  page: Page,
  safe: number,
  reused: number,
  weak: number,
) {
  await expect(page.locator(".health-stats .stat-value")).toHaveText([
    String(safe),
    String(reused),
    String(weak),
  ]);
  const issues = reused + weak;
  await expect(page.locator(".health-count")).toHaveText(
    issues === 0
      ? "Looking good"
      : `${issues} ${issues === 1 ? "needs" : "need"} attention`,
  );
}

async function stubClipboard(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(window, "__demoClipboardText", {
      value: "",
      writable: true,
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          Reflect.set(window, "__demoClipboardText", value);
        },
      },
    });
  });
}

async function finishFix(page: Page) {
  await page
    .getByRole("dialog", { name: "Quick fix" })
    .getByRole("button", { name: "Use unique password" })
    .click();
  await page
    .getByRole("dialog", { name: "All done" })
    .getByRole("button", { name: "Back to vault" })
    .click();
}

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
    12,
  );
  await expectCounts(page, 6, 4, 2);
  await expect(accountRow(page, "Spotify")).toContainText("Reused");
  await expect(accountRow(page, "Google")).toContainText("Reused");
  await expect(
    navigation(page).getByRole("button", { name: "Vault", exact: true }),
  ).toHaveAttribute("aria-current", "page");
});

test("one quick fix resolves its reuse group and preserves independent issues", async ({
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
  const generated = await revealPassword(fix);
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
  await expect(accountRow(page, "Discord")).toContainText("Reused");
  await expect(accountRow(page, "Netflix")).toContainText("Reused");
  await expectCounts(page, 8, 2, 2);
  await expect(
    page.getByRole("button", { name: "Fix GitHub password" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Vault", exact: true }),
  ).toBeFocused();
  await accountRow(page, "Spotify").click();
  await page
    .getByRole("dialog", { name: "Account details" })
    .getByRole("button", { name: "Show password", exact: true })
    .click();
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
  await expectCounts(page, 6, 4, 2);
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
    12,
  );
  await page.getByRole("button", { name: /Needs attention/ }).click();
  await expect(page.locator(".account-list").getByRole("button")).toHaveCount(
    6,
  );
  await page.getByRole("button", { name: /All accounts/ }).click();
  await expect(page.locator(".account-list").getByRole("button")).toHaveCount(
    12,
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
    page.getByRole("heading", { name: "4 accounts need a fix." }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Reused password" }),
  ).toHaveCount(1);
  await page.getByRole("button", { name: "Strengthen GitHub" }).click();
  const githubPassword = await revealPassword(
    page.getByRole("dialog", { name: "Quick fix" }),
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Use unique password" })
    .click();
  await expect(
    page
      .getByRole("dialog", { name: "All done" })
      .getByRole("heading", { name: "GitHub is now stronger." }),
  ).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Back to vault" })
    .click();
  await expectCounts(page, 9, 2, 1);
  await expect(accountRow(page, "Google")).toContainText("Safe");
  await expect(accountRow(page, "Spotify")).toContainText("Safe");
  await expect(accountRow(page, "Discord")).toContainText("Reused");
  await expect(accountRow(page, "Netflix")).toContainText("Reused");
  await expect(accountRow(page, "Reddit")).toContainText("Weak");
  await expect(page.getByText("All clear.", { exact: true })).toHaveCount(0);
  await accountRow(page, "GitHub").click();
  const githubDetails = page.getByRole("dialog", { name: "Account details" });
  await expect(githubDetails.locator("code")).toHaveText(/^•+$/);
  expect(await revealPassword(githubDetails)).toBe(githubPassword);
  await githubDetails.getByRole("button", { name: "Close dialog" }).click();
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
  await expect(page.locator(".account-list .status-safe")).toHaveCount(9);
});

test("empty vault can add a fictional account with an automatic unique password", async ({
  page,
}) => {
  await stubClipboard(page);
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
  const save = add.getByRole("button", { name: "Add to demo vault" });
  await expect(save).toBeDisabled();
  await expect(add.locator("code")).toHaveText(/^•+$/);
  await add.getByRole("textbox", { name: "Website or app" }).fill("   ");
  await add.getByRole("textbox", { name: "Email / username" }).fill("   ");
  await expect(save).toBeDisabled();
  await add
    .getByRole("textbox", { name: "Website or app" })
    .fill("Demo Study App");
  await add
    .getByRole("textbox", { name: "Email / username" })
    .fill("student@example.com");
  await expect(save).toBeEnabled();
  await add.getByRole("button", { name: "Copy password", exact: true }).click();
  await expect(add).toBeVisible();
  const copied = await page.evaluate(() =>
    Reflect.get(window, "__demoClipboardText"),
  );
  await add.getByRole("button", { name: "Show password", exact: true }).click();
  await expect(add.locator("code")).toHaveText(copied);
  await expect(add).toBeVisible();
  await add.getByRole("button", { name: "Hide password", exact: true }).click();
  await expect(add.locator("code")).toHaveText(/^•+$/);
  await add
    .getByRole("button", { name: "Regenerate password", exact: true })
    .click();
  await expect(add).toBeVisible();
  await expect(page.locator(".account-list").getByRole("button")).toHaveCount(
    0,
  );
  const generated = await revealPassword(add);
  expect(generated).not.toBe(copied);
  await add.getByRole("button", { name: "Copy password", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => Reflect.get(window, "__demoClipboardText")))
    .toBe(generated);
  await add.getByRole("button", { name: "Hide password", exact: true }).click();
  await expect(add).toBeVisible();
  await save.click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(accountRow(page, "Demo Study App")).toContainText("Safe");
  await expect(
    page.getByText("Demo account added with a unique password"),
  ).toBeVisible();
  await accountRow(page, "Demo Study App").click();
  await page
    .getByRole("dialog", { name: "Account details" })
    .getByRole("button", { name: "Show password", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Account details" }).locator("code"),
  ).toHaveText(generated);
  await expectCounts(page, 1, 0, 0);
});

test("empty vault can load the research demo data", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Start with an empty vault" }).click();
  await page.getByRole("button", { name: "Load demo accounts" }).click();
  await expect(page.locator(".account-list").getByRole("button")).toHaveCount(
    12,
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
  await expectCounts(page, 6, 4, 2);
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
    .getByRole("dialog", { name: "Account details" })
    .getByRole("button", { name: "Fix password", exact: true })
    .click();
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
  await expectCounts(page, 7, 4, 1);
  await expect(accountRow(page, "Spotify")).toContainText("Reused");
  await expect(accountRow(page, "Google")).toContainText("Reused");
  await expect(accountRow(page, "GitHub")).toContainText("Safe");
  await expect(page.getByText("All clear.", { exact: true })).toHaveCount(0);
  await page
    .getByRole("button", { name: "Fix Reddit password", exact: true })
    .click();
  await finishFix(page);
  await expectCounts(page, 8, 4, 0);
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
  await page
    .getByRole("button", { name: "Fix Discord password", exact: true })
    .click();
  await finishFix(page);
  await navigation(page)
    .getByRole("button", { name: /Security/ })
    .click();
  await expect(page.locator(".security-summary")).toContainText(
    "2 accounts need a fix.",
  );
  await expect(page.locator(".security-summary")).toContainText(/weak/i);
  await expect(page.locator(".security-summary")).not.toContainText(/reuse/i);
  await expect(
    page.getByRole("heading", { name: "Weak password" }),
  ).toHaveCount(2);
});

test("every demo account opens its own masked details and copies its actual password", async ({
  page,
}) => {
  await stubClipboard(page);
  await importDemo(page);
  const rows = await page.locator(".account-list").getByRole("button").all();
  expect(rows).toHaveLength(12);
  for (const row of rows) {
    const name = await row.locator(".account-info strong").innerText();
    const username = await row.locator(".account-info > span").innerText();
    const status = await row.locator(".status").innerText();
    await row.click();
    const details = page.getByRole("dialog", { name: "Account details" });
    await expect(
      details.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
    await expect(details.getByText(username, { exact: true })).toBeVisible();
    await expect(details.locator(".status")).toHaveText(status);
    await expect(details.locator("code")).toHaveText(/^•+$/);
    await expect(
      details.getByRole("button", { name: "Fix password", exact: true }),
    ).toHaveCount(status === "Safe" ? 0 : 1);
    await details
      .getByRole("button", { name: "Copy password", exact: true })
      .click();
    await expect(details.getByRole("status")).toHaveText(
      "Demo password copied",
    );
    const copied = await page.evaluate(() =>
      Reflect.get(window, "__demoClipboardText"),
    );
    expect(copied).toBeTruthy();
    expect(copied).not.toMatch(/^•+$/);
    await details
      .getByRole("button", { name: "Show password", exact: true })
      .click();
    await expect(details.locator("code")).toHaveText(copied);
    await details
      .getByRole("button", { name: "Hide password", exact: true })
      .click();
    await expect(details.locator("code")).toHaveText(/^•+$/);
    await details.getByRole("button", { name: "Close dialog" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
  await expectCounts(page, 6, 4, 2);
});

for (const account of ["Spotify", "GitHub"]) {
  test(`${account} details offer a single contextual fix without changing the account on cancellation`, async ({
    page,
  }) => {
    await importDemo(page);
    await accountRow(page, account).click();
    const details = page.getByRole("dialog", { name: "Account details" });
    const original = await revealPassword(details);
    const fixButton = details.getByRole("button", {
      name: "Fix password",
      exact: true,
    });
    await expect(fixButton).toHaveCount(1);
    await fixButton.click();
    const fix = page.getByRole("dialog", { name: "Quick fix" });
    await expect(
      fix.getByRole("heading", {
        name:
          account === "Spotify" ? "Make Spotify unique." : "Strengthen GitHub.",
      }),
    ).toBeVisible();
    expect(await revealPassword(fix)).not.toBe(original);
    await fix.getByRole("button", { name: "Not now" }).click();
    await expectCounts(page, 6, 4, 2);
    await accountRow(page, account).click();
    expect(
      await revealPassword(
        page.getByRole("dialog", { name: "Account details" }),
      ),
    ).toBe(original);
  });
}

test("cancelling Add Account has no side effects in empty or populated vaults", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Start with an empty vault" }).click();
  await page
    .locator(".empty-state")
    .getByRole("button", { name: "Add demo account" })
    .click();
  let add = page.getByRole("dialog", { name: "Add account" });
  await add
    .getByRole("textbox", { name: "Website or app" })
    .fill("Cancelled App");
  await add
    .getByRole("textbox", { name: "Email / username" })
    .fill("cancel@example.com");
  await add.getByRole("button", { name: "Regenerate password" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "A fresh start." }),
  ).toBeVisible();
  await expect(page.locator(".account-list").getByRole("button")).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "Load demo accounts" }).click();
  await page
    .getByRole("button", { name: "Add demo account", exact: true })
    .click();
  add = page.getByRole("dialog", { name: "Add account" });
  await add
    .getByRole("textbox", { name: "Website or app" })
    .fill("Cancelled App");
  await add
    .getByRole("textbox", { name: "Email / username" })
    .fill("cancel@example.com");
  await add.getByRole("button", { name: "Close dialog" }).click();
  await expect(page.locator(".account-list").getByRole("button")).toHaveCount(
    12,
  );
  await expect(accountRow(page, "Cancelled App")).toHaveCount(0);
  await expectCounts(page, 6, 4, 2);
});

test("masked clipboard failures offer an honest manual fallback without saving an account", async ({
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
  await accountRow(page, "JU Student Web").click();
  const details = page.getByRole("dialog", { name: "Account details" });
  await details
    .getByRole("button", { name: "Copy password", exact: true })
    .click();
  await expect(details.getByRole("status")).toHaveText(
    "Copy unavailable. Show the password to copy manually.",
  );
  await expect(details.locator("code")).toHaveText(/^•+$/);
  await details
    .getByRole("button", { name: "Show password", exact: true })
    .click();
  await details
    .getByRole("button", { name: "Copy password", exact: true })
    .click();
  await expect(details.getByRole("status")).toHaveText(
    "Copy unavailable. Select the password to copy it.",
  );
  await details.getByRole("button", { name: "Close dialog" }).click();
  await page
    .getByRole("button", { name: "Add demo account", exact: true })
    .click();
  const add = page.getByRole("dialog", { name: "Add account" });
  await add.getByRole("button", { name: "Copy password", exact: true }).click();
  await expect(add.getByRole("status")).toHaveText(
    "Copy unavailable. Show the password to copy manually.",
  );
  await expect(add.locator("code")).toHaveText(/^•+$/);
  await expect(page.locator(".account-list").getByRole("button")).toHaveCount(
    12,
  );
  await add.getByRole("button", { name: "Close dialog" }).click();
  await expectCounts(page, 6, 4, 2);
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
