import { useEffect, useMemo, useState } from "react";
import { useProjects, useDeleteProject, useUpdateProject } from "@/hooks/use-projects";
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
import { ProjectFormDialog } from "./project-form-dialog";
import { ProjectDetailDialog } from "./project-detail-dialog";
import { ProjectDeleteDialog } from "./project-delete-dialog";
import { FolderKanban, Pencil, Plus, Search, Trash2 } from "lucide-react";
import type { Tdvsp_projectsModel } from "@/generated";
import { toast } from "sonner";
import { useQuickCreateStore } from "@/stores/quick-create-store";
import { PROJECT_PRIORITY_LABELS, projectPriorityVariant } from "./labels";
import { useViewPreference } from "@/hooks/use-view-preference";
import { ViewToggle } from "@/components/ui/view-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TileColorDots } from "@/components/ui/tile-color-dots";
import { priorityToColorIndex, tileBgClass, COLOR_TO_PRIORITY } from "@/lib/tile-colors";
import { cn } from "@/lib/utils";

type Project = Tdvsp_projectsModel.Tdvsp_projects;

export function ProjectList() {
  const quickTarget = useQuickCreateStore((s) => s.target);
  const clearQuickCreate = useQuickCreateStore((s) => s.clear);

  const [viewMode, setViewMode] = useViewPreference("projects");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (quickTarget === "projects") {
      setCreateOpen(true);
      clearQuickCreate();
    }
  }, [quickTarget, clearQuickCreate]);

  const [editItem, setEditItem] = useState<Project | null>(null);
  const [viewItem, setViewItem] = useState<Project | null>(null);
  const [deleteItem, setDeleteItem] = useState<Project | null>(null);

  const filter = search
    ? `contains(tdvsp_name, '${search.replace(/'/g, "''")}')`
    : undefined;

  const { data: items, isLoading, error } = useProjects({ filter });
  const { data: accounts } = useAccounts();
  const deleteMutation = useDeleteProject();
  const updateMutation = useUpdateProject();

  const accountNameMap = useMemo(() => {
    const map = new Map<string, string>();
    accounts?.forEach((a) => map.set(a.accountid, a.name));
    return map;
  }, [accounts]);

  function handleDelete() {
    if (!deleteItem) return;
    deleteMutation.mutate(deleteItem.tdvsp_projectid, {
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
        Failed to load projects: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <FolderKanban className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">Track and manage projects</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle mode={viewMode} onChange={setViewMode} />
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
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
                <TableHead>Priority</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 4 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : items?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    {search ? "No projects match your search." : "No projects found. Create one to get started."}
                  </TableCell>
                </TableRow>
              ) : (
                items?.map((item) => {
                  const accountId = (item as unknown as Record<string, string>)._tdvsp_account_value;
                  const accountName = item.tdvsp_accountname ?? accountNameMap.get(accountId ?? "") ?? "—";
                  return (
                    <TableRow
                      key={item.tdvsp_projectid}
                      className="cursor-pointer"
                      onClick={() => setViewItem(item)}
                    >
                      <TableCell className="font-medium">{item.tdvsp_name}</TableCell>
                      <TableCell>{accountName}</TableCell>
                      <TableCell>
                        {item.tdvsp_priority != null ? (
                          <Badge variant={projectPriorityVariant(item.tdvsp_priority)}>
                            {PROJECT_PRIORITY_LABELS[item.tdvsp_priority]}
                          </Badge>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" onClick={() => setEditItem(item)}>
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
          {search ? "No projects match your search." : "No projects found. Create one to get started."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items?.map((item) => {
            const accountId = (item as unknown as Record<string, string>)._tdvsp_account_value;
            const accountName = item.tdvsp_accountname ?? accountNameMap.get(accountId ?? "") ?? "—";
            const colorIdx = priorityToColorIndex(item.tdvsp_priority);
            return (
              <Card
                key={item.tdvsp_projectid}
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
                          id: item.tdvsp_projectid,
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
                  {item.tdvsp_priority != null && (
                    <Badge variant={projectPriorityVariant(item.tdvsp_priority)}>
                      {PROJECT_PRIORITY_LABELS[item.tdvsp_priority]}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ProjectFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
      />

      <ProjectFormDialog
        open={!!editItem}
        onOpenChange={(open) => { if (!open) setEditItem(null); }}
        mode="edit"
        project={editItem ?? undefined}
      />

      <ProjectDetailDialog
        open={!!viewItem}
        onOpenChange={(open) => { if (!open) setViewItem(null); }}
        project={viewItem ?? undefined}
        onEdit={(item) => {
          setViewItem(null);
          setEditItem(item);
        }}
      />

      <ProjectDeleteDialog
        open={!!deleteItem}
        onOpenChange={(open) => { if (!open) setDeleteItem(null); }}
        itemName={deleteItem?.tdvsp_name ?? ""}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
