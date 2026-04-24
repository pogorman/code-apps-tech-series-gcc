import { AnimatePresence, motion } from "framer-motion";
import { Archive, Pin, PinOff, Sparkles, Trash2, X } from "lucide-react";

interface MeetingsBulkBarProps {
  count: number;
  allPinned: boolean;
  onSpawn: () => void;
  onTogglePin: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onClear: () => void;
}

export function MeetingsBulkBar({
  count,
  allPinned,
  onSpawn,
  onTogglePin,
  onArchive,
  onDelete,
  onClear,
}: MeetingsBulkBarProps) {
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

          {/* Spawn action items — signature teal */}
          <button
            type="button"
            onClick={onSpawn}
            disabled={count !== 1}
            className="inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title={count === 1 ? "Spawn action items from summary" : "Select one meeting to spawn action items"}
            style={{
              fontFamily: "inherit",
              height: 28,
              padding: "0 12px",
              borderRadius: 7,
              border: 0,
              background: "linear-gradient(135deg, #06b6d4, #0e7490)",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <Sparkles className="h-[13px] w-[13px]" />
            Spawn action items
          </button>

          {/* Pin / Unpin */}
          <button
            type="button"
            onClick={onTogglePin}
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
            {allPinned ? <PinOff className="h-[13px] w-[13px]" /> : <Pin className="h-[13px] w-[13px]" />}
            {allPinned ? "Unpin" : "Pin"}
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
