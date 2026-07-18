import {
  generateTemplateStandup,
  standupToMarkdown,
} from "@/lib/ai/templateStandup";
import { validateAndStripCitations } from "@/lib/ai/validateCitations";
import type {
  ActivityEvent,
  GenerateStandupRequest,
  GenerateStandupResponse,
} from "@/lib/types";

/**
 * Person B owns generation logic.
 * Person A's POST /api/standups/generate should fetch events, then call this.
 * Falls back to templates when OPENAI_API_KEY is unset or the model call fails.
 */
export async function generateStandup(
  events: ActivityEvent[],
  req: GenerateStandupRequest,
): Promise<GenerateStandupResponse> {
  if (events.length === 0) {
    const empty = {
      whatIDid: [
        {
          text: "No git activity in this range yet — sync repos or widen the dates.",
        },
      ],
      whatsNext: [{ text: "Connect repos and hit Refresh now." }],
      blockers: [{ text: "Waiting on activity data." }],
      proofLinks: [],
    };
    return {
      contentMd: standupToMarkdown(empty),
      contentJson: empty,
      eventIds: [],
    };
  }

  try {
    const ai = await tryOpenAIStandup(events, req);
    if (ai) return ai;
  } catch {
    // fall through to template
  }

  const templated = generateTemplateStandup(events, req);
  const validated = validateAndStripCitations(templated.contentJson, events);
  return {
    contentMd: standupToMarkdown(validated.content),
    contentJson: validated.content,
    eventIds: validated.eventIds,
  };
}

async function tryOpenAIStandup(
  events: ActivityEvent[],
  req: GenerateStandupRequest,
): Promise<GenerateStandupResponse | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const base = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const compact = events.map((e) => ({
    id: e.id,
    type: e.type,
    title: e.title,
    url: e.url,
    repo: e.repoFullName,
    additions: e.additions,
    deletions: e.deletions,
    occurredAt: e.occurredAt,
  }));

  const system = `You write honest internship standups grounded ONLY in the provided events.
Rules:
- Every "whatIDid" and "proofLinks" bullet MUST include eventId matching an event id.
- Do not invent features, PRs, or metrics.
- Tone: ${req.tone}. Length: ${req.length}. Highlight merged PRs: ${Boolean(req.highlightMode)}.
- Return strict JSON: { whatIDid: [{text, eventId}], whatsNext: [{text, eventId?}], blockers: [{text, eventId?}], proofLinks: [{text, eventId}] }`;

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: JSON.stringify({
            rangeStart: req.rangeStart,
            rangeEnd: req.rangeEnd,
            events: compact,
          }),
        },
      ],
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) return null;

  const parsed = JSON.parse(raw) as GenerateStandupResponse["contentJson"];
  const validated = validateAndStripCitations(parsed, events);
  if (validated.content.whatIDid.length === 0) return null;

  return {
    contentMd: standupToMarkdown(validated.content),
    contentJson: validated.content,
    eventIds: validated.eventIds,
  };
}
