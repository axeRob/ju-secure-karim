import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Fingerprint,
  Github,
  Gamepad2,
  GraduationCap,
  Instagram,
  KeyRound,
  LockKeyhole,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  X,
  Zap,
  AlertTriangle,
} from "lucide-react";
import {
  generateConfiguredDemoPassword,
  generateDemoPassword,
  type Account,
} from "./demo";
import { useDemo } from "./useDemo";

type Tab = "vault" | "security" | "generator" | "settings";
type Overlay =
  | { kind: "fix"; accountId: string; password: string }
  | { kind: "account"; accountId: string }
  | {
      kind: "success";
      accountId: string;
      clearedCompanion?: string;
      fixedStatus: "reused" | "weak";
    }
  | { kind: "add"; password: string };

type ToastMessage = { message: string; type: "success" | "error" };

function Toast({
  toast,
  inSheet = false,
}: {
  toast: ToastMessage;
  inSheet?: boolean;
}) {
  return (
    <div
      className={`${inSheet ? "sheet-toast" : "toast"} ${toast.type === "error" ? "toast-error" : ""}`}
      role="status"
    >
      {toast.type === "error" ? (
        <AlertTriangle size={17} />
      ) : (
        <CheckCheck size={17} />
      )}
      {toast.message}
    </div>
  );
}

