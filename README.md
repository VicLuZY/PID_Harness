# PID Harness (GSD-2-Inspired)

This repository contains a lightweight harness inspired by GSD-2's CLI/runtime shape, centered on PID control behavior for both simulated plants and intent-alignment steering.

## What it includes

- A reusable PID controller with:
  - P/I/D terms
  - derivative low-pass filtering
  - simple anti-windup via saturation-aware integration
- A plant simulation harness (`run`) with configurable profiles
- Runtime state persistence (`status`) in `.pid-runtime/state.json`
- Intent-distance PID evaluator (`intent`) that compares current output to target intent and produces control-theoretic guidance

## Quickstart

```bash
npm install
npm run dev -- run --ticks 120 --setpoint 10 --profile stable
npm run dev -- status
npm run dev -- intent --intent "build a secure REST endpoint" --result "added route and auth middleware"
```

## Commands

- `run`: Executes a control-loop simulation and records run metadata.
- `status`: Shows run count and last simulation quality stats.
- `intent`: Computes intent distance and applies a discrete PID control step to generate next-action guidance.

## Why "GSD-2-inspired"?

The structure mirrors a compact agent-style CLI flow:

- `src/cli.ts` command dispatcher
- `src/commands/*` command handlers
- `src/runtime/*` persisted execution state
- `src/core/*` domain primitives (PID)

This keeps the harness easy to extend into multi-command orchestration later.

## Cursor Slash Command

A slash command is included at `.cursor/commands/pid-harness.md`.

Use it in Cursor as:

- `/pid-harness <user intent>`

The command runs an intent-evaluation loop grounded in:

- Objective score: `J = w_c*C + w_p*P + w_s*S`
- Distance error: `e_k = 1 - J_k`
- PID control: `u_k = Kp*e_k + Ki*Σ(e_i dt) + Kd*(de_k/dt)`

with derivative filtering and saturation-aware anti-windup to keep guidance stable.
