---
name: local-ai-sizing
description: "local-ai-sizing. name: local-ai-sizing"
---

name: local-ai-sizing
description: Three sizing rules memory active-vs-total quantization 5 tiers buying guide memory bandwidth truth teller 10-second layer readout
license: MIT License
compatibility: opencode
metadata:
  opencode/autoinvoke: false
---
# local-ai-sizing

## Use when
You need to pick the right local AI model for your machine and understand the trade-offs between model size, hardware capacity, and performance.

## Do NOT use when
You want to run the absolute frontier models at the hardest tasks (subtle reasoning, huge ambiguous problems) — the very best closed APIs are still better, and local AI handles the 80% daily use case.

## The Three Rules

### Rule 1: Memory Rule
At standard 4-bit quantization, a model needs roughly half its parameter count in gigabytes of RAM/GVRAM.
- 7B parameter model → ~4-5 GB
- 14B parameter model → ~8-9 GB
- 32B parameter model → ~20 GB
- Model + operating system + browser must all fit within total available memory.
- 8 GB laptop tops out around 7B models.
- 16 GB gets you comfortably to 14B.
- 24+ GB opens the 30B class.

### Rule 2: Active vs Total (MoE Loophole)
- **Total parameters** determine how much memory you need to hold the model.
- **Active parameters** (in Mixture-of-Experts models) determine how much compute each token costs = speed.
- Example: 118B total parameters / 8B active = needs big memory but runs like a small model.
- When you see 118B parameters, 8B active: read it as needs big memory, runs like a small model.

### Rule 3: Quantization in 1 Minute
- Models trained in high precision (16 bits per number).
- Quantization stores numbers in fewer bits (8, 5, 4) shrinking file and memory footprint dramatically.
- Q4 (4-bit) is the sweet spot: small quality loss for most models and most uses, standard assumption for the memory rule.
- Below Q4: Q3, Q2 = degradation gets real and noticeable.
- Some 2026 models are trained knowing they'll live at 4-bit (quantization-aware training), making their Q4 versions nearly lossless.
- Q2 is desperation.

## Five Hardware Tiers

### Tier 0: No GPU, 8 GB RAM (Floor)
- **Class**: 3-8B parameter models (Llama 3.2, small Qwen, Gemma models).
- **Performance**: ~10 tokens/sec on pure CPU = reading pace, fine for chat, tedious for long generations.
- **Good for**: Summarizing documents, drafting/rewriting emails, answering general questions, explaining code, simple scripts, translation, brainstorming, daily driver tasks.
- **Not good for**: Deep multi-step reasoning, big coding tasks across many files, subtle judgment calls.
- **Coding pick**: Small Qwen coding variant; useful for single-file scripts, explanations, auto-complete style help.
- **Key insight**: If on a desktop, the single best upgrade per dollar is cheap RAM. 16 GB changes your life here.

### Tier 1: 16 GB (Comfort Zone)
- **Class**: 13-14B parameter models. The step up from 7B is bigger than the number suggests.
- **Noticeably better**: reasoning, longer coherent outputs, fewer facepalm mistakes.
- **All-rounder**: Qwen 14B = reliable workhorse, strong at general work, competent at code, multilingual, well-supported everywhere.
- **Mac note**: Apple silicon uses unified memory (CPU and GPU share one pool). A 16 GB MacBook Air punches above a Windows laptop with a small dedicated GPU. A 24 or 32 GB Mac quietly plays in the next tier up. Mentally promote yourself half a tier if you own an M-series Mac.
- **Coding pick**: 14B coding variants = solid junior developer who occasionally needs correcting.
- **Performance**: 30-60+ tokens/sec with GPU/Apple Silicon = faster than reading = genuinely fluid experience.
- **Honest framing**: This is the tier where a meaningful number of people can cancel a subscription for routine AI use and feel nothing.

### Tier 2: 24 GB GPU / 32-48 GB Mac (Enthusiast)
- **Class**: 27-32B parameter models.
- **Headline resident**: Bonzai 27B; alongside Qwen 27 and 32B class models.
- **Trust radius expands**: tasks you comfortably hand a 32B expand into real work — multi-file coding, long document analysis, serious writing, agent workflows with tools.
- **Mistakes still happen** but are the kind a quick review catches, not the kind that quietly ruins an afternoon.
- **Coding pick**: 32B coding models = current sweet spot of local coding per dollar of hardware.
- **Workflow insight**: This is the tier where pairing a local model with agent tooling (coding CLI, review tool, proper skills) turns a model into a setup. The model is the engine; the tooling is the car.
- **MoE loophole kicks in**: Laguna S 2.1 (118B total / 8B active) and DeepSeek-V4-Flash (284B total / 13B active) at 4-bit precision.