function Button({
  children,
  secondary = false,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { secondary?: boolean }) {
  return (
    <button
      className={`button ${secondary ? "button-secondary" : "button-primary"} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: Account["status"] }) {
  return (
    <span className={`status status-${status}`}>
      {status === "safe" && <Check size={11} />}
      {status === "safe" ? "Safe" : status === "reused" ? "Reused" : "Weak"}
    </span>
  );
}

function AccountIcon({
  account,
  large = false,
}: {
  account: Account;
  large?: boolean;
}) {
  return (
    <span
      className={`account-icon icon-${account.kind} ${large ? "account-icon-large" : ""}`}
      aria-hidden="true"
    >
      {account.kind === "google" ? (
        <span className="google-g">G</span>
      ) : account.kind === "spotify" ? (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="11" />
          <path
            d="M6 9c4-1.4 8-1 12 .9M6.7 12c3.4-1 6.8-.7 10 1M7.5 15c2.7-.7 5.5-.4 8 1"
            fill="none"
            stroke="#10281d"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      ) : account.kind === "github" ? (
        <Github size={large ? 27 : 21} />
      ) : account.kind === "linkedin" ? (
        <span className="linkedin-in">in</span>
      ) : account.kind === "university" ? (
        <span className="ju-mark">
          JU<span>•</span>
        </span>
      ) : account.kind === "microsoft" ? (
        <span className="microsoft-mark">
          <span />
          <span />
          <span />
          <span />
        </span>
      ) : account.kind === "instagram" ? (
        <Instagram size={large ? 27 : 21} />
      ) : account.kind === "steam" || account.kind === "discord" ? (
        <Gamepad2 size={large ? 27 : 21} />
      ) : account.kind === "canvas" ? (
        <GraduationCap size={large ? 27 : 21} />
      ) : (
        <span className="account-monogram">
          {account.kind === "reddit"
            ? "r/"
            : account.name.trim().charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  );
}

function AccountRow({
  account,
  onClick,
}: {
  account: Account;
  onClick: () => void;
}) {
  return (
    <button className="account-row" onClick={onClick}>
      <AccountIcon account={account} />
      <span className="account-info">
        <strong>{account.name}</strong>
        <span>{account.username}</span>
      </span>
      <StatusBadge status={account.status} />
      <ChevronRight size={15} className="row-chevron" />
    </button>
  );
}

function Modal({
  title,
  onClose,
  children,
  className = "",
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const element = ref.current!;
    const previous = document.activeElement as HTMLElement | null;
    element.showModal();
    return () => {
      element.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`sheet ${className}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div
        className="sheet-content"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet-handle" />
        <div className="sheet-heading">
          <span id={titleId}>{title}</span>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

function PasswordField({
  password,
  onCopy,
  label = "NEW PASSWORD",
  initialVisible = false,
  onRegenerate,
}: {
  password: string;
  onCopy: (password: string, masked: boolean) => void;
  label?: string;
  initialVisible?: boolean;
  onRegenerate?: () => void;
}) {
  const [visible, setVisible] = useState(initialVisible);
  return (
    <div className="password-box">
      <div className="password-label">
        <span className="eyebrow">{label}</span>
        {onRegenerate && (
          <button
            type="button"
            className="icon-button"
            aria-label="Regenerate password"
            onClick={onRegenerate}
          >
            <RefreshCw size={16} />
          </button>
        )}
      </div>
      <div className="password-line">
        <code>{visible ? password : "••••••••••••••••••"}</code>
        <button
          type="button"
          className="icon-button"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
        <button
          type="button"
          className="icon-button"
          aria-label="Copy password"
          onClick={() => onCopy(password, !visible)}
        >
          <Copy size={18} />
        </button>
      </div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      className={`toggle ${checked ? "toggle-on" : ""}`}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  );
}

export default function App() {
  const demo = useDemo();
  const [tab, setTab] = useState<Tab>("vault");
  const [query, setQuery] = useState("");
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [advanced, setAdvanced] = useState(false);
  const [autoLock, setAutoLock] = useState(true);
  const [reuseAlerts, setReuseAlerts] = useState(true);
  const [length, setLength] = useState(20);
  const [symbols, setSymbols] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [generatorPassword, setGeneratorPassword] = useState(
    "Demo!K7mQ2vN9@rT4pL8x",
  );
  const [addName, setAddName] = useState("");
  const [addUsername, setAddUsername] = useState("");
  const mainRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const pageTitleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [tab, demo.initialized]);
  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if (
        event.key !== "/" ||
        overlay ||
        !demo.initialized ||
        /INPUT|TEXTAREA|SELECT/.test((event.target as HTMLElement).tagName)
      )
        return;
      event.preventDefault();
      setTab("vault");
      setTimeout(() => searchRef.current?.focus(), 30);
    };
    document.addEventListener("keydown", focusSearch);
    return () => document.removeEventListener("keydown", focusSearch);
  }, [overlay, demo.initialized]);

  const copy = async (password: string, masked = false) => {
    try {
      await navigator.clipboard.writeText(password);
      setToast({ message: "Demo password copied", type: "success" });
    } catch {
      setToast({
        message: masked
          ? "Copy unavailable. Show the password to copy manually."
          : "Copy unavailable. Select the password to copy it.",
        type: "error",
      });
    }
  };

  const openAccount = (account: Account) => {
    setToast(null);
    setOverlay({ kind: "account", accountId: account.id });
  };
  const openFix = (account: Account) => {
    setToast(null);
    setOverlay({
      kind: "fix",
      accountId: account.id,
      password: generateDemoPassword(),
    });
  };
  const recommended =
    demo.accounts.find(
      (account) => account.id === "spotify" && account.status !== "safe",
    ) ?? demo.accounts.find((account) => account.status !== "safe");
  const vaultRecommendation = reuseAlerts
    ? recommended
    : demo.accounts.find((account) => account.status === "weak");
  const selectedAccount =
    overlay && "accountId" in overlay
      ? demo.accounts.find((account) => account.id === overlay.accountId)
      : undefined;
  const visibleAccounts = demo.accounts.filter(
    (account) =>
      (!attentionOnly || account.status !== "safe") &&
      `${account.name} ${account.username}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const start = (empty: boolean) => {
    empty ? demo.startEmpty() : demo.importAccounts();
    setTab("vault");
    setQuery("");
    setAttentionOnly(false);
  };
  const openAdd = () => {
    setAddName("");
    setAddUsername("");
    setToast(null);
    setOverlay({ kind: "add", password: generateDemoPassword() });
  };
  const goToVault = () => {
    setOverlay(null);
    setTab("vault");
    setQuery("");
    setAttentionOnly(false);
    setTimeout(() => pageTitleRef.current?.focus(), 50);
  };
  const regenerate = (
    newLength = length,
    useSymbols = symbols,
    useNumbers = numbers,
  ) => {
    setGeneratorPassword(
      generateConfiguredDemoPassword({
        length: newLength,
        symbols: useSymbols,
        numbers: useNumbers,
      }),
    );
  };

  return (
    <div className="stage">
      <div className="stage-label">
        <span>JU SECURE</span>
        <span>
          Karim edition <span className="stage-dot" /> Interactive prototype
        </span>
      </div>
      <div className="app-shell">
        <header className="app-header">
          <a
            className="brand"
            href="#"
            onClick={(event) => {
              event.preventDefault();
              if (demo.initialized) setTab("vault");
            }}
            aria-label="JU Secure home"
          >
            <ShieldCheck size={23} strokeWidth={1.8} />
            <span>JU Secure</span>
          </a>
          <div className="header-right">
            <span className="demo-tag">DEMO</span>
            <span className="avatar" aria-label="Karim's demo profile">
              K
            </span>
          </div>
        </header>

        <main
          ref={mainRef}
          className={`app-main ${!demo.initialized ? "onboarding-main" : ""}`}
        >
          {!demo.initialized ? (
            <div className="quick-start page-enter">
              <div className="welcome-art" aria-hidden="true">
                <div className="art-orbit orbit-one" />
                <div className="art-orbit orbit-two" />
                <span className="art-spark spark-one" />
                <span className="art-spark spark-two" />
                <div className="hero-shield">
                  <ShieldCheck size={64} strokeWidth={1.25} />
                </div>
                <span className="floating-key">
                  <KeyRound size={19} />
                </span>
                <span className="floating-check">
                  <Check size={18} />
                </span>
              </div>
              <span className="eyebrow purple-text">
                LESS SETUP. MORE SECURE.
              </span>
              <h1>
                Quick start<span className="heading-dot">.</span>
              </h1>
              <p className="onboarding-lead">
                Safer by default.
                <br />
                Ready in seconds.
              </p>
              <p className="muted intro-copy">
                Bring your accounts in.
                <br />
                Fix the risky passwords first.
              </p>
              <div className="defaults-card">
                <div className="defaults-title">
                  <ShieldCheck size={17} />
                  <span>Already taken care of</span>
                  <span className="mini-pill">
                    {autoLock && reuseAlerts ? "ON" : "CUSTOM"}
                  </span>
                </div>
                <div className="defaults-grid">
                  <span>
                    <Check size={14} />
                    Private demo vault
                  </span>
                  <span>
                    {autoLock ? <Check size={14} /> : <X size={14} />}
                    Auto-lock preset
                  </span>
                  <span>
                    <Check size={14} />
                    Strong passwords
                  </span>
                  <span>
                    <Check size={14} />
                    Reuse detection
                  </span>
                </div>
              </div>
              <Button onClick={() => start(false)}>
                <ArrowDownToLine size={18} />
                Import demo accounts
                <ArrowRight size={18} className="button-end" />
              </Button>
              <Button secondary onClick={() => start(true)}>
                Start with an empty vault
              </Button>
              <button
                className="advanced-trigger"
                aria-expanded={advanced}
                onClick={() => setAdvanced(!advanced)}
              >
                <span>
                  <SlidersHorizontal size={15} />
                  Advanced options
                </span>
                <span>
                  Optional
                  <ChevronDown size={15} className={advanced ? "rotate" : ""} />
                </span>
              </button>
              {advanced && (
                <div className="advanced-panel">
                  <div>
                    <span>Auto-lock preset</span>
                    <Toggle
                      label="Auto-lock preset"
                      checked={autoLock}
                      onChange={setAutoLock}
                    />
                  </div>
                  <div>
                    <span>Reuse alerts</span>
                    <Toggle
                      label="Reuse alerts"
                      checked={reuseAlerts}
                      onChange={setReuseAlerts}
                    />
                  </div>
                  <p>Preferences apply to this demo session.</p>
                </div>
              )}
              <p className="demo-note">
                <LockKeyhole size={12} />
                Fictional accounts. No browser access needed.
              </p>
            </div>
          ) : (
            <div className="page-enter" key={tab}>
              {tab === "vault" && (
                <>
                  <div className="page-heading">
                    <div>
                      <span className="eyebrow">
                        YOUR ACCOUNTS, UNDER CONTROL
                      </span>
                      <h1 ref={pageTitleRef} tabIndex={-1}>
                        Vault
                      </h1>
                    </div>
                    <button
                      className="add-button"
                      aria-label="Add demo account"
                      onClick={openAdd}
                    >
                      <Plus size={22} />
                    </button>
                  </div>
                  <div className="health-card">
                    <div className="health-top">
                      <span>
                        <ShieldCheck size={17} />
                        Password health
                      </span>
                      <span className="health-count">
                        {demo.counts.issues === 0
                          ? "Looking good"
                          : `${demo.counts.issues} ${demo.counts.issues === 1 ? "needs" : "need"} attention`}
                      </span>
                    </div>
                    <div className="health-stats">
                      <div>
                        <span className="stat-value safe-text">
                          {demo.counts.safe}
                        </span>
                        <span>
                          <span className="tiny-dot safe-dot" />
                          Safe
                        </span>
                      </div>
                      <div>
                        <span className="stat-value reused-text">
                          {demo.counts.reused}
                        </span>
                        <span>
                          <span className="tiny-dot reused-dot" />
                          Reused
                        </span>
                      </div>
                      <div>
                        <span className="stat-value weak-text">
                          {demo.counts.weak}
                        </span>
                        <span>
                          <span className="tiny-dot weak-dot" />
                          Weak
                        </span>
                      </div>
                    </div>
                  </div>
                  {vaultRecommendation ? (
                    <div className="recommendation">
                      <div className="recommendation-label">
                        <Zap size={13} fill="currentColor" />
                        NEXT BEST ACTION<span>Quick fix</span>
                      </div>
                      <div className="recommendation-content">
                        <AccountIcon account={vaultRecommendation} />
                        <div>
                          <strong>
                            {vaultRecommendation.status === "reused"
                              ? `Make ${vaultRecommendation.name} unique`
                              : `Strengthen ${vaultRecommendation.name}`}
                          </strong>
                          <p>
                            {vaultRecommendation.status === "reused"
                              ? `Shared with ${demo
                                  .getReuseGroup(vaultRecommendation.id)
                                  .filter(
                                    (a) => a.id !== vaultRecommendation.id,
                                  )
                                  .map((a) => a.name)
                                  .join(", ")}.`
                              : "A stronger password. One tap."}
                          </p>
                        </div>
                      </div>
                      <Button onClick={() => openFix(vaultRecommendation)}>
                        Fix {vaultRecommendation.name} password
                        <ArrowRight size={17} />
                      </Button>
                    </div>
                  ) : (
                    demo.counts.total > 0 &&
                    demo.counts.issues === 0 && (
                      <div className="all-clear-card">
                        <ShieldCheck size={22} />
                        <div>
                          <strong>All clear.</strong>
                          <p>Every account has its own strong password.</p>
                        </div>
                      </div>
                    )
                  )}
                  <div className="search-box">
                    <Search size={18} />
                    <input
                      ref={searchRef}
                      aria-label="Search accounts"
                      placeholder="Search accounts"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                    />
                    {query && (
                      <button
                        className="icon-button"
                        aria-label="Clear search"
                        onClick={() => setQuery("")}
                      >
                        <X size={16} />
                      </button>
                    )}
                    <kbd>/</kbd>
                  </div>
                  <div className="list-toolbar">
                    <button
                      className={!attentionOnly ? "filter-active" : ""}
                      onClick={() => setAttentionOnly(false)}
                    >
                      All accounts <span>{demo.counts.total}</span>
                    </button>
                    <button
                      className={attentionOnly ? "filter-active" : ""}
                      onClick={() => setAttentionOnly(true)}
                    >
                      Needs attention <span>{demo.counts.issues}</span>
                    </button>
                  </div>
                  <div className="account-list">
                    {visibleAccounts.map((account) => (
                      <AccountRow
                        key={account.id}
                        account={account}
                        onClick={() => openAccount(account)}
                      />
                    ))}
                  </div>
                  {visibleAccounts.length === 0 && (
                    <div className="empty-state">
                      <LockKeyhole size={32} />
                      <h2>
                        {demo.counts.total === 0
                          ? "A fresh start."
                          : "No accounts found."}
                      </h2>
                      <p>
                        {demo.counts.total === 0
                          ? "Add a fictional account or load the demo vault."
                          : "Try another search or view all accounts."}
                      </p>
                      {demo.counts.total === 0 ? (
                        <>
                          <Button onClick={openAdd}>
                            <Plus size={16} />
                            Add demo account
                          </Button>
                          <button
                            className="text-button"
                            onClick={() => start(false)}
                          >
                            Load demo accounts
                          </button>
                        </>
                      ) : (
                        <button
                          className="text-button"
                          onClick={() => {
                            setQuery("");
                            setAttentionOnly(false);
                          }}
                        >
                          Show all accounts
                        </button>
                      )}
                    </div>
                  )}
                  {demo.counts.total > 0 && (
                    <p className="vault-footnote">
                      <LockKeyhole size={11} />
                      Demo vault · Changes last for this session
                    </p>
                  )}
                </>
              )}

              {tab === "security" && (
                <>
                  <div className="page-heading">
                    <div>
                      <span className="eyebrow">
                        SMALL FIXES. STRONGER VAULT.
                      </span>
                      <h1>Security</h1>
                    </div>
                    <span className="heading-icon">
                      <ShieldCheck size={24} />
                    </span>
                  </div>
                  <div
                    className={`security-summary ${demo.counts.issues === 0 ? "summary-clear" : ""}`}
                  >
                    <span className="summary-icon">
                      {demo.counts.issues === 0 ? (
                        <ShieldCheck size={28} />
                      ) : (
                        <AlertTriangle size={27} />
                      )}
                    </span>
                    <h2>
                      {demo.counts.issues === 0
                        ? "You’re all set."
                        : `${demo.counts.issues} ${demo.counts.issues === 1 ? "account needs" : "accounts need"} a fix.`}
                    </h2>
                    <p>
                      {demo.counts.issues === 0
                        ? "Unique passwords across your vault."
                        : demo.counts.reused > 0
                          ? "Start with reuse. Protect two accounts at once."
                          : demo.counts.weak === 1
                            ? "Fix the weak password in one tap."
                            : "Fix weak passwords in one tap."}
                    </p>
                  </div>
                  {demo.reuseGroups.map((group, index) => (
                    <div className="security-card" key={index}>
                      <div className="section-title">
                        <span className="issue-icon">
                          <Copy size={16} />
                        </span>
                        <h2>Reused password</h2>
                        <span className="count-pill">
                          {group.length} accounts
                        </span>
                      </div>
                      <p className="muted">
                        One leaked password could expose both.
                      </p>
                      <div className="related-accounts">
                        {group.map((account) => (
                          <div key={account.id}>
                            <AccountIcon account={account} />
                            <span>{account.name}</span>
                          </div>
                        ))}
                      </div>
                      <Button
                        onClick={() =>
                          openFix(
                            group.find((account) => account.id === "spotify") ??
                              group[0],
                          )
                        }
                      >
                        Fix{" "}
                        {group.find((account) => account.id === "spotify")
                          ?.name ?? group[0].name}{" "}
                        password
                        <ArrowRight size={16} />
                      </Button>
                    </div>
                  ))}
                  {demo.accounts
                    .filter((account) => account.status === "weak")
                    .map((account) => (
                      <div className="security-card" key={account.id}>
                        <div className="section-title">
                          <span className="issue-icon weak-text">
                            <KeyRound size={17} />
                          </span>
                          <h2>Weak password</h2>
                        </div>
                        <div className="weak-account">
                          <AccountIcon account={account} />
                          <div>
                            <strong>{account.name}</strong>
                            <p>Too short. Easy to guess.</p>
                          </div>
                        </div>
                        <Button secondary onClick={() => openFix(account)}>
                          Strengthen {account.name}
                          <ArrowRight size={16} />
                        </Button>
                      </div>
                    ))}
                  <div className="quiet-card">
                    <ShieldCheck size={18} />
                    <div>
                      <strong>{demo.counts.safe} accounts are safe</strong>
                      <p>Strong, unique passwords. Nothing to do.</p>
                    </div>
                  </div>
                </>
              )}

              {tab === "generator" && (
                <>
                  <div className="page-heading">
                    <div>
                      <span className="eyebrow">
                        UNIQUE, WITHOUT THE EFFORT
                      </span>
                      <h1>Generator</h1>
                    </div>
                    <span className="heading-icon">
                      <Sparkles size={24} />
                    </span>
                  </div>
                  <p className="page-subtitle">
                    A strong password. Ready to use in the demo.
                  </p>
                  <div className="generator-card">
                    <div className="generator-top">
                      <span className="eyebrow">GENERATED PASSWORD</span>
                      <span className="status status-safe">
                        <ShieldCheck size={11} />
                        Strong
                      </span>
                    </div>
                    <code className="generated-password">
                      {generatorPassword}
                    </code>
                    <div className="strength-bars" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                    <p>
                      <Check size={13} />
                      Unique by default
                    </p>
                    <div className="generator-actions">
                      <Button onClick={() => void copy(generatorPassword)}>
                        <Copy size={17} />
                        Copy password
                      </Button>
                      <button
                        className="regenerate-button"
                        aria-label="Generate another password"
                        onClick={() => regenerate()}
                      >
                        <RefreshCw size={20} />
                      </button>
                    </div>
                  </div>
                  <div className="options-card">
                    <div className="length-label">
                      <label htmlFor="password-length">Password length</label>
                      <strong>
                        {length}
                        <span> characters</span>
                      </strong>
                    </div>
                    <input
                      id="password-length"
                      type="range"
                      min="12"
                      max="32"
                      value={length}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        setLength(value);
                        regenerate(value);
                      }}
                    />
                    <div className="range-labels">
                      <span>12</span>
                      <span>32</span>
                    </div>
                    <div className="option-row">
                      <span>
                        Numbers<span className="option-example">0–9</span>
                      </span>
                      <Toggle
                        checked={numbers}
                        label="Include numbers"
                        onChange={(value) => {
                          setNumbers(value);
                          regenerate(length, symbols, value);
                        }}
                      />
                    </div>
                    <div className="option-row">
                      <span>
                        Symbols<span className="option-example">! @ #</span>
                      </span>
                      <Toggle
                        checked={symbols}
                        label="Include symbols"
                        onChange={(value) => {
                          setSymbols(value);
                          regenerate(length, value, numbers);
                        }}
                      />
                    </div>
                  </div>
                  <div className="quiet-card">
                    <ShieldCheck size={18} />
                    <div>
                      <strong>
                        {length === 20 && numbers && symbols
                          ? "Safe defaults are on"
                          : "Your preferences"}
                      </strong>
                      <p>
                        {length} characters{numbers ? ", numbers" : ""}
                        {symbols ? ", symbols" : ""}.
                      </p>
                    </div>
                  </div>
                  <p className="demo-note">
                    Demo generator. Don’t use these passwords for real accounts.
                  </p>
                </>
              )}

              {tab === "settings" && (
                <>
                  <div className="page-heading">
                    <div>
                      <span className="eyebrow">SIMPLE BY DEFAULT</span>
                      <h1>Settings</h1>
                    </div>
                    <span className="heading-icon">
                      <Settings2 size={24} />
                    </span>
                  </div>
                  <div className="profile-card">
                    <span className="profile-avatar">K</span>
                    <div>
                      <strong>Karim’s vault</strong>
                      <p>Student demo</p>
                    </div>
                    <ShieldCheck size={19} className="safe-text" />
                  </div>
                  <h2 className="section-heading">Safe defaults</h2>
                  <div className="safe-defaults-note">
                    <ShieldCheck size={19} />
                    <div>
                      <strong>Ready from the start</strong>
                      <p>Recommended preferences are already set.</p>
                    </div>
                  </div>
                  <div className="settings-card">
                    <div className="settings-row">
                      <span className="setting-symbol">
                        <Fingerprint size={20} />
                      </span>
                      <div>
                        <strong>Private demo vault</strong>
                        <p>In memory. Cleared on refresh.</p>
                      </div>
                      <span className="setting-state">On</span>
                    </div>
                    <div className="settings-row">
                      <span className="setting-symbol">
                        <LockKeyhole size={19} />
                      </span>
                      <div>
                        <strong>Auto-lock preset</strong>
                        <p>After 5 minutes · simulated</p>
                      </div>
                      <Toggle
                        label="Auto-lock preset"
                        checked={autoLock}
                        onChange={setAutoLock}
                      />
                    </div>
                    <div className="settings-row">
                      <span className="setting-symbol">
                        <Shield size={19} />
                      </span>
                      <div>
                        <strong>Reuse alerts</strong>
                        <p>
                          {reuseAlerts
                            ? "Highlight shared passwords"
                            : "Quiet alerts · status still visible"}
                        </p>
                      </div>
                      <Toggle
                        label="Reuse alerts"
                        checked={reuseAlerts}
                        onChange={setReuseAlerts}
                      />
                    </div>
                    <div className="settings-row">
                      <span className="setting-symbol">
                        <Sparkles size={19} />
                      </span>
                      <div>
                        <strong>Strong generator defaults</strong>
                        <p>20 characters, numbers, symbols</p>
                      </div>
                      <span className="setting-state">On</span>
                    </div>
                  </div>
                  <h2 className="section-heading">This prototype</h2>
                  <div className="about-card">
                    <div>
                      <strong>JU Secure — Karim</strong>
                      <span className="demo-tag">v0.1</span>
                    </div>
                    <p>
                      Fictional accounts. No real authentication, storage or
                      website password changes.
                    </p>
                  </div>
                  <button
                    className="reset-button"
                    onClick={() => {
                      demo.resetDemo();
                      setQuery("");
                      setAttentionOnly(false);
                      setAdvanced(false);
                      setAutoLock(true);
                      setReuseAlerts(true);
                      setLength(20);
                      setSymbols(true);
                      setNumbers(true);
                      setGeneratorPassword("Demo!K7mQ2vN9@rT4pL8x");
                      setTab("vault");
                      setToast({ message: "Demo reset", type: "success" });
                    }}
                  >
                    <RefreshCw size={15} />
                    Reset demo
                  </button>
                </>
              )}
            </div>
          )}
        </main>

        {demo.initialized && (
          <nav className="bottom-nav" aria-label="Main navigation">
            {(
              [
                ["vault", LockKeyhole, "Vault"],
                ["security", ShieldCheck, "Security"],
                ["generator", Sparkles, "Generator"],
                ["settings", Settings2, "Settings"],
              ] as const
            ).map(([id, Icon, label]) => (
              <button
                key={id}
                className={tab === id ? "nav-active" : ""}
                aria-current={tab === id ? "page" : undefined}
                aria-label={label}
                onClick={() => setTab(id)}
              >
                <span className="nav-icon">
                  <Icon size={21} strokeWidth={1.7} />
                  {id === "security" && demo.counts.issues > 0 && (
                    <span className="nav-count">{demo.counts.issues}</span>
                  )}
                </span>
                <span>{label}</span>
              </button>
            ))}
          </nav>
        )}
        {toast && !overlay && <Toast toast={toast} />}
      </div>
      <p className="stage-footer">
        <span className="stage-dot" />A faster path to a safer vault.
      </p>

      {overlay && (
        <Modal
          key={overlay.kind}
          title={
            overlay.kind === "success"
              ? "All done"
              : overlay.kind === "add"
                ? "Add account"
                : overlay.kind === "fix"
                  ? "Quick fix"
                  : "Account details"
          }
          onClose={() => setOverlay(null)}
          className={overlay.kind === "success" ? "success-sheet" : ""}
        >
          {overlay.kind === "fix" && selectedAccount && (
            <>
              <div className="fix-account-heading">
                <AccountIcon account={selectedAccount} large />
                <div>
                  <h2>
                    {selectedAccount.status === "reused"
                      ? `Make ${selectedAccount.name} unique.`
                      : `Strengthen ${selectedAccount.name}.`}
                  </h2>
                  <p>{selectedAccount.username}</p>
                </div>
              </div>
              <div className="risk-card">
                <AlertTriangle size={18} />
                <div>
                  <strong>
                    {selectedAccount.status === "reused"
                      ? `Same password as ${demo
                          .getReuseGroup(selectedAccount.id)
                          .filter(
                            (account) => account.id !== selectedAccount.id,
                          )
                          .map((account) => account.name)
                          .join(", ")}`
                      : "This password is too short"}
                  </strong>
                  <p>
                    {selectedAccount.status === "reused"
                      ? "One breach can expose both accounts."
                      : "A longer password is harder to guess."}
                  </p>
                </div>
              </div>
              <PasswordField
                password={overlay.password}
                initialVisible
                onCopy={(password, masked) => void copy(password, masked)}
              />
              <p className="new-password-note">
                <ShieldCheck size={14} />
                Strong and unique. Generated for {selectedAccount.name}.
              </p>
              <Button
                onClick={() => {
                  const group = demo.getReuseGroup(selectedAccount.id);
                  const clearedCompanion =
                    group.length === 2
                      ? group.find(
                          (account) => account.id !== selectedAccount.id,
                        )?.name
                      : undefined;
                  demo.fixAccount(selectedAccount.id, overlay.password);
                  setOverlay({
                    kind: "success",
                    accountId: selectedAccount.id,
                    clearedCompanion,
                    fixedStatus:
                      selectedAccount.status === "weak" ? "weak" : "reused",
                  });
                }}
              >
                <Sparkles size={17} />
                Use unique password
                <ArrowRight size={17} className="button-end" />
              </Button>
              <button className="not-now" onClick={() => setOverlay(null)}>
                Not now
              </button>
              <p className="sheet-demo-note">Updates this demo vault only.</p>
            </>
          )}
          {overlay.kind === "success" && selectedAccount && (
            <div className="success-content">
              <div className="success-orbit">
                <span>
                  <Check size={38} strokeWidth={2} />
                </span>
              </div>
              <span className="eyebrow safe-text">QUICK FIX COMPLETE</span>
              <h2>
                {selectedAccount.name} is
                <br />
                {overlay.fixedStatus === "weak"
                  ? "now stronger."
                  : "now unique."}
              </h2>
              <p>New password saved to your demo vault.</p>
              <div className="success-receipt">
                <div>
                  <AccountIcon account={selectedAccount} />
                  <strong>{selectedAccount.name}</strong>
                  <StatusBadge status="safe" />
                </div>
                {overlay.clearedCompanion && (
                  <div>
                    <ShieldCheck size={18} />
                    <span>
                      {overlay.clearedCompanion}’s reuse warning is cleared,
                      too.
                    </span>
                  </div>
                )}
              </div>
              <Button onClick={goToVault}>
                Back to vault
                <ArrowRight size={17} />
              </Button>
              <p className="sheet-demo-note">
                No real website passwords were changed.
              </p>
            </div>
          )}
          {overlay.kind === "account" && selectedAccount && (
            <>
              <div className="fix-account-heading">
                <AccountIcon account={selectedAccount} large />
                <div>
                  <h2>{selectedAccount.name}</h2>
                  <StatusBadge status={selectedAccount.status} />
                </div>
              </div>
              <div className="detail-username">
                <span className="eyebrow">EMAIL / USERNAME</span>
                <p>{selectedAccount.username}</p>
              </div>
              <PasswordField
                password={selectedAccount.password}
                label="DEMO PASSWORD"
                onCopy={(password, masked) => void copy(password, masked)}
              />
              {selectedAccount.status === "safe" ? (
                <div className="quiet-card">
                  <ShieldCheck size={18} />
                  <div>
                    <strong>Strong and unique</strong>
                    <p>No action needed.</p>
                  </div>
                </div>
              ) : (
                <div
                  className={`detail-status-note ${selectedAccount.status === "weak" ? "weak-text" : "reused-text"}`}
                >
                  <AlertTriangle size={16} />
                  <p>
                    {selectedAccount.status === "reused"
                      ? `Shared with ${demo
                          .getReuseGroup(selectedAccount.id)
                          .filter(
                            (account) => account.id !== selectedAccount.id,
                          )
                          .map((account) => account.name)
                          .join(", ")}.`
                      : "Too short. A stronger password is ready."}
                  </p>
                </div>
              )}
              {selectedAccount.status !== "safe" && (
                <Button onClick={() => openFix(selectedAccount)}>
                  <Sparkles size={17} />
                  Fix password
                  <ArrowRight size={17} className="button-end" />
                </Button>
              )}
              <Button
                secondary
                className={
                  selectedAccount.status !== "safe" ? "detail-back-button" : ""
                }
                onClick={() => setOverlay(null)}
              >
                <ArrowLeft size={16} />
                Back to vault
              </Button>
            </>
          )}
          {overlay.kind === "add" && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!addName.trim() || !addUsername.trim()) return;
                demo.addAccount(addName, addUsername, overlay.password);
                setOverlay(null);
                setTab("vault");
                setQuery("");
                setAttentionOnly(false);
                setToast({
                  message: "Demo account added with a unique password",
                  type: "success",
                });
              }}
            >
              <h2 className="add-title">One account. One password.</h2>
              <p className="muted">Use fictional details for this prototype.</p>
              <label className="form-label" htmlFor="account-name">
                Website or app
              </label>
              <input
                className="form-input"
                id="account-name"
                placeholder="e.g. Demo Study App"
                value={addName}
                required
                maxLength={60}
                onChange={(event) => setAddName(event.target.value)}
              />
              <label className="form-label" htmlFor="account-username">
                Email / username
              </label>
              <input
                className="form-input"
                id="account-username"
                placeholder="karim@example.com"
                value={addUsername}
                required
                maxLength={100}
                onChange={(event) => setAddUsername(event.target.value)}
              />
              <div className="add-password">
                <PasswordField
                  password={overlay.password}
                  label="GENERATED PASSWORD"
                  onCopy={(password, masked) => void copy(password, masked)}
                  onRegenerate={() => {
                    setToast(null);
                    setOverlay({
                      kind: "add",
                      password: generateDemoPassword(),
                    });
                  }}
                />
                <p className="new-password-note">
                  <ShieldCheck size={14} />
                  Strong and unique. Ready to save.
                </p>
              </div>
              <Button
                type="submit"
                disabled={!addName.trim() || !addUsername.trim()}
              >
                <Plus size={17} />
                Add to demo vault
              </Button>
              <p className="sheet-demo-note">
                Demo vault only. Cleared on refresh.
              </p>
            </form>
          )}
          {toast && <Toast toast={toast} inSheet />}
        </Modal>
      )}
    </div>
  );
}
