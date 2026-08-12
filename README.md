# Mission Control

A trading dashboard and a read-only window into the AIOS Obsidian vault, served
from your Mac and usable from your phone.

```
hub/      the gateway page (WebGL ambient field, themes, drawer) — served at /
web/      the React dashboard — built to web/dist, served at /trading
server/   Express: vault reads, the trades store, screenshot uploads
data/     your trades, screenshots and rolling backups (gitignored)
```

## Run it

```bash
npm run setup
```

```bash
npm run build && npm start
```

The server prints every address it is reachable on:

```
  local     http://localhost:4400
  lan       http://192.168.1.134:4400   (en1)
  tailscale http://100.x.x.x:4400       (utun4)
```

For development with hot reload, `npm run dev` runs the API on 4400 and Vite on
3000, with `/api` proxied so both modes talk to one origin.

## On your phone

1. **Same wifi** — open the `lan` address in Safari.
2. **Anywhere** — install [Tailscale](https://tailscale.com) on the Mac and the
   iPhone, sign both into the same account, then use the `tailscale` address.
   It is a private network between your own devices; nothing is exposed to the
   internet.
3. **Add to Home Screen** from the share sheet. It opens fullscreen with its own
   icon and keeps working offline from cache when the Mac is asleep.

**The Mac has to be awake** to serve live data. Set Energy Saver to prevent
sleeping while on power, or the phone falls back to its cached copy.

### Keep it running across reboots

```bash
cp scripts/com.niko.missioncontrol.plist ~/Library/LaunchAgents/ && launchctl load ~/Library/LaunchAgents/com.niko.missioncontrol.plist
```

To stop it:

```bash
launchctl unload ~/Library/LaunchAgents/com.niko.missioncontrol.plist
```

## Logging a trade

Type what you risked and what you made — `300` and `900`. R-multiple, win/loss,
P/L, the calendar cell and every statistic derive themselves. Pair, direction,
time, notes, tags and screenshots are all optional and can be filled in later
from either device.

Outcomes are `win / loss / be / data`. **Data** marks a trade taken for
information: it stays in the ledger but is left out of win rate, expectancy and
the equity curve. Tapping an outcome button overrides the derived value; tapping
it again clears the override.

## Where things live

**Trades** are one JSON file at `data/trades.json` on the Mac, so the phone and
the Mac always show the same set. The browser keeps a mirror so the app still
opens and reads when the server is unreachable; edits made offline are queued
and flush on reconnect. The server writes atomically and keeps the last 20
versions in `data/backups/`.

**Screenshots** upload to `data/media/`.

**The vault is never written to.** `server/vault.mjs` imports only `readdir`,
`readFile` and `stat` — there is no code path that can modify, move or delete
anything in AIOS. Every request path is resolved and checked against the vault
root, so `?path=../../` is rejected with a 403.

Point it somewhere else with an env var if the vault ever moves:

```bash
VAULT_ROOT="/path/to/vault" npm start
```

## Knowledge Base

Browses the whole vault and renders Obsidian's syntax properly: `[[wikilinks]]`
with aliases resolve the way Obsidian resolves them (exact path first, then
basename, preferring the same folder), `![[embeds]]` render inline and open in a
lightbox, and `==highlights==` render as highlights. Every note shows which
other notes link to it.

## Not included

There is no import. Trades are typed in, by design.