### Tier 3: Workstation Class (48-100s GB)
- **Class**: 48 GB to a few hundred GB (DGX Spark class desktop box, multi-GPU rig, top-end Mac Studio).
- **Serious hardware**: desk hardware, not data center hardware.
- **MoE monsters**: Laguna S 2.1 (118B total / 8B active) runs on a single DGX Spark; at 4-bit it runs on published benchmarks trading blows with models many times its size on agentic coding. Frontier-adjacent coding model on one box under your desk with a permissive license.
- **DeepSeek-V4-Flash**: 284B total / 13B active at 4-bit; genuinely viable on high-end consumer setups; 1M token context window MIT license; community deployments on Spark class hardware within days of release.
- **For roughly the cost of a used car**: individual or small team can run coding models that compete with frontier APIs privately with zero per-token cost forever.
- **Coding pick**: Coin flip between Laguna (if agentic coding benchmarks sway you) and V4-Flash (if you want giant context and absolute lowest cost lineage).
- **Recommendation**: Run both and let your own code base vote.

### Tier 4: The Ceiling
- **GLM-5.2**: 744B parameters, MIT licensed; sparse MoE; tool like Colibri keeps a small core resident and streams active experts off a fast SSD on demand. Slowly yes but actually working also yes. If you have a fast SSD and patience, the ceiling is available to you today at almost any hardware tier as an experience and education.
- **Kimmy K3**: 2.8 trillion parameters, largest open model ever; 16 of 896 experts active = most extreme sparsity ratio yet; great open question for the streaming crowd; whether K3 can be coaxed onto enthusiast hardware through streaming is the frontier experiment.
- **Not practical for daily use** but important for understanding where the field is going.

## The 10-Second Truth Teller
When you load a model in Ollama or llama.cpp, watch the startup output. It tells you exactly how many of the model's layers loaded onto your GPU versus spilled to CPU.
- **Most or all layers on GPU**: golden, it'll fly.
- **Half or fewer layers on GPU**: the model is too big for your memory and it will crawl.
- **Method**: start one size below where the memory rule says you can go, confirm it's fast, then step up. Upgrading is one command. Unfreezing a swamped laptop is an afternoon.

## Buying Guide (in One Sentence)
Prioritize memory capacity first, memory bandwidth second, and raw compute third.

## Budget Advice
- **Budget zero**: spend nothing; run the best model your current tier allows; get fluent with the tools; the models at your tier will be meaningfully better in 3 months without touching your wallet. Most people should start here and many should stay.
- **Budget modest**: if on a desktop at tier 0, cheap RAM to 16 or 32 GB is the biggest jump per dollar in this entire video. If you want GPU acceleration, the community's open secret remains the used previous-generation 24 GB cards (RTX 3090 delivers tier two local AI at a fraction of new card prices). Memory capacity beats GPU generation for this workload almost every time.
- **Budget serious**: choosing between a high-memory Mac and a Spark class AI workstation. Mac is the better general machine that happens to be excellent at local AI with unified memory doing heavy lifting and a silent efficient box on your desk. Dedicated AI workstation is the better local AI machine, period; it unlocks tier three's MoE monsters at full speed. If local models are a feature of your life, buy the Mac. If they're the point, buy the workstation. Prioritize memory capacity first, memory bandwidth second, raw compute third.

## Tools
- **Ollama**: start here; full tutorial covers it end to end.
- **LM Studio**: graduate to if you want a friendly interface with fine-grain control.
- **vLLM**: reach for when serving a model to more than just yourself.
- **Speed bands**: pure CPU on small model ~10 tokens/sec (fine for chat, tedious for long generations). Properly GPU-loaded model at right tier 30-60+ tokens/sec (faster than reading). Workstation monsters tuned comfortably usable for agent work where the model reasons and calls tools in bursts.

---
Generated from "Complete Map of Local AI in 2026" video (transcript at /tmp/opencode/videos/local-ai.txt).