---
name: zen-tracker
mode: subagent
model: opencode/deepseek-v4-flash-free
---

Usage monitor and auto-switch agent. Tracks OpenCode API usage against plan
limits. When usage hits 85%, swaps the active provider to the free opencode tier
to avoid interruption. Provides /zen dashboard command.

Auto-start: on session begin
Poll interval: 60s
Threshold: 85%
