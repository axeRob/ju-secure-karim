/** Fictional research data. Never use these passwords for real accounts. */
export type AccountKind =
  | "university"
  | "google"
  | "spotify"
  | "linkedin"
  | "github";
export type AccountStatus = "safe" | "reused" | "weak";

export interface Account {
  id: string;
  name: string;
  username: string;
  kind: AccountKind;
  password: string;
  status: AccountStatus;
  updatedAt?: string;
}

export interface IssueCounts {
  total: number;
  safe: number;
  reused: number;
  weak: number;
  issues: number;
}

export const seedAccounts: Account[] = [
  {
    id: "ju",
    name: "JU Student Web",
    username: "karim@student.ju.se",
    kind: "university",
    password: "Demo-JU!7v4P9n2",
    status: "safe",
  },
  {
    id: "google",
    name: "Google",
    username: "karim.work@example.com",
    kind: "google",
    password: "Demo-Shared!4k8",
    status: "reused",
  },
  {
    id: "spotify",
    name: "Spotify",
    username: "karim.work@example.com",
    kind: "spotify",
    password: "Demo-Shared!4k8",
    status: "reused",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    username: "karim@example.com",
    kind: "linkedin",
    password: "Demo-LI!8x2Q6m4",
    status: "safe",
  },
  {
    id: "github",
    name: "GitHub",
    username: "karim-dev",
    kind: "github",
    password: "demo123",
    status: "weak",
  },
];

let generation = 0;
const fakeStrongPasswords = [
  "Demo!K7mQ2vN9@rT4pL",
  "Demo!V8pR4xM2#nW7qJ",
  "Demo!N6tL9zB3@wP5kR",
  "Demo!Q4yS8mH7#vD2nF",
];

/** Predictable demo generator, intentionally not suitable for real security. */
export function generateDemoPassword(): string {
  const index = generation++;
  const base = fakeStrongPasswords[index % fakeStrongPasswords.length];
  return index < fakeStrongPasswords.length
    ? base
    : `${base}${Math.floor(index / fakeStrongPasswords.length)}`;
}

export interface DemoPasswordOptions {
  length: number;
  numbers: boolean;
  symbols: boolean;
}

let configuredGeneration = 0;

/**
 * Predictable research-only output. The alphabetical sequence marker remains
 * inside even the shortest result, including when numbers are switched off.
 */
export function generateConfiguredDemoPassword(
  options: DemoPasswordOptions,
): string {
  const length = Number.isFinite(options.length)
    ? Math.max(12, Math.min(32, Math.round(options.length)))
    : 20;
  const index = configuredGeneration++;
  const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const offsets = [12, 42, 21, 43];
  const marker = offsets
    .map(
      (offset, position) =>
        letters[
          (Math.floor(index / letters.length ** (3 - position)) + offset) %
            letters.length
        ],
    )
    .join("");
  const digits = "7294386150";
  const symbols = "!@#%&*?+";
  const required = `${options.numbers ? digits[index % digits.length] : ""}${options.symbols ? symbols[index % symbols.length] : ""}`;
  const alphabet = `${letters}${options.numbers ? digits : ""}${options.symbols ? symbols : ""}`;
  let password = `Demo${marker}${required}`;
  while (password.length < length) {
    password += alphabet[(index * 17 + password.length * 13) % alphabet.length];
  }
  return password;
}

export function isDemoUnique(
  password: string,
  accounts: readonly Account[],
  excludeId?: string,
): boolean {
  return !accounts.some(
    (account) => account.id !== excludeId && account.password === password,
  );
}

/** Status always reflects the current demo vault, including both sides of reuse. */
export function deriveAccountStatuses(accounts: readonly Account[]): Account[] {
  const uses = new Map<string, number>();
  for (const account of accounts) {
    uses.set(account.password, (uses.get(account.password) ?? 0) + 1);
  }
  return accounts.map((account) => ({
    ...account,
    status:
      (uses.get(account.password) ?? 0) > 1
        ? "reused"
        : account.password.length < 12
          ? "weak"
          : "safe",
  }));
}

export function countIssues(accounts: readonly Account[]): IssueCounts {
  const safe = accounts.filter((account) => account.status === "safe").length;
  const reused = accounts.filter(
    (account) => account.status === "reused",
  ).length;
  const weak = accounts.filter((account) => account.status === "weak").length;
  return { total: accounts.length, safe, reused, weak, issues: reused + weak };
}
