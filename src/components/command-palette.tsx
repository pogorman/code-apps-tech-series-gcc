import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Command } from "cmdk";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Building2,
  Users,
  ClipboardList,
  FileText,
  Lightbulb,
  Search,
} from "lucide-react";
import { useAccounts } from "@/hooks/use-accounts";
import { useContacts } from "@/hooks/use-contacts";
import { useActionItems } from "@/hooks/use-action-items";
import { useMeetingSummaries } from "@/hooks/use-meeting-summaries";
import { useIdeas } from "@/hooks/use-ideas";

const MAX_RESULTS = 5;

interface SearchResult {
  id: string;
  name: string;
  subtitle?: string;
  route: string;
  entity: string;
  icon: typeof Building2;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const { data: accounts } = useAccounts();
  const { data: contacts } = useContacts();
  const { data: actionItems } = useActionItems();
  const { data: meetingSummaries } = useMeetingSummaries();
  const { data: ideas } = useIdeas();

  // Global keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const allResults = useMemo(() => {
    const results: SearchResult[] = [];

    for (const a of accounts ?? []) {
      results.push({
        id: a.accountid,
        name: a.name ?? "Unnamed Account",
        subtitle: a.emailaddress1 ?? undefined,
        route: "/accounts",
        entity: "Accounts",
        icon: Building2,
      });
    }

    for (const c of contacts ?? []) {
      const fullName = [c.firstname, c.lastname].filter(Boolean).join(" ") || "Unnamed Contact";
      const parentName = c.parentcustomeridname;
      results.push({
        id: (c as unknown as Record<string, string>).contactid ?? c.address1_addressid ?? "",
        name: fullName,
        subtitle: parentName ?? c.emailaddress1 ?? undefined,
        route: "/contacts",
        entity: "Contacts",
        icon: Users,
      });
    }

    for (const ai of actionItems ?? []) {
      results.push({
        id: ai.tdvsp_actionitemid,
        name: ai.tdvsp_name ?? "Unnamed Item",
        subtitle: ai.tdvsp_customername ?? undefined,
        route: "/action-items",
        entity: "Action Items",
        icon: ClipboardList,
      });
    }

    for (const ms of meetingSummaries ?? []) {
      results.push({
        id: ms.tdvsp_meetingsummaryid,
        name: ms.tdvsp_name ?? "Unnamed Summary",
        subtitle: ms.tdvsp_accountname ?? undefined,
        route: "/meeting-summaries",
        entity: "Meetings",
        icon: FileText,
      });
    }

    for (const idea of ideas ?? []) {
      results.push({
        id: idea.tdvsp_ideaid,
        name: idea.tdvsp_name ?? "Unnamed Idea",
        subtitle: idea.tdvsp_accountname ?? undefined,
        route: "/ideas",
        entity: "Ideas",
        icon: Lightbulb,
      });
    }

    return results;
  }, [accounts, contacts, actionItems, meetingSummaries, ideas]);

  const filtered = useMemo((): Map<string, SearchResult[]> => {
    if (!query.trim()) return new Map();
    const q = query.toLowerCase();
    const matches = allResults.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.subtitle?.toLowerCase().includes(q),
    );
    // Group by entity, max MAX_RESULTS per group
    const grouped = new Map<string, SearchResult[]>();
    for (const r of matches) {
      const group = grouped.get(r.entity) ?? [];
      if (group.length < MAX_RESULTS) {
        group.push(r);
      }
      grouped.set(r.entity, group);
    }
    return grouped;
  }, [query, allResults]);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery("");
    navigate(result.route);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 shadow-2xl max-w-lg [&>button]:hidden">
        <Command
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
          shouldFilter={false}
        >
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              placeholder="Search across all records..."
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              value={query}
              onValueChange={setQuery}
            />
            <kbd className="pointer-events-none ml-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2">
            {query.trim() === "" && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Type to search across all records...
              </div>
            )}

            {query.trim() !== "" && filtered.size === 0 && (
              <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
                No results found for "{query}"
              </Command.Empty>
            )}

            {Array.from(filtered.entries()).map(([entity, results]) => (
              <Command.Group key={entity} heading={entity}>
                {results.map((result) => (
                  <Command.Item
                    key={`${result.entity}-${result.id}`}
                    value={`${result.entity}-${result.id}`}
                    onSelect={() => handleSelect(result)}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
                  >
                    <result.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate font-medium">
                        {highlightMatch(result.name, query)}
                      </p>
                      {result.subtitle && (
                        <p className="truncate text-xs text-muted-foreground">
                          {highlightMatch(result.subtitle, query)}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground/50">
                      {entity}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

/** Highlight matching substrings */
function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="font-semibold text-violet-600 underline underline-offset-2">
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </>
  );
}
