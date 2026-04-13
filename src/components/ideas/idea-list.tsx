import { useEffect, useMemo, useState } from "react";
import { useIdeas, useDeleteIdea } from "@/hooks/use-ideas";
import { useAccounts } from "@/hooks/use-accounts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { IdeaFormDialog } from "./idea-form-dialog";
import { IdeaDetailDialog } from "./idea-detail-dialog";
import { IdeaDeleteDialog } from "./idea-delete-dialog";
import { Lightbulb, Pencil, Plus, Search, Trash2 } from "lucide-react";
import type { Tdvsp_ideasModel } from "@/generated";
import { toast } from "sonner";
import { useQuickCreateStore } from "@/stores/quick-create-store";
import { CATEGORY_LABELS, categoryVariant, IDEA_PRIORITY_LABELS, ideaPriorityVariant } from "./labels";
import { useViewPreference } from "@/hooks/use-view-preference";
import { ViewToggle } from "@/components/ui/view-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TileColorDots } from "@/components/ui/tile-color-dots";
import { priorityToColorIndex, tileBgClass, COLOR_TO_PRIORITY } from "@/lib/tile-colors";
import { useUpdateIdea } from "@/hooks/use-ideas";
import { cn } from "@/lib/utils";

type Idea = Tdvsp_ideasModel.Tdvsp_ideas;

export function IdeaList() {
  const quickTarget = useQuickCreateStore((s) => s.target);
  const clearQuickCreate = useQuickCreateStore((s) => s.clear);

  const [viewMode, setViewMode] = useViewPreference("ideas");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (quickTarget === "ideas") {
      setCreateOpen(true);
      clearQuickCreate();
    }
  }, [quickTarget, clearQuickCreate]);
  const [editItem, setEditItem] = useState<Idea | null>(null);
  const [viewItem, setViewItem] = useState<Idea | null>(null);
  const [deleteItem, setDeleteItem] = useState<Idea | null>(null);

  const filter = search
    ? `contains(tdvsp_name, '${search.replace(/'/g, "''")}')`
    : undefined;

  const { data: items, isLoading, error } = useIdeas({ filter });
  const { data: accounts } = useAccounts();
  const deleteMutation = useDeleteIdea();
  const updateMutation = useUpdateIdea();

  const accountNameMap = useMemo(() => {
    const map = new Map<string, string>();
    accounts?.forEach((a) => map.set(a.accountid, a.name));
    return map;
  }, [accounts]);

  function handleDelete() {
    if (!deleteItem) return;
    deleteMutation.mutate(deleteItem.tdvsp_ideaid, {
      onSuccess: () => {
        toast.success(`Deleted "${deleteItem.tdvsp_name}"`);
        setDeleteItem(null);
      },
      onError: (err) => {
        toast.error(`Delete failed: ${err.message}`);
      },
    });
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        Failed to load ideas: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Lightbulb className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ideas</h1>
          <p className="text-sm text-muted-foreground">Capture and organize solution ideas</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search ideas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle mode={viewMode} onChange={setViewMode} />
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Idea
          </Button>
        </div>
      </div>

      {viewMode === "table" ? (
        <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : items?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    {search ? "No ideas match your search." : "No ideas found. Create one to get started."}
                  </TableCell>
                </TableRow>
              ) : (
                items?.map((item) => {
                  const accountId = (item as unknown as Record<string, string>)._tdvsp_account_value;
                  const accountName = item.tdvsp_accountname ?? accountNameMap.get(accountId ?? "") ?? "\u2014";
                  return (
                    <TableRow
                      key={item.tdvsp_ideaid}
                      className="cursor-pointer"
                      onClick={() => setViewItem(item)}
                    >
                      <TableCell className="font-medium">{item.tdvsp_name}</TableCell>
                      <TableCell>{accountName}</TableCell>
                      <TableCell>
                        {item.tdvsp_category != null ? (
                          <Badge variant={categoryVariant(item.tdvsp_category)}>
                            {CATEGORY_LABELS[item.tdvsp_category]}
                          </Badge>
                        ) : "\u2014"}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const p = (item as unknown as Record<string, number>).tdvsp_priority;
                          return p != null ? (
                            <Badge variant={ideaPriorityVariant(p)}>
                              {IDEA_PRIORITY_LABELS[p]}
                            </Badge>
                          ) : "\u2014";
                        })()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditItem(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteItem(item)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-5 w-3/4" /></CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : items?.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          {search ? "No ideas match your search." : "No ideas found. Create one to get started."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items?.map((item) => {
            const accountId = (item as unknown as Record<string, string>)._tdvsp_account_value;
            const accountName = item.tdvsp_accountname ?? accountNameMap.get(accountId ?? "") ?? "\u2014";
            const priority = (item as unknown as Record<string, number>).tdvsp_priority;
            const colorIdx = priorityToColorIndex(priority);
            return (
              <Card
                key={item.tdvsp_ideaid}
                className={cn("group cursor-pointer transition-shadow hover:shadow-md", tileBgClass(colorIdx))}
                onClick={() => setViewItem(item)}
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-semibold">{item.tdvsp_name}</CardTitle>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <TileColorDots
                      activeIndex={colorIdx}
                      onChange={(idx) => {
                        updateMutation.mutate({
                          id: item.tdvsp_ideaid,
                          fields: { tdvsp_priority: COLOR_TO_PRIORITY[idx] } as never,
                        });
                      }}
                    />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditItem(item)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteItem(item)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="text-muted-foreground">
                    <span className="font-medium text-foreground">Account: </span>
                    {accountName}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.tdvsp_category != null && (
                      <Badge variant={categoryVariant(item.tdvsp_category)}>
                        {CATEGORY_LABELS[item.tdvsp_category]}
                      </Badge>
                    )}
                    {priority != null && (
                      <Badge variant={ideaPriorityVariant(priority)}>
                        {IDEA_PRIORITY_LABELS[priority]}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <IdeaFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
      />

      <IdeaFormDialog
        open={!!editItem}
        onOpenChange={(open) => { if (!open) setEditItem(null); }}
        mode="edit"
        idea={editItem ?? undefined}
      />

      <IdeaDetailDialog
        open={!!viewItem}
        onOpenChange={(open) => { if (!open) setViewItem(null); }}
        idea={viewItem ?? undefined}
        onEdit={(item) => {
          setViewItem(null);
          setEditItem(item);
        }}
      />

      <IdeaDeleteDialog
        open={!!deleteItem}
        onOpenChange={(open) => { if (!open) setDeleteItem(null); }}
        itemName={deleteItem?.tdvsp_name ?? ""}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
