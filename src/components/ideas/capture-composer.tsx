import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Lightbulb, Minus, Sparkles } from "lucide-react";
import type { AccountsModel, Tdvsp_ideasModel } from "@/generated";
import { useCreateIdea } from "@/hooks/use-ideas";
import { toast } from "sonner";
import { CATEGORY_DOT, CATEGORY_LABELS, CATEGORY_ORDER } from "./labels";

type Category = Tdvsp_ideasModel.Tdvsp_ideastdvsp_category;
type Account = AccountsModel.Accounts;

interface CaptureComposerProps {
  accounts: Account[] | undefined;
  defaultCategory?: Category;
}

const DRAFT_KEY = "ideas.composer.draft";
const CATEGORY_KEY = "ideas.composer.category";
const ACCOUNT_KEY = "ideas.composer.account";
const COLLAPSED_KEY = "ideas.composer.collapsed";

/**
 * Persistent floating composer, bottom-right. ⌘⇧I focuses, ⌘↵ captures.
 * Drafts auto-save to localStorage. Defining element of the Ideas page.
 */
export function CaptureComposer({ accounts, defaultCategory }: CaptureComposerProps) {
  const [collapsed, setCollapsed] = useState<boolean>(() => readStorage(COLLAPSED_KEY) === "1");
  const [text, setText] = useState<string>(() => readStorage(DRAFT_KEY) ?? "");
  const [category, setCategory] = useState<Category>(() => {
    const saved = readStorage(CATEGORY_KEY);
    if (saved) {
      const n = Number(saved);
      if (!Number.isNaN(n)) return n as Category;
    }
    return (defaultCategory ?? 468510006) as Category; // default: AI General
  });
  const [accountId, setAccountId] = useState<string>(() => readStorage(ACCOUNT_KEY) ?? "");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const createMutation = useCreateIdea();

  /* ── Draft persistence ─────────────────────────────────────── */
  useEffect(() => {
    const t = setTimeout(() => writeStorage(DRAFT_KEY, text), 500);
    return () => clearTimeout(t);
  }, [text]);

  useEffect(() => {
    writeStorage(CATEGORY_KEY, String(category));
  }, [category]);

  useEffect(() => {
    writeStorage(ACCOUNT_KEY, accountId);
  }, [accountId]);

  useEffect(() => {
    writeStorage(COLLAPSED_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  /* ── Hotkey: ⌘⇧I / Ctrl⇧I ──────────────────────────────── */
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.shiftKey && e.key.toLowerCase() === "i") {
        e.preventDefault();
        setCollapsed(false);
        queueMicrotask(() => textareaRef.current?.focus());
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* ── Submit ────────────────────────────────────────────────── */
  function capture() {
    const trimmed = text.trim();
    if (!trimmed) {
      textareaRef.current?.focus();
      return;
    }
    const record: Record<string, unknown> = {
      tdvsp_name: trimmed.length > 100 ? trimmed.slice(0, 100) : trimmed,
      tdvsp_description: trimmed.length > 100 ? trimmed : undefined,
      tdvsp_category: category,
    };
    if (accountId) record["tdvsp_Account@odata.bind"] = `/accounts(${accountId})`;

    createMutation.mutate(
      record as unknown as Omit<Tdvsp_ideasModel.Tdvsp_ideasBase, "tdvsp_ideaid">,
      {
        onSuccess: () => {
          toast.success("Captured idea", { icon: <Sparkles className="h-4 w-4 text-yellow-500" /> });
          setText("");
          writeStorage(DRAFT_KEY, "");
          textareaRef.current?.focus();
        },
        onError: (err) => toast.error(`Capture failed: ${err.message}`),
      },
    );
  }

  function handleTextareaKeydown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      capture();
    }
  }

  const accountName = accountId ? accounts?.find((a) => a.accountid === accountId)?.name : undefined;

  return (
    <>
      {/* Collapsed FAB */}
      <AnimatePresence>
        {collapsed && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={() => {
              setCollapsed(false);
              queueMicrotask(() => textareaRef.current?.focus());
            }}
            className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 cursor-pointer"
            style={{
              height: 44,
              padding: "0 16px",
              borderRadius: 22,
              background: "linear-gradient(135deg, #fde047, #facc15)",
              color: "#713f12",
              border: "1px solid #eab308",
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 600,
              boxShadow: "0 8px 20px rgba(234,179,8,.25), 0 2px 6px rgba(234,179,8,.15)",
            }}
          >
            <Lightbulb className="h-[15px] w-[15px]" />
            Capture an idea
            <kbd
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                padding: "1px 5px",
                background: "rgba(255,255,255,.5)",
                border: "1px solid rgba(161,98,7,.2)",
                borderRadius: 3,
                color: "#713f12",
                marginLeft: 2,
              }}
            >
              ⌘⇧I
            </kbd>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded composer */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed bottom-5 right-5 z-40"
            style={{
              width: 380,
              background: "var(--dash-surface)",
              border: "1px solid #fde68a",
              borderRadius: 12,
              boxShadow: "0 12px 30px rgba(15,15,20,.15), 0 2px 8px rgba(15,15,20,.08)",
              overflow: "hidden",
            }}
          >
            {/* Yellow header */}
            <div
              className="flex items-center gap-2"
              style={{
                padding: "10px 12px",
                background: "linear-gradient(135deg, #fef9c3, #fde68a)",
                color: "#713f12",
                borderBottom: "1px solid #fde68a",
              }}
            >
              <Lightbulb className="h-[15px] w-[15px]" />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Capture an idea</span>
              <kbd
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  padding: "1px 5px",
                  background: "rgba(255,255,255,.6)",
                  border: "1px solid rgba(161,98,7,.2)",
                  borderRadius: 3,
                  color: "#713f12",
                }}
              >
                ⌘⇧I
              </kbd>
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                title="Minimize"
                className="cursor-pointer grid place-items-center"
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 4,
                  background: "rgba(255,255,255,.4)",
                  border: 0,
                  color: "#713f12",
                }}
              >
                <Minus className="h-[12px] w-[12px]" />
              </button>
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleTextareaKeydown}
              placeholder="What's the spark? No formatting, no pressure…"
              rows={3}
              className="w-full outline-none border-0 resize-none"
              style={{
                fontFamily: "inherit",
                fontSize: 13,
                padding: "12px",
                color: "var(--dash-ink-1)",
                background: "var(--dash-surface)",
                lineHeight: 1.5,
              }}
            />

            {/* Foot row */}
            <div
              className="flex items-center gap-1.5"
              style={{
                padding: "8px 10px",
                borderTop: "1px solid var(--dash-border)",
                background: "var(--dash-surface)",
              }}
            >
              {/* Category chip + popover */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setCategoryOpen((v) => !v); setAccountOpen(false); }}
                  className="inline-flex items-center gap-1.5 cursor-pointer"
                  style={{
                    height: 26,
                    padding: "0 9px",
                    borderRadius: 999,
                    background: "var(--dash-surface)",
                    border: "1px solid var(--dash-border-strong)",
                    fontSize: 11,
                    fontWeight: 500,
                    color: "var(--dash-ink-2)",
                    fontFamily: "inherit",
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: CATEGORY_DOT[category] }}
                  />
                  {CATEGORY_LABELS[category]}
                  <ChevronDown className="h-[11px] w-[11px]" style={{ color: "var(--dash-ink-4)" }} />
                </button>
                {categoryOpen && (
                  <Popover onClose={() => setCategoryOpen(false)}>
                    {CATEGORY_ORDER.map((c) => (
                      <PopoverItem
                        key={c}
                        active={c === category}
                        onClick={() => { setCategory(c); setCategoryOpen(false); }}
                      >
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CATEGORY_DOT[c] }} />
                        {CATEGORY_LABELS[c]}
                      </PopoverItem>
                    ))}
                  </Popover>
                )}
              </div>

              {/* Account chip + popover */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setAccountOpen((v) => !v); setCategoryOpen(false); }}
                  className="inline-flex items-center gap-1.5 cursor-pointer"
                  style={{
                    height: 26,
                    padding: "0 9px",
                    borderRadius: 999,
                    background: "var(--dash-surface)",
                    border: accountId ? "1px solid var(--dash-border-strong)" : "1px dashed var(--dash-border-strong)",
                    fontSize: 11,
                    fontWeight: 500,
                    color: accountId ? "var(--dash-ink-2)" : "var(--dash-ink-4)",
                    fontFamily: "inherit",
                  }}
                >
                  {accountName ?? "Account"}
                  <ChevronDown className="h-[11px] w-[11px]" style={{ color: "var(--dash-ink-4)" }} />
                </button>
                {accountOpen && (
                  <Popover onClose={() => setAccountOpen(false)}>
                    <PopoverItem active={accountId === ""} onClick={() => { setAccountId(""); setAccountOpen(false); }}>
                      <span style={{ color: "var(--dash-ink-4)", fontStyle: "italic" }}>No account</span>
                    </PopoverItem>
                    {accounts?.map((a) => (
                      <PopoverItem
                        key={a.accountid}
                        active={a.accountid === accountId}
                        onClick={() => { setAccountId(a.accountid); setAccountOpen(false); }}
                      >
                        {a.name}
                      </PopoverItem>
                    ))}
                  </Popover>
                )}
              </div>

              <div className="flex-1" />

              {/* Capture button */}
              <button
                type="button"
                onClick={capture}
                disabled={createMutation.isPending || !text.trim()}
                className="inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  height: 30,
                  padding: "0 12px",
                  borderRadius: 7,
                  background: "linear-gradient(135deg, #fde047, #facc15)",
                  color: "#713f12",
                  border: "1px solid #eab308",
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "inherit",
                  boxShadow: "0 1px 2px rgba(234,179,8,.3)",
                }}
              >
                <Sparkles className="h-[12px] w-[12px]" />
                {createMutation.isPending ? "Capturing…" : "Capture"}
                <kbd
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    padding: "0 4px",
                    marginLeft: 2,
                    background: "rgba(255,255,255,.5)",
                    border: "1px solid rgba(161,98,7,.2)",
                    borderRadius: 3,
                    color: "#713f12",
                  }}
                >
                  ⌘↵
                </kbd>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Helpers ──────────────────────────────────────────────────── */

function readStorage(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function writeStorage(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* noop */ }
}

function Popover({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    function handler(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-composer-popover]")) onClose();
    }
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [onClose]);

  return (
    <div
      data-composer-popover
      className="absolute left-0 z-50"
      style={{
        bottom: "calc(100% + 6px)",
        minWidth: 200,
        maxHeight: 280,
        overflowY: "auto",
        background: "var(--dash-surface)",
        border: "1px solid var(--dash-border-strong)",
        borderRadius: 8,
        boxShadow: "0 8px 20px rgba(15,15,20,.12), 0 2px 6px rgba(15,15,20,.06)",
        padding: 4,
      }}
    >
      {children}
    </div>
  );
}

function PopoverItem({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left inline-flex items-center gap-2 cursor-pointer"
      style={{
        padding: "6px 9px",
        borderRadius: 6,
        border: 0,
        background: active ? "var(--dash-surface-2)" : "transparent",
        color: "var(--dash-ink-1)",
        fontSize: 12,
        fontFamily: "inherit",
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.background = "var(--dash-surface-2)";
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}
