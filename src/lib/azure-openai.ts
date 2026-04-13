export interface ExtractedActionItem {
  name: string;
  priority: "High" | "Medium" | "Low";
  dueDate: string | null;
  notes: string;
}

/** Map AI priority strings to Dataverse numeric choice keys */
const PRIORITY_MAP: Record<string, number> = {
  High: 468510003,
  Medium: 468510001, // "Eh" in the app's labels
  Low: 468510000,
};

/** Dataverse "Recognized" (not started) status */
const STATUS_RECOGNIZED = 468510000;

export function isAoaiConfigured(): boolean {
  return !!(
    import.meta.env.VITE_AOAI_ENDPOINT &&
    import.meta.env.VITE_AOAI_API_KEY &&
    import.meta.env.VITE_AOAI_DEPLOYMENT
  );
}

export function mapPriorityToDataverse(priority: string): number {
  return PRIORITY_MAP[priority] ?? 468510001;
}

export const DEFAULT_STATUS = STATUS_RECOGNIZED;

export async function extractActionItems(
  meetingNotes: string,
): Promise<ExtractedActionItem[]> {
  const endpoint = import.meta.env.VITE_AOAI_ENDPOINT as string;
  const apiKey = import.meta.env.VITE_AOAI_API_KEY as string;
  const deployment = import.meta.env.VITE_AOAI_DEPLOYMENT as string;

  const url = `${endpoint.replace(/\/$/, "")}/openai/deployments/${deployment}/chat/completions?api-version=2024-10-21`;

  const systemPrompt = `You are an assistant that extracts action items from meeting notes.
Return ONLY a JSON array (no markdown, no explanation) where each element has:
- "name": string — concise action item title
- "priority": "High" | "Medium" | "Low"
- "dueDate": ISO date string (YYYY-MM-DD) if mentioned or inferable, otherwise null
- "notes": string — brief context from the meeting

Be thorough — extract every actionable task, follow-up, and commitment mentioned.`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: meetingNotes },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Azure OpenAI error ${response.status}: ${body}`);
  }

  const json = await response.json();
  const content: string = json.choices?.[0]?.message?.content ?? "[]";

  // Strip markdown code fences if present
  const cleaned = content.replace(/```json?\s*/g, "").replace(/```/g, "").trim();
  const parsed: ExtractedActionItem[] = JSON.parse(cleaned);

  return parsed;
}
