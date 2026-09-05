---
name: ink-access
description: Use when the user invokes "ink:status", "ink status", "ink-access", or asks about the INK ACCESS campaign status, waitlist, VIP slots, or Vesper's campaign data. Runs a live campaign status check against the Base44 superagent (Vesper) via the base44-ink MCP tools and reads the structured reply back to the user.
---

# INK ACCESS — Campaign Status Skill

## Trigger
User says `ink:status` (or `ink status`, "campaign status", "waitlist check", "VIP slots"). Load this skill, then run the status check below. The user is watching the Base44 superagent chat live, so replies must be read back in full.

## What "ink:status" does
1. Call the **base44-ink MCP tool `ink_status`** (no arguments). It POSTs a status-check request to Vesper (Base44 agent API) asking her to query the **InkAccessInquiry**, **Client**, and **Booking** entities and return structured campaign data.
2. Vesper returns a structured report: waitlist count, inquiry states, VIP slots booked/remaining, upcoming bookings, expiry actions.
3. **Read the reply back to the user verbatim** (locked rule: always read back findings — show the actual content, not a summary).

## Fallbacks
- If the `ink_status` tool is unavailable: use `ink_ask` with message: `"Query the InkAccessInquiry, Client and Booking entities and give me a structured INK ACCESS campaign status: waitlist count, inquiry states, VIP slots taken/remaining, upcoming bookings, and any expiry actions due. Be specific with numbers."`
- If no MCP tool is available at all: POST to the conversation endpoint with curl (payload via json.dumps to a temp file, `-d @file`). Endpoint: `https://app.base44.com/api/agents/6a70092be08ebf674a3fe3bd/conversations/6a70092d11d246064795901a/messages`, header `api_key: <key from ~/.config/opencode/base44_api.key>`.

## Other useful calls
- `ink_ask` with `{"message": "..."}` — send any order to Vesper and return her reply (use for live work while the user watches).
- `ink_conversation` with `{"limit": 10}` — pull the last N messages of the conversation for context.

## Output format
When the user asked for status, structure the read-back with headers: Waitlist, Inquiry states, Slots, Bookings, Actions due. Always include the raw reply text so nothing is hidden.

## Key facts (context for interpreting her reply)
- Campaign: monthly tattoo subscription, $1,200 Essential VIP / $2,000 Priority VIP, max 8-10 VIPs/month, 2-3 daily slots, DM keyword SAGE / WAITLIST, waitlist expiry 48h, hourly waitlistExpiryCheck workflow (cron `0 * * * *` America/Phoenix).
- Full campaign note: `obdi/03 - Projects/The-Great-Sage-INK-ACCESS-Campaign.md`; platform reference: `obdi/02 - JARVIS-Core/Base44-Platform-Reference.md`.
