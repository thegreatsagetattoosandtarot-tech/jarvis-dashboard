---
name: jarvis-blueprint-model-fixer
description: Blueprint Plugin Model Configurator Skill.
license: MIT License
compatibility: opencode 0.5.0+
metadata:
  opencode/autoinvoke: false
  jarvis/prime: true
---

# Jarvis Blueprint Model Fix Skill

This skill fixes the opencode blueprint plugin that overwrites agent models at load time
with hardcoded paid models (anthropic/claude-opus-4-7, anthropic/claude-sonnet-4-6).
It replaces all hardcoded models with opencode zen free alternatives for local execution.

## Problem
The blueprint plugin's registerAgents() function runs at OpenCode startup and overwrites
config.agent[...] with model: "anthropic/claude-opus-4-7" and model: "anthropic/claude-sonnet-4-6".
These models don't exist in the opencode zen-free environment.

## Fix
Replace all hardcoded models in the plugin's dist/index.js:
- anthropic/claude-opus-4-7 → opencode/deepseek-v4-flash-free
- anthropic/claude-sonnet-4-6 → opencode/nemotron-3.5-lightning-free

## Usage
Run the fixer to patch the plugin dist/index.js. For future sessions, restart OpenCode
to load the patched config.

## Verification
- node -e "require(...)" → "JS parses OK"
- grep confirms 0 anthropic/claude references remain
- The running session still has cached models (startup-loaded); fix applies to future sessions
EOF