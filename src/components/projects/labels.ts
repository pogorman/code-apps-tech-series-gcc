export const PROJECT_PRIORITY_LABELS: Record<number, string> = {
  468510001: "Eh",
  468510000: "Low",
  468510003: "High",
  468510002: "Top Priority",
};

export function projectPriorityVariant(p: number): "default" | "secondary" | "destructive" | "outline" {
  if (p === 468510002) return "destructive";
  if (p === 468510003) return "default";
  if (p === 468510000) return "secondary";
  return "outline";
}
