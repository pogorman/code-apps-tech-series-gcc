import { AnimatePresence, motion } from "framer-motion";
import { Check, Trash2, X } from "lucide-react";

interface BulkActionBarProps {
  count: number;
  onMarkComplete: () => void;
  onDelete: () => void;
  onClear: () => void;
}

export function BulkActionBar({ count, onMarkComplete, onDelete, onClear }: BulkActionBarProps) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-2 rounded-[10px]"
          style={{
            fontFamily: "'Inter', sans-serif",
            background: "var(--dash-ink-1)",
            boxShadow: "0 8px 30px rgba(0,0,0,.25), 0 2px 8px rgba(0,0,0,.15)",
          }}
        >
          {/* Count */}
          <span
            className="text-[12px] font-medium px-2 py-0.5 rounded-md"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              color: "#fff",
              background: "rgba(255,255,255,.12)",
            }}
          >
            {count} selected
          </span>

          {/* Separator */}
          <div className="w-px h-4" style={{ background: "rgba(255,255,255,.2)" }} />

          {/* Mark complete */}
          <button
            type="button"
            className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[12px] font-medium cursor-pointer border-0"
            style={{
              fontFamily: "inherit",
              background: "rgba(255,255,255,.1)",
              color: "#fff",
            }}
            onClick={onMarkComplete}
          >
            <Check className="h-3.5 w-3.5" />
            Mark complete
          </button>

          {/* Delete */}
          <button
            type="button"
            className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[12px] font-medium cursor-pointer border-0"
            style={{
              fontFamily: "inherit",
              background: "rgba(255,255,255,.1)",
              color: "#f87171",
            }}
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>

          {/* Separator */}
          <div className="w-px h-4" style={{ background: "rgba(255,255,255,.2)" }} />

          {/* Clear */}
          <button
            type="button"
            className="inline-flex items-center justify-center w-7 h-7 rounded-md cursor-pointer border-0"
            style={{
              background: "rgba(255,255,255,.1)",
              color: "rgba(255,255,255,.7)",
            }}
            onClick={onClear}
            title="Clear selection"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
