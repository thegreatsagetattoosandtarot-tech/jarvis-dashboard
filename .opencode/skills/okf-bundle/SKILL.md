---
name: okf-bundle
description: "okf-bundle. name: okf-bundle"
---

name: okf-bundle
description: Google Open Knowledge Format folder of markdown files YAML front matter root index metadata file progressive disclosure wiki-style links git-native knowledge
license: Apache 2.0
compatibility: opencode
metadata:
  opencode/autoinvoke: false
---
# okf-bundle

## Use when
You need a portable, version-controlled knowledge format that any agent can read without custom integration work, for structured authoritative stable knowledge.

## Do NOT use when
Your knowledge is vast unstructured long-tail content that changes constantly (10M+ documents, support tickets, chat history) — RAG is better for that.

## What OKF Is
- OKF = Open Knowledge Format, published by Google Cloud Data Cloud team June 2026, version 0.1, Apache 2.0, in the "Knowledge Catalog" repo.
- OKF is NOT a product/service/platform/database/runtime. It is a FORMAT: agreed-upon conventions for arranging plain text files in a folder.
- An OKF bundle = directory of markdown files, each with a small YAML front matter block. Each file = one concept (table, metric, dataset, playbook, API). File location in folder = its identifier. Files link to each other like a wiki, forming a graph of connected knowledge.
- The spec reserves two special file names: a root index file (entry point an agent reads first) and a metadata file (describes the bundle). Mandates exactly ONE required field per document: a name for the concept. Everything else (types, tags, link vocabulary, how deep structure goes) left entirely to the producer.
- "If you can cat a file, you can read OKF. If you can git clone a repo, you can ship it."

## Bundle Structure
- **Root index file**: the entry point an agent reads first. Contains links to top-level concepts. Agent starts here, reads only what it needs, follows links deeper only when the task requires it (progressive disclosure).
- **Metadata file**: describes the bundle itself (name, version, description, license, producer, root index filename, list of top-level sections).
- **Concept files**: each markdown file has YAML front matter with at minimum a `name` field. Below that: plain English and markdown describing the concept. Links to related concepts are markdown links.
- **Example layout**:
  ```
  okf-bundle/
  ├── OKF.md            (root index)
  ├── okf-metadata.yaml (bundle metadata)
  ├── customers.md      (concept: customers table)
  ├── orders.md         (concept: orders table)
  └── active-users.md   (concept: metric definition)
  ```

## OKF vs RAG Decision Framework
- **Structured/authoritative/stable knowledge** (relationships, definitions, schemas, how concepts connect) → OKF. An agent that needs to know how tables join, what metrics mean, which runbook to follow does not want fuzzy chunks that mention those things — it wants to walk a clean map.
- **Unstructured/long-tail/churning** (vast archives, 10 years of support tickets, a million-document research archive, every message in company history) → RAG. For finding a specific needle in a massive messy haystack, based on semantic similarity, retrieval is still exactly the right tool.
- **Best systems run BOTH**: OKF gives the agent its map of what's true and how things connect; RAG lets it search the vast archive when it needs a specific fact that isn't on the map. One is the agent's structured memory, the other is its search engine.
- **Git-native benefits**: OKF keeps knowledge in the same version-controlled repo as code. When a developer changes how the orders table works, they update the OKF concept file in the same PR alongside the code change. History/blame/diffs/rollback for free. Vector database drifts out of date the moment someone changes something and forgets to re-index.

## Karpathy's LLM Wiki Insight
- The reason humans abandon personal wikis is the bookkeeping: updating cross-references, keeping links current, editing many files when one fact changes. That bookkeeping is tedious for us and exactly what LLMs are good at. Models don't get bored. They don't forget to update a cross-link. They can edit 40 files in one pass. Patterns already existed under a dozen names: Claude MD, Agents MD files, Obsidian vaults wired to coding agents, metadata as code repositories. OKF's bet: the missing piece was never a smarter database — it was a standard, a shared container, so knowledge written by one producer can be read by any agent without custom integration work.

## How to Create an OKF Bundle Today
1. Create a directory (e.g., `my-knowledge/`).
2. Add a root index file (`OKF.md`) that lists top-level concepts and links to them.
3. Add a metadata file (`okf-metadata.yaml`) with bundle name, version, description, license, producer, root index filename, and top-level sections.
4. For each concept, add a markdown file with YAML front matter (at minimum `name: <concept-name>`) and plain English/markdown description. Add markdown links to related concepts.
5. Point an agent at the root index and test that it can traverse the graph.

## How Agents Use OKF
1. Agent reads the root index file first.
2. Agent follows links to only the concepts it needs for the task (progressive disclosure).
3. Agent reads concept files, follows links to deeper concepts as needed.
4. Agent never loads the entire bundle — only the specific nodes required.

## Why OKF Matters for Agent Systems
- Portability: a bundle built for one agent can be read by any agent without custom integration.
- Version control: knowledge lives alongside code in Git; PRs review knowledge changes alongside code changes.
- Human-readable/editable: it's just markdown and YAML; zero infrastructure, no embedding pipeline, no vector database.
- Stable: for curated, relatively stable knowledge (definitions, schemas, maps), OKF is genuinely better than RAG.

---
Generated from Google OKF vs RAG video (transcript at /tmp/opencode/videos/okf-rag.txt).