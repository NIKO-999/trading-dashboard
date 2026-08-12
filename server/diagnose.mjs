/* ============================================================
   The one place this app ever calls out to the internet.

   Everything else in Mission Control is local-first by design — no accounts,
   no telemetry, nothing leaves the Mac unless you export it yourself. This is
   the deliberate, opt-in exception: read what a trade actually says happened
   and compare it against the framework's own setup definitions, the way a
   second pair of eyes would.

   It is a relay, nothing more. The framework's setup definitions live in
   exactly one place — web/src/data/framework.ts — so this route never carries
   its own copy of them; the client sends the relevant summaries with each
   request, built fresh from that same file every time. Nothing here can drift
   out of sync with the framework mapping, because nothing here has a copy to
   drift.

   On-demand only: this never runs on its own. It costs real money per call
   (fractions of a cent at this volume, but real), so it only ever fires when
   a person presses the button.
   ============================================================ */

import express from 'express';
import { ANTHROPIC_MODEL } from './config.mjs';
import { readSettings } from './settings.mjs';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const TIMEOUT_MS = 30_000;

function buildPrompt({ note, loggedAs, setups, failedGates }) {
  const setupBlock = setups
    .map(
      (s) =>
        `### ${s.label} (id: ${s.id})\n${s.what}\nChecklist:\n${s.checks
          .map((c) => `- ${c.label}: ${c.must}`)
          .join('\n')}`,
    )
    .join('\n\n');

  const failedBlock = failedGates.length
    ? failedGates.map((g) => `- ${g.label}: ${g.avoid}`).join('\n')
    : '(none recorded)';

  return `You are reading one trader's own written note about a trade they logged, alongside the exact setup definitions their own trading framework uses. Your only job is to say whether the SEQUENCE OF EVENTS they describe more closely matches a DIFFERENT setup from the ones below than the one they tagged it as — the way an experienced second pair of eyes would, not a generic critique.

They logged this trade as: ${loggedAs.label} (id: ${loggedAs.id}).

Gates already recorded as failed or missing on this trade:
${failedBlock}

Their own note, verbatim:
"""
${note}
"""

The full set of setups in their framework, each with its own checklist:

${setupBlock}

Rules:
- Use ONLY what is given above. Never invent a rule, a gate, or a framework claim that is not literally present in the setup definitions given.
- If their note's sequence of events genuinely matches a checklist item-for-item from a DIFFERENT setup than the one they tagged, say so plainly and name which steps matched — this is the main value of the exercise.
- If nothing in their note points to a different setup, say that plainly instead. Do not force a comparison that is not there.
- One to three sentences. Same terse, plain-English register as the checklist itself — no hedging, no "it's possible that", no coaching tone.
- Do not repeat their note back to them. Add the comparison, not a summary.`;
}

export function diagnoseRouter() {
  const router = express.Router();

  router.post('/', async (req, res) => {
    const { note, loggedAs, setups, failedGates } = req.body ?? {};
    if (typeof note !== 'string' || !note.trim()) {
      return res.status(400).json({ error: 'Nothing written on this trade to compare against.' });
    }
    if (!loggedAs?.id || !Array.isArray(setups) || setups.length === 0) {
      return res.status(400).json({ error: 'Missing setup definitions — expected { loggedAs, setups }' });
    }

    const settings = await readSettings();
    if (!settings.anthropicApiKey) {
      return res.status(412).json({ error: 'No API key saved yet. Add one under Data & backups.' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const resp = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'content-type': 'application/json',
          'x-api-key': settings.anthropicApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: ANTHROPIC_MODEL,
          max_tokens: 300,
          messages: [{ role: 'user', content: buildPrompt({ note, loggedAs, setups, failedGates: failedGates ?? [] }) }],
        }),
      });

      if (!resp.ok) {
        const body = await resp.text().catch(() => '');
        console.error('[diagnose] Anthropic API error:', resp.status, body.slice(0, 300));
        const message =
          resp.status === 401
            ? 'That API key was rejected — check it under Data & backups.'
            : resp.status === 429
              ? 'Rate limited — try again in a moment.'
              : 'The diagnosis service returned an error.';
        return res.status(502).json({ error: message });
      }

      const data = await resp.json();
      const text = data?.content?.find((b) => b.type === 'text')?.text?.trim();
      if (!text) {
        return res.status(502).json({ error: 'Got an empty response back.' });
      }
      res.json({ diagnosis: text });
    } catch (err) {
      const timedOut = err.name === 'AbortError';
      console.error('[diagnose] request failed:', timedOut ? 'timed out' : err.message);
      res.status(504).json({ error: timedOut ? 'Timed out waiting for a response.' : 'Could not reach the diagnosis service.' });
    } finally {
      clearTimeout(timeout);
    }
  });

  return router;
}
