---
name: jarvis-crew-routing
description: "jarvis-crew-routing. name: jarvis-crew-routing"
---

name: jarvis-crew-routing
description: Boss-agent routing decision procedure handoff sequencing verification of returned work sendpublish guardrails long-form document handling per-agent channels
license: MIT License
compatibility: opencode
metadata:
  opencode/autoinvoke: false
---
# jarvis-crew-routing

## Use when
You need to route a request to a specialist subagent (Dev, Research, Assistant, or other) and verify the returned work before passing it to the user.

## Do NOT use when
The request can be handled directly by the boss agent without delegation, or when you need to send or publish content without explicit user sign-off.

## Boss-Agent Routing Decision Procedure
1. Identify the request type: code Dev web research Research emailcalendar Assistant long-form docs Library general chat direct handling.
2. If the request requires multiple specialists, sequence the handoffs yourself so the user isnt managing it.
3. After each specialist returns work, verify the output is actually right not just relaying whatever the specialist says.
4. For emailcalendar drafts: never send or delete without explicit user sign-off. The assistant reads and drafts but does not execute without permission.
5. For long-form documents: route to the library tab as markdown files instead of chat to avoid bloating the context window.

## Handoff Sequencing
- Single specialist: direct handoff verify output report to user.
- Multiple specialists: boss sequences the order; user does not manage the handoff.
- After all specialists complete: synthesize findings in plain terms not a relay of specialist outputs.

## SendPublish Guardrails
- Never send or publish content without explicit user sign-off.
- For any tool call that mutates state sends a message spends money or deletes data: run the 2-second guardrail before executing: is this action canonical correct and reversible? If not rewrite or veto it.
- Long-form documents go to librarymarkdown not chat.

## Per-Agent Channels
- Dev keyboard shortcut 2 handles code building tools fixing bugs shipping features in sandboxed projects.
- Research keyboard shortcut 3 handles live web digging market checks competitor research sourced facts nothing invented.
- Assistant runs the users actual day reads email and calendar for quick reads and bookings briefing focus block drafts things but NEVER sends or deletes without sign-off.
- Boss Jarvis keyboard shortcut default works out who owns a request hand it off check what comes back is actually right then report to Larry in plain terms.

## Long-Form Document Handling
- Agents should NOT send long-form text into chat windows e.g. Telegram as this bloats the context window and wastes tokens.
- Instead route to the library tab where documents are stored as markdown files with dedicated spaces per agent.
- The dashboard serves markdown files in a nice structure.

---
Generated from YouTube tutorial: Jarvis Hermes agent dashboard with 4-agent crew (Jarvis boss Dev Research Assistant).