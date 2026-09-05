---
name: harness-quality-gates
description: "harness-quality-gates. name: harness-quality-gates"
---

name: harness-quality-gates
description: Four budgets continuations turns tokens wall-clock quality gate pass gate finishes limit does not imply success immutable base supplemental layer rollback three questions security disposable clones
license: MIT License
compatibility: opencode
metadata:
  opencode/autoinvoke: false
---
# harness-quality-gates

## Use when
You need to run bounded autonomous work with quality gates and want to understand the four independent budgets, gate logic, and the honest audit principle that reaching a limit does not imply task success.

## Do NOT use when
You need a security sandbox — the system runs with your user permissions, not in an isolated sandbox. Use trusted repositories, skills, and extensions only, and run untrusted material in an external sandbox.

## The Four Design Decisions

### Decision 1: One Tool Instead of Many
- The only built-in tool is a persistent Python session (IPython).
- State persists across turns and survives compaction (summarizing old conversation to free up room).
- Composition is free: the model can search a code base, assign the result to a variable, and that variable is still there 20 turns later.
- New capability is a new Python package: the model's decision space stays constant while its actual power grows.
- Trade-off: the agent is now writing and executing arbitrary code as its primary mode of operation.

### Decision 2: Sub-Agents That Never Answer
- The model can spawn child agents from inside the Python session.
- The call returns an admission with a child handle and NEVER returns the child's answer — read that again, it is backwards from every mental model of a function call.
- Children send results as messages when they have something worth sending, or write files.
- The parent's turn can end while the child keeps working — fire and forget lets three children work in parallel while the parent moves on.
- Children inherit the parent's model, provider, tools, skills, session machinery, and scheduling.
- Recursion depth is configurable: children can have children.
- Agents can message each other directly without routing through the parent.
- **Warning**: a system where autonomous processes coordinate without a human in the loop is whose behavior you cannot fully predict by reading any single one of them.

### Decision 3: Self-Improvement With a Safety Boundary
- The continual harness stores supplemental prompts, memories, descriptions of reusable skills, and specifications for reusable sub-agents as durable state that outlives the session.
- **Rollback uses recorded before and after snapshots**: the base system prompt remains immutable. Refinements are supplemental state.
- **The boundary**: the base system prompt, the instructions that define what this agent fundamentally is and won't do, is IMMUTABLE. The self-improvement mechanism has no access to it. Everything the agent learns is written to a supplemental layer that sits on top of a fixed foundation.
- **Failure mode prevented**: an agent that gradually rewrites its own constraints until it isn't the thing you installed is structurally prevented, not merely discouraged.
- **Two layers**: an immutable floor beneath, and a hard ceiling on what refinement is allowed to produce.
- **Learning happens in the middle**: in files you can read with an undo button.

**The three-question audit for any self-improving system**:
1. What can't it edit? (The base system prompt is immutable.)
2. Can you undo it? (Before/after snapshots are recorded; rollback is a documented operation.)
3. Can you read what it learned? (State is in files you can open on your disk.)

### Decision 4: Autonomy With Four Independent Budgets + Quality Gates
- **Autonomous mode starts DISABLED**: you opt in explicitly (the correct default, not universal).
- **Four independent budgets apply simultaneously** with conservative defaults (you've been burned before):
  - **Cap on continuations**: default 3.
  - **Cap on assistant turns**: default 12.
  - **Token budget**: default 80,000 (counts input, output, and cache writes, but excludes cache reads — a precise accounting decision disclosed because nobody else does).
  - **Wall clock limit**: default 30 minutes.
- **Checking order**: continuations, then turns, then tokens, then time.
- **Quality gates**: shell commands that must pass before the run is allowed to finish (test suite, linter, build, repeatable).
- **Gate logic**: a failed gate feeds its output back so the agent can repair the problem. The system avoids rerunning an unchanged failed gate (doesn't burn your budget re-executing something that hasn't changed). Gates have their own retry limit and timeout, both configurable with sensible defaults.
- **The honest principle**: "A past gate checks only what that gate verifies. Reaching a limit does not imply task success." A green test means the test went green, not that the work is correct, complete, or wise. Every one of us has watched an agent make tests pass by weakening the tests.
- **Passing gate outranks resource limits**: if your test passes, you're done, regardless of the clock.

## Security Posture
- **Not a security sandbox**: Prime Agent executes model-generated Python and project commands with your user permissions. Worker and kernel processes improve life-cycle isolation and recovery, but they are not a security sandbox. They are not a security sandbox.
- **Use trusted repositories, instructions, skills, and extensions only**, and run untrusted material in an external sandbox.
- **Quick start**: point at a disposable clone or a clean work tree, something you can inspect and restore.
- **Skills**: can instruct the model to perform any action and may include executable code the model invokes. Review skill content before use.

---
Generated from the most-starred GitHub coding agent video (transcript at /tmp/opencode/videos/self-editing-agent.txt).