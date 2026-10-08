import { useCallback, useMemo, useRef, useState } from "react";
import {
  countIssues,
  deriveAccountStatuses,
  generateDemoPassword,
  seedAccounts,
  type Account,
  type AccountKind,
} from "./demo";

function inferKind(name: string): AccountKind {
  const lower = name.toLowerCase();
  if (lower.includes("spotify")) return "spotify";
  if (lower.includes("google")) return "google";
  if (lower.includes("linkedin")) return "linkedin";
  if (lower.includes("github")) return "github";
  if (lower.includes("microsoft")) return "microsoft";
  if (lower.includes("discord")) return "discord";
  if (lower.includes("netflix")) return "netflix";
  if (lower.includes("instagram")) return "instagram";
  if (lower.includes("reddit")) return "reddit";
  if (lower.includes("steam")) return "steam";
  if (lower.includes("canvas")) return "canvas";
  if (/^ju\b/.test(lower.trim()) || lower.includes("university"))
    return "university";
  return "generic";
}

/** In-memory only. Refreshing the prototype discards every demo change. */
export function useDemo() {
  const [initialized, setInitialized] = useState(false);
  const [storedAccounts, setStoredAccounts] = useState<Account[]>([]);
  const nextAccountId = useRef(1);

  const accounts = useMemo(
    () => deriveAccountStatuses(storedAccounts),
    [storedAccounts],
  );
  const counts = useMemo(() => countIssues(accounts), [accounts]);
  const reuseGroups = useMemo(() => {
    const groups = new Map<string, Account[]>();
    for (const account of accounts) {
      if (account.status !== "reused") continue;
      const group = groups.get(account.password) ?? [];
      group.push(account);
      groups.set(account.password, group);
    }
    return [...groups.values()];
  }, [accounts]);

  const importAccounts = useCallback(() => {
    setStoredAccounts(seedAccounts.map((account) => ({ ...account })));
    setInitialized(true);
  }, []);

  const startEmpty = useCallback(() => {
    setStoredAccounts([]);
    setInitialized(true);
  }, []);

  const addAccount = useCallback(
    (name: string, username: string, password?: string): string => {
      const id = `demo-account-${nextAccountId.current++}`;
      const account: Account = {
        id,
        name: name.trim() || "Demo account",
        username: username.trim() || "karim@example.com",
        kind: inferKind(name),
        password: password || generateDemoPassword(),
        status: "safe",
        updatedAt: new Date().toISOString(),
      };
      setStoredAccounts((previous) => [...previous, account]);
      return id;
    },
    [],
  );

  const fixAccount = useCallback((id: string, password: string) => {
    setStoredAccounts((previous) =>
      previous.map((account) =>
        account.id === id
          ? { ...account, password, updatedAt: new Date().toISOString() }
          : account,
      ),
    );
  }, []);

  const resetDemo = useCallback(() => {
    setStoredAccounts([]);
    setInitialized(false);
    nextAccountId.current = 1;
  }, []);

  const getReuseGroup = useCallback(
    (id: string): Account[] =>
      reuseGroups.find((group) => group.some((account) => account.id === id)) ??
      [],
    [reuseGroups],
  );

  return {
    initialized,
    accounts,
    counts,
    reuseGroups,
    getReuseGroup,
    importAccounts,
    startEmpty,
    addAccount,
    fixAccount,
    resetDemo,
  };
}

export type DemoState = ReturnType<typeof useDemo>;
