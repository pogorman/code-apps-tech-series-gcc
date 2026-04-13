import { COLOR_DOTS } from "@/lib/tile-colors";
import { cn } from "@/lib/utils";

interface TileColorDotsProps {
  /** Currently active color index (0 = none). */
  activeIndex: number;
  /** Called when user clicks a dot. */
  onChange: (index: number) => void;
  /** Extra wrapper classes. */
  className?: string;
}

/**
 * Row of priority-color dots that appear on hover in the top-right of a tile.
 * Spectrum: clear · blue · orange · red · dark-red
 */
export function TileColorDots({ activeIndex, onChange, className }: TileColorDotsProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity",
        className,
      )}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {COLOR_DOTS.map((dot) => {
        const isActive = dot.index === activeIndex;
        const isClear = dot.index === 0;

        return (
          <button
            key={dot.index}
            type="button"
            title={dot.label}
            onClick={(e) => {
              e.stopPropagation();
              onChange(dot.index);
            }}
            className={cn(
              "h-3.5 w-3.5 rounded-full border-2 transition-transform hover:scale-125 shrink-0",
              isActive && "ring-2 ring-offset-1",
            )}
            style={{
              background: isClear ? "transparent" : dot.hex,
              borderColor: isClear ? "#a1a1aa" : dot.hex,
              ...(isClear ? { borderStyle: "dashed" } : {}),
              ...(isActive ? { ringColor: dot.ring } : {}),
            }}
          />
        );
      })}
    </div>
  );
}
