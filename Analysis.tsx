import { createClient, type InsForgeClient } from '@insforge/sdk';

/**
 * Backend configuration is read exclusively from environment variables
 * (Vite exposes only VITE_*-prefixed vars to the client).
 *
 * SECURITY: We only ever use the PUBLIC anon key in the browser. The anon key
 * is designed to be shipped to clients — access is still governed by the
 * row-level-security policies you configure in InsForge. The project-admin /
 * secret API key must NEVER appear in frontend code or env files prefixed
 * with VITE_. AI calls go through InsForge's gateway server-side, so no
 * provider secret is ever exposed here either.
 */
const baseUrl = import.meta.env.VITE_INSFORGE_URL;
const anonKey = import.meta.env.VITE_INSFORGE_ANON_KEY;

if (!baseUrl) {
  // Fail loud and early so misconfiguration is obvious in dev.
  // eslint-disable-next-line no-console
  console.error(
    'Missing VITE_INSFORGE_URL. Copy .env.example to .env and set your InsForge values.'
  );
}

export const insforge: InsForgeClient = createClient({
  baseUrl: baseUrl ?? '',
  anonKey: anonKey || undefined,
});

export const AI_MODEL = import.meta.env.VITE_AI_MODEL || 'openai/gpt-4o-mini';
export const DEFAULT_ROLE = import.meta.env.VITE_DEFAULT_ROLE || 'ASHA';
export const INSFORGE_URL = baseUrl ?? '';
