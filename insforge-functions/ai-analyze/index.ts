/**
 * InsForge Edge Function: ai-analyze  (OPTIONAL)
 * ------------------------------------------------------------------
 * The frontend already calls `insforge.ai.chat.completions.create(...)`
 * directly through the authenticated client, so the AI provider key
 * never touches the browser. This edge function is an OPTIONAL
 * server-side alternative if you prefer to keep ALL analysis logic on
 * the backend (e.g. to enforce a fixed model, add rate limiting, or
 * post-process results before they reach the client).
 *
 * Deploy with the InsForge CLI:
 *   npx @insforge/cli login --user-api-key <YOUR_USER_API_KEY>
 *   npx @insforge/cli link --project-id <YOUR_PROJECT_ID>
 *   npx @insforge/cli functions deploy ai-analyze
 *
 * Invoke from the frontend:
 *   const { data } = await insforge.functions.invoke('ai-analyze', {
 *     body: { fileName, text, fileUrl, category }
 *   });
 *
 * NOTE: This is a Deno-style edge function. The `Insforge` global / env
 * bindings are provided by the InsForge runtime at execution time.
 * Adjust imports to match your project's function template if needed.
 */

const SYSTEM_PROMPT = `You are a senior public-health data analyst supporting a District Health Monitoring System in India.
Analyse the provided district/facility health data. Return ONLY one valid JSON object with this schema:
{
  "summary": "2-4 sentence executive summary",
  "findings": ["..."],
  "poor_indicators": [{"indicator":"name","value":"optional","note":"why underperforming"}],
  "best_indicators": [{"indicator":"name","value":"optional","note":"why strong"}],
  "recommendations": ["..."],
  "action_plan": [{"action":"what to do","owner":"role","timeframe":"e.g. 30 days"}]
}
No markdown, no code fences. Indicators of interest: MMR, IMR, U5MR, ANC, PNC, Immunization, TB, NCD, IDSP, Maternal Health, Child Health.`;

// The InsForge runtime injects a configured server client as `insforge`.
// If your template exposes it differently, adapt the import/handler below.
declare const insforge: any;

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { fileName, text, fileUrl, category, model } = await req.json();

    const parts: any[] = [
      { type: 'text', text: `Analyse this health data file: "${fileName ?? 'uploaded file'}".` },
    ];
    let fileParser: any = undefined;

    if (text && String(text).trim().length > 0) {
      parts.push({ type: 'text', text: `\n\nFILE CONTENT:\n${String(text).slice(0, 24000)}` });
    } else if (category === 'image' && fileUrl) {
      parts.push({ type: 'image_url', image_url: { url: fileUrl } });
    } else if (category === 'pdf' && fileUrl) {
      parts.push({ type: 'file', file: { filename: fileName, file_data: fileUrl } });
      fileParser = { enabled: true, pdf: { engine: 'mistral-ocr' } };
    }

    const completion = await insforge.ai.chat.completions.create({
      model: model || 'openai/gpt-4o-mini',
      temperature: 0.2,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: parts },
      ],
      ...(fileParser ? { fileParser } : {}),
    });

    const content = completion?.choices?.[0]?.message?.content ?? '';
    let parsed: unknown = null;
    try {
      const match = String(content).match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : null;
    } catch {
      parsed = null;
    }

    return new Response(JSON.stringify({ analysis: parsed, raw: content }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
