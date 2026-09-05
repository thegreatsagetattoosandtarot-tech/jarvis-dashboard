---
name: vault-rag
description: "vault-rag. name: vault-rag"
---

name: vault-rag
description: SQLite FTS5 keyword search hybrid vector retrieval 5-second recall timeout long-tail unstructured RAG OKF structured curated philosophy plain files inspectable versionable yours
license: MIT License
compatibility: opencode
metadata:
  opencode/autoinvoke: false
---
# vault-rag

## Use when
You need to retrieve specific facts from a large, unstructured, or constantly changing knowledge base (10 years of support tickets, a million-document research archive, every message in a company's history) and close enough is acceptable rather than one true authoritative definition.

## Do NOT use when
Your knowledge is structured, authoritative, and relatively stable (definitions, schemas, relationships, how concepts connect) — OKF is better for that, and you should run both OKF and RAG together.

## What RAG Is and When It Wins
- RAG = retrieval augmented generation. Chop documents into chunks, embed each chunk into a vector space (using an embedding model), store all vectors in a vector database (Pinecone, Qdrant, etc.). When a user asks a question, embed the question into the same space, ask the database which chunks are nearest to the question, return the top few closest matches, staple them into the model's prompt, and the model answers using them.
- RAG's home turf: vast unstructured long-tail content that changes constantly. 10 years of support tickets, a million-document research archive, every message in a company's history. You would never hand-curate a clean markdown concept file for each of 10 million documents, and you wouldn't want to.
- RAG weaknesses: retrieves by similarity not by truth (might give you three paragraphs that mention refunds but miss the one authoritative rule); chunking mangles structure (table separated from its definition, step 3 of a runbook divorced from step 1); heavy pipeline to build and maintain (embedding models, vector database, chunking strategy, re-ranking step, infrastructure that has to be fed and watered forever); opaque (when RAG gives a wrong answer, figuring out why the right chunk didn't surface is genuinely painful).

## SQLite FTS5 Setup Over Markdown Vault
- **Prerequisites**: sqlite3 CLI installed; vault is a directory of markdown files.
- **Build FTS5 index**: `sqlite3 vault.db "CREATE VIRTUAL TABLE docs USING FTS5(content);"`, then `sqlite3 vault.db "INSERT INTO docs(rowid, content) SELECT rowid, readfile(path) FROM (SELECT rowid, '/path/to/vault/' || name FROM vault_files);` — this indexes all markdown content.
- **Keyword query**: `sqlite3 vault.db "SELECT readfile(rowid) FROM docs WHERE docs MATCH 'your search terms';"` — returns the raw markdown content of matching chunks.
- **Hybrid approach**: keyword search (FTS5) for exact/filtered matches, then optional vector similarity for semantic fallback if an embedding model is available.

## The 5-Second Recall Timeout Rule
- The recall step has a 5-second timeout. When exceeded, recall is skipped with a warning rather than stalling your turn.
- "Memory that can only ever slow you down by 5 seconds is memory you can trust in a workflow."
- This prevents memory injection from shifting the prompt prefix and breaking provider prompt-caching.
- **General fix**: keep the injected block as stable as possible; put volatile recall later in the prompt.
- **Caching bill problem**: every serious API provider discounts repeated prompt prefixes. Identical opening tokens get cached at a fraction of the price. Memory injection writes recalled memories into the front of the prompt; as the conversation moves, the recall changes, the prefix shifts, and the cache stops hitting — some fraction of token savings walks back out the door as full-price tokens.

## When to Use RAG vs OKF vs Plain grep
- **Use RAG when**: knowledge is vast unstructured long-tail, constantly changing, close-enough-rather-than-authoritative is fine.
- **Use OKF when**: knowledge is structured authoritative stable (definitions schemas relationships how concepts connect), you need the one true definition, curated by hand.
- **Use plain grep/ripgrep when**: quick one-off search, no indexing infrastructure desired, knowledge base is small enough to scan quickly.
- **Best practice**: run both OKF (for structured curated knowledge) and RAG (for long-tail lookup). OKF gives the agent its map of what's true and how things connect; RAG lets it search the vast archive when it needs a specific fact not on the map.

## Plain Files on Disk Are Inspectable Versionable Yours
- The default backend is SQLite with a vector extension running on your machine. Zero configuration, no API key for storage, no vendor endpoint, nothing leaves the laptop unless you point it somewhere.
- Every layer is a file you can open: persona = markdown, scenes = markdown, task canvas = mermaid diagram.
- When recall goes wrong, you read the actual artifact instead of squinting at similarity scores.
- Plain files are inspectable, versionable, and yours — not held hostage on a server.

---
Generated from OKF vs RAG and Agent Memory videos (transcripts at /tmp/opencode/videos/okf-rag.txt and /tmp/opencode/videos/agent-memory.txt).