import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ViewMode } from "@/hooks/use-view-preference";

interface ViewToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewToggle({ mode, onChange }: ViewToggleProps) {
  return (
    <div className="flex rounded-md border">
      <Button
        variant={mode === "table" ? "secondary" : "ghost"}
        size="sm"
        className="rounded-r-none border-0"
        onClick={() => onChange("table")}
        aria-label="Table view"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant={mode === "card" ? "secondary" : "ghost"}
        size="sm"
        className="rounded-l-none border-0"
        onClick={() => onChange("card")}
        aria-label="Card view"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
    </div>
  );
}
