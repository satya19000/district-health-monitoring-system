import { insforge, AI_MODEL } from '../lib/insforge';
import type { FileCategory } from '../lib/fileParser';
import type { AnalysisResult } from '../types';

const SYSTEM_PROMPT = `You are a senior public-health data analyst supporting a District Health Monitoring System in India.
You analyse uploaded district/facility health data (immunization, maternal & child health, disease surveillance, etc.).
Be precise, quantitative where the data allows, and actionable.

Return ONLY a single valid JSON object. No markdown, no code fences, no commentary. Use exactly this schema:
{
  "summary": "2-4 sentence executive summary",
  "findings": ["key factual finding", "..."],
  "poor_indicators": [{"indicator": "name", "value": "optional value", "note": "why it is underperforming"}],
  "best_indicators": [{"indicator": "name", "value": "optional value", "note": "why it is strong"}],
  "recommendations": ["specific recommendation", "..."],
  "action_plan": [{"action": "what to do", "owner": "suggested role/owner", "timeframe": "e.g. 30 days"}]
}
Known indicators of interest: MMR, IMR, U5MR, ANC, PNC, Immunization, TB, NCD, IDSP, Maternal Health, Child Health.
If the data is insufficient for a field, return an empty array (or a short note in summary). Never invent precise figures that are not supported by the input.`;

interface AnalyzeInput {
  fileName: string;
  category: FileCategory;
  /** Extracted text (Excel/CSV/DOCX). */
  text?: string | null;
  /** Public/temporary URL of the stored object (PDF/image). */
  fileUrl?: string | null;
}

type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }
  | { type: 'file'; file: { filename: string; file_data: string } };

export async function analyzeFile(input: AnalyzeInput): Promise<{ result: AnalysisResult; raw: string }> {
  const userParts: ContentPart[] = [];

  const intro =
    `Analyse this health data file: "${input.fileName}". ` +
    `Produce the JSON described in the system instructions.`;
  userParts.push({ type: 'text', text: intro });

  let useFileParser = false;

  if (input.text && input.text.trim().length > 0) {
    userParts.push({ type: 'text', text: `\n\nFILE CONTENT (extracted):\n${input.text}` });
  } else if (input.category === 'image' && input.fileUrl) {
    userParts.push({ type: 'image_url', image_url: { url: input.fileUrl } });
  } else if (input.category === 'pdf' && input.fileUrl) {
    userParts.push({ type: 'file', file: { filename: input.fileName, file_data: input.fileUrl } });
    useFileParser = true;
  } else {
    userParts.push({
      type: 'text',
      text: '\n\n(No machine-readable content could be extracted from this file. Base the analysis on the file name and note the limitation in the summary.)',
    });
  }

  const params: Record<string, unknown> = {
    model: AI_MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userParts },
    ],
    temperature: 0.2,
  };
  if (useFileParser) {
    params.fileParser = { enabled: true, pdf: { engine: 'mistral-ocr' } };
  }

  // The SDK's request type is a large union; we build it dynamically (optional
  // fileParser), so we cast at the call boundary.
  const completion: any = await insforge.ai.chat.completions.create(params as any);
  const content: string =
    completion?.choices?.[0]?.message?.content ??
    (typeof completion === 'string' ? completion : '');

  const result = parseAnalysis(content);
  return { result, raw: content };
}

/** Robustly pull a JSON object out of a model response. */
export function parseAnalysis(content: string): AnalysisResult {
  const empty: AnalysisResult = {
    summary: '',
    findings: [],
    poor_indicators: [],
    best_indicators: [],
    recommendations: [],
    action_plan: [],
  };
  if (!content) return empty;

  let text = content.trim();
  // strip code fences if present
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

  let parsed: any = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        parsed = JSON.parse(text.slice(start, end + 1));
      } catch {
        /* fall through */
      }
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return { ...empty, summary: content.slice(0, 600) };
  }

  return {
    summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    findings: asStringArray(parsed.findings),
    poor_indicators: asIndicatorArray(parsed.poor_indicators),
    best_indicators: asIndicatorArray(parsed.best_indicators),
    recommendations: asStringArray(parsed.recommendations),
    action_plan: asActionArray(parsed.action_plan),
  };
}

function asStringArray(v: any): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).filter(Boolean);
}
function asIndicatorArray(v: any): AnalysisResult['poor_indicators'] {
  if (!Array.isArray(v)) return [];
  return v.map((x) =>
    typeof x === 'string'
      ? { indicator: x, note: '' }
      : { indicator: String(x.indicator ?? ''), value: x.value ? String(x.value) : undefined, note: String(x.note ?? '') }
  );
}
function asActionArray(v: any): AnalysisResult['action_plan'] {
  if (!Array.isArray(v)) return [];
  return v.map((x) =>
    typeof x === 'string'
      ? { action: x }
      : { action: String(x.action ?? ''), owner: x.owner ? String(x.owner) : undefined, timeframe: x.timeframe ? String(x.timeframe) : undefined }
  );
}
