import { useState, type ReactNode } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  BookOpen,
  Briefcase,
  Building2,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  Columns3,
  FileText,
  FolderKanban,
  House,
  LayoutDashboard,
  Lightbulb,
  Moon,
  Search,
  Sun,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuickCreateStore } from "@/stores/quick-create-store";
import { useTheme } from "@/components/theme-provider";
import type { QuickCreateTarget } from "@/stores/quick-create-store";

interface AppLayoutProps {
  children: ReactNode;
}

/* ── Left sidebar navigation ────────────────────────────────── */

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  color?: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: "insights",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard },
      { to: "/board", label: "My Board", icon: Columns3 },
    ],
  },
  {
    label: "activity",
    items: [
      { to: "/action-items", label: "Action Items", icon: ClipboardList, color: "#ef4444" },
    ],
  },
  {
    label: "capture",
    items: [
      { to: "/ideas", label: "Ideas", icon: Lightbulb, color: "#059669" },
      { to: "/meeting-summaries", label: "Meetings", icon: FileText, color: "#ec4899" },
      { to: "/projects", label: "Projects", icon: FolderKanban, color: "#7c3aed" },
    ],
  },
  {
    label: "core",
    items: [
      { to: "/accounts", label: "Accounts", icon: Building2, color: "#0d9488" },
      { to: "/contacts", label: "Contacts", icon: Users, color: "#0ea5e9" },
    ],
  },
];

/* ── Quick create bar ───────────────────────────────────────── */

interface QuickCreateButton {
  target: NonNullable<QuickCreateTarget>;
  route: string;
  label: string;
  icon: typeof LayoutDashboard;
  color: string; // text & border color
  bg: string; // pastel background
  payload?: Record<string, unknown>;
}

const QUICK_CREATE_BUTTONS: QuickCreateButton[] = [
  {
    target: "action-items",
    route: "/action-items",
    label: "work",
    icon: Briefcase,
    color: "text-red-500 border-red-200",
    bg: "bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900/60",
    payload: { taskType: 468510001 },
  },
  {
    target: "action-items",
    route: "/action-items",
    label: "personal",
    icon: House,
    color: "text-blue-500 border-blue-200",
    bg: "bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60",
    payload: { taskType: 468510000 },
  },
  {
    target: "action-items",
    route: "/action-items",
    label: "learning",
    icon: BookOpen,
    color: "text-fuchsia-500 border-fuchsia-200",
    bg: "bg-fuchsia-50 hover:bg-fuchsia-100 dark:bg-fuchsia-950/60 dark:hover:bg-fuchsia-900/60",
    payload: { taskType: 468510002 },
  },
  {
    target: "ideas",
    route: "/ideas",
    label: "idea",
    icon: Lightbulb,
    color: "text-emerald-600 border-emerald-200",
    bg: "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60",
  },
  {
    target: "meeting-summaries",
    route: "/meeting-summaries",
    label: "meeting",
    icon: FileText,
    color: "text-pink-500 border-pink-200",
    bg: "bg-pink-50 hover:bg-pink-100 dark:bg-pink-950/60 dark:hover:bg-pink-900/60",
  },
  {
    target: "projects",
    route: "/projects",
    label: "project",
    icon: FolderKanban,
    color: "text-violet-600 border-violet-200",
    bg: "bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/60 dark:hover:bg-violet-900/60",
  },
  {
    target: "accounts",
    route: "/accounts",
    label: "account",
    icon: Building2,
    color: "text-teal-600 border-teal-200",
    bg: "bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/60",
  },
  {
    target: "contacts",
    route: "/contacts",
    label: "contact",
    icon: Users,
    color: "text-sky-500 border-sky-200",
    bg: "bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/60",
  },
];

/* ── Sidebar collapsed state ──────────────────────────────────── */

const STORAGE_KEY = "sidebar-collapsed";

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function writeCollapsed(v: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(v));
  } catch {
    // localStorage unavailable
  }
}

