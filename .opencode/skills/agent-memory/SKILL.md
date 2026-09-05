---
name: agent-memory
description: "agent-memory. name: agent-memory"
---

name: agent-memory
description: Symbolic short-term memory mermaid offloading ID file fetch threshold compression L0-L3 pyramid 5-second timeout memory poisoning audit
license: MIT License
compatibility: opencode
metadata:
  opencode/autoinvoke: false
---
# agent-memory

## Use when
You need to manage agent memory across long sessions, offload tool outputs to structured artifacts, and maintain a four-layer long-term memory pyramid that preserves evidence and structure without bloating the context window.

## Do NOT use when
You want a plug-and-play memory system with no maintenance overhead — this requires periodic audit and redistillation.

## Why Agents Forget
- Between turns an agent remembers nothing; the loop pastes the entire history back every turn.
- One benchmark session of 200 questions burned 221 million tokens.
- Context rot research: accuracy falls long before the window is full across 18 frontier models. "More room is the problem."
- The hoarding strategy fails on cost and accuracy simultaneously: billions of tokens at scale, and all that text makes the model worse (30-50% accuracy degradation well below the advertised window size).

## Idea 1: Symbolic Short-Term Memory
- Full tool outputs get moved OUT of the prompt entirely, written to markdown files on disk.
- What stays in context is a mermaid graph (boxes and arrows as plain text) of what happened.
- Hundreds of thousands of tokens of log collapse into a few hundred tokens of shape.
- **Every node carries an ID pointing back to the raw file**: when the agent needs the actual stack trace, it fetches by ID, and the full text comes back. This is a FOLDED MAP you can open again, not a one-way summary.
- **Compression is threshold-driven**: at 50% of the context window it compresses mildly; at 85% aggressively. Both are right there as defaults in the config file.
- **The diagram itself is capped at 20% of the token budget, with a 4,000 character ceiling on the canvas**: the map can never eat the room it's saving.
- **This differs from summarization**: a summary is one-way, detail is gone. This is a folded map you can open again.

## Idea 2: Four-Layer Long-Term Pyramid
- **L0: Raw conversation**: everything exactly as said. The long-term side is Tulving's arrow.
- **L1: Atoms**: a fact, a preference, a constraint. Extracted from raw conversation.
- **L2: Scenes**: groups of atoms into this project, this recurring kind of task.
- **L3: Persona**: habits, conventions, defaults. **Rebuilt from scratch every 50 new memories** (consolidation implemented literally). Your profile isn't an append-only pile; it's periodically redistilled, which is consolidation literally implemented.
- **Recall runs top-down**: persona first (cheap and usually enough), down to atoms when a specific fact matters, all the way to the raw conversation only when exact wording counts.
- **Principle**: "Lower layers preserve evidence, upper layers preserve structure." This is the best one-sentence summary of where all serious memory work is converging.
- **Vendor benchmark**: multi-session test where a user's preferences change over time; reported jump from 48% to 76% pass rate with memory vs without.

## Plumbing: SQLite + Vector, Hybrid Search
- **Default backend**: SQLite with vector extension, running on your machine. Zero configuration, no API key for storage, no vendor endpoint, nothing leaves the laptop unless you point it somewhere.
- **Retrieval**: hybrid keyword search plus vector search.
- **Defensive detail**: the recall step has a 5-second timeout and when it's exceeded, recall is skipped with a warning rather than stalling your turn. "Memory that can only ever slow you down by 5 seconds is memory you can trust in a workflow."
- **Every layer is a file you can open**: persona = markdown, scenes = markdown, task canvas = mermaid diagram.

## Memory as Shared Assets (V2)
- **Chat memory**: transient per-session memory.
- **Skills**: not prompt snippets; repository ships skill definition files with versions, resources, trigger boundaries, execution steps, validation rules. Generated from the agent's own successful runs — the agent does a task well, the system distills the winning procedure into a versioned skill, and the skill becomes reusable.
- **Wiki**: markdown entity pages that an agent writes and maintains, link to each other, so knowledge compounds between sessions instead of evaporating.
- **Code graph**: indexes how a code base actually connects, so an agent starts a task already knowing the structure instead of rediscovering it (precisely the rediscovery that was costing billions of tokens).
- **Cold start**: point the system at an existing repository, folder of documentation, or old agent sessions, and it backfills the graph, the wiki, and the skills before your new agent has done a single thing. This flips the adoption economics: memory systems normally have a cold start problem; they're useless until they've watched you for weeks.

## Two Problems Nobody Puts in the Headline

### Problem 1: The Caching Bill
- Every serious API provider discounts repeated prompt prefixes. Identical opening tokens get cached at a fraction of the price.
- Memory injection writes recalled memories into the front of your prompt. As the conversation moves, the recall changes, the prefix shifts, and the cache stops hitting — some fraction of your token savings walks back out the door as full price tokens.
- **General fix**: keep the injected block as stable as possible; put volatile recall later in the prompt.
- **This number exists nowhere in benchmarks** because benchmarks don't have billing accounts.

### Problem 2: Memory Is an Attack Surface
- Anything your agent reads can now write itself into what your agent permanently believes.
- A malicious string in a scraped page or a poisoned document doesn't have to win in the current session anymore. If it gets extracted as an atom and consolidated into a scene, it's waiting for you next week with the provenance fading at the rate the architecture is designed to fade it.
- **The layered design helps**: deterministic path from any distilled memory back to the raw conversation that produced it. So poisoning is auditable in a way flat vector stores aren't.
- **But auditable in principle only matters if you occasionally audit**: "Read your agent's diary once in a while." The persona and scenes are markdown files.
- **Responsible design**: shared assets carry owners, versions, and permissions. Private by default, shared with a team only after review. Whether that review step is used well is up to the teams deploying it, but the fact that sharing an agent-generated skill requires a human gate is exactly the supply chain lesson from the skills video learned in advance rather than after an incident.

---
Generated from the agent memory plugin video (transcript at /tmp/opencode/videos/agent-memory.txt).