import { AnimatePresence, motion } from "framer-motion";
import { Archive, Sparkles, Trash2, X } from "lucide-react";

interface IdeasBulkBarProps {
  count: number;
  onPromote: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onClear: () => void;
}

export function IdeasBulkBar({ count, onPromote, onArchive, onDelete, onClear }: IdeasBulkBarProps) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2"
          style={{
            fontFamily: "'Inter', sans-serif",
            padding: "8px 12px",
            borderRadius: 10,
            background: "var(--dash-ink-1)",
            boxShadow: "0 8px 30px rgba(0,0,0,.25), 0 2px 8px rgba(0,0,0,.15)",
          }}
        >
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

          <div className="w-px h-4" style={{ background: "rgba(255,255,255,.2)" }} />

          {/* Promote — signature yellow */}
          <button
            type="button"
            onClick={onPromote}
            className="inline-flex items-center gap-1.5 cursor-pointer"
            style={{
              fontFamily: "inherit",
              height: 28,
              padding: "0 12px",
              borderRadius: 7,
              border: 0,
              background: "linear-gradient(135deg, #fde047, #facc15)",
              color: "#713f12",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <Sparkles className="h-[13px] w-[13px]" />
            Promote to Action Items
          </button>

          {/* Archive */}
          <button
            type="button"
            onClick={onArchive}
            className="inline-flex items-center gap-1.5 cursor-pointer"
            style={{
              fontFamily: "inherit",
              height: 28,
              padding: "0 10px",
              borderRadius: 7,
              border: 0,
              background: "rgba(255,255,255,.1)",
              color: "#fff",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            <Archive className="h-[13px] w-[13px]" />
            Archive
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 cursor-pointer"
            style={{
              fontFamily: "inherit",
              height: 28,
              padding: "0 10px",
              borderRadius: 7,
              border: 0,
              background: "rgba(255,255,255,.1)",
              color: "#f87171",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            <Trash2 className="h-[13px] w-[13px]" />
            Delete
          </button>

          <div className="w-px h-4" style={{ background: "rgba(255,255,255,.2)" }} />

          <button
            type="button"
            onClick={onClear}
            title="Clear selection"
            className="inline-flex items-center justify-center cursor-pointer"
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              border: 0,
              background: "rgba(255,255,255,.1)",
              color: "rgba(255,255,255,.7)",
            }}
          >
            <X className="h-[13px] w-[13px]" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