/* ── Layout component ───────────────────────────────────────── */

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const openQuickCreate = useQuickCreateStore((s) => s.open);
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(readCollapsed);

  function handleQuickCreate(btn: QuickCreateButton) {
    openQuickCreate(btn.target, btn.payload);
    if (location.pathname !== btn.route) {
      navigate(btn.route);
    }
  }

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      writeCollapsed(next);
      return next;
    });
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Left sidebar ────────────────────────────────────── */}
      <aside
        className={cn(
          "relative flex shrink-0 flex-col border-r border-border bg-white dark:bg-card transition-all duration-300 ease-in-out",
          collapsed ? "w-14" : "w-52",
        )}
      >
        {/* Collapse toggle — floats on the sidebar edge */}
        <button
          onClick={toggleCollapsed}
          className="absolute -right-3 top-7 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronsRight className="h-3 w-3" />
          ) : (
            <ChevronsLeft className="h-3 w-3" />
          )}
        </button>

        {/* Logo / brand */}
        <div
          className={cn(
            "flex h-14 items-center shrink-0",
            collapsed ? "justify-center" : "gap-2.5 px-5",
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#0078D4] to-[#50E6FF] shadow-sm">
            <Briefcase className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <span className="text-base font-bold tracking-tight text-[var(--sidebar-from)]">
              My Work
            </span>
          )}
        </div>

        {/* Navigation sections */}
        <nav
          className={cn(
            "flex-1 overflow-y-auto pb-4",
            collapsed ? "px-1.5" : "px-3",
          )}
        >
          {NAV_SECTIONS.map((section) => (
            <div key={section.label || "__root"} className="mt-4 first:mt-0">
              {section.label &&
                (collapsed ? (
                  <div className="mx-2 my-1.5 h-px bg-border/30" />
                ) : (
                  <span className="mb-1 block px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                    {section.label}
                  </span>
                ))}
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    cn(
                      "group relative flex items-center rounded-md text-sm font-medium transition-colors",
                      collapsed
                        ? cn(
                            "justify-center py-2.5 mx-0.5",
                            isActive
                              ? "bg-[#00BCF2]/10 text-[#0078D4]"
                              : "text-foreground/60 hover:bg-muted hover:text-foreground",
                          )
                        : cn(
                            "gap-2.5 px-2.5 py-2",
                            isActive
                              ? "border-l-[3px] border-l-[#00BCF2] bg-[#00BCF2]/8 pl-[7px] text-[#0078D4]"
                              : "border-l-[3px] border-l-transparent pl-[7px] text-foreground/60 hover:bg-muted hover:text-foreground",
                          ),
                    )
                  }
                >
                  <item.icon
                    className="h-4 w-4 shrink-0"
                    style={item.color ? { color: item.color } : undefined}
                  />
                  {!collapsed && item.label}
                  {/* Tooltip for collapsed state */}
                  {collapsed && (
                    <span className="absolute left-full ml-2.5 rounded-md bg-popover border border-border/50 px-2.5 py-1.5 text-xs font-medium shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap z-50">
                      {item.label}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div
          className={cn(
            "border-t border-border space-y-1.5",
            collapsed ? "px-1.5 py-3" : "px-4 py-3",
          )}
        >
          <button
            onClick={() =>
              window.dispatchEvent(
                new KeyboardEvent("keydown", { key: "k", ctrlKey: true }),
              )
            }
            className={cn(
              "flex w-full items-center rounded-md text-xs text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground",
              collapsed ? "justify-center py-2" : "gap-2 px-2 py-1.5",
            )}
            title={collapsed ? "Search (Ctrl+K)" : undefined}
          >
            <Search className="h-3 w-3 shrink-0" />
            {!collapsed && (
              <>
                Search
                <kbd className="ml-auto rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">
                  Ctrl+K
                </kbd>
              </>
            )}
          </button>
          <button
            onClick={toggleTheme}
            className={cn(
              "flex w-full items-center rounded-md text-xs text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground",
              collapsed ? "justify-center py-2" : "gap-2 px-2 py-1.5",
            )}
            title={
              collapsed
                ? theme === "dark"
                  ? "Light mode"
                  : "Dark mode"
                : undefined
            }
          >
            {theme === "dark" ? (
              <Sun className="h-3 w-3 shrink-0" />
            ) : (
              <Moon className="h-3 w-3 shrink-0" />
            )}
            {!collapsed &&
              (theme === "dark" ? "Light mode" : "Dark mode")}
          </button>
          {!collapsed && (
            <span className="block text-[10px] text-muted-foreground/50">
              Power Platform
            </span>
          )}
        </div>
      </aside>

      {/* ── Main column ─────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Quick create bar */}
        <div className="flex shrink-0 items-center gap-2 border-b border-border bg-white dark:bg-card px-4 py-1.5">
          <span className="mr-1 text-xs font-semibold tracking-wide text-muted-foreground/50 uppercase">
            quick create
          </span>
          {QUICK_CREATE_BUTTONS.map((btn) => (
            <button
              key={`${btn.target}-${btn.label}`}
              onClick={() => handleQuickCreate(btn)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                btn.bg,
                btn.color,
              )}
            >
              <btn.icon className="h-3.5 w-3.5" />
              {btn.label}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <main className="flex-1 overflow-auto p-4">{children}</main>
      </div>
    </div>
  );
}
