---
description: PID steering loop for intent convergence
---

Run a mathematically grounded PID guidance step over the current answer quality vs user intent.

## Inputs

- Intent (target): `{{args}}` if provided, otherwise request it.
- Current result: use the latest assistant draft or ask the user to paste the draft.

## Procedure

1. Convert intent + current result into an objective score using:
   - coverage (intent tokens found in result),
   - precision (result relevance to intent),
   - structure alignment.
2. Compute error as `e_k = 1 - score_k`.
3. Apply PID control law with discrete-time update:
   - `u_k = Kp*e_k + Ki*sum(e_i*dt) + Kd*(e_k-e_{k-1})/dt`
   - derivative low-pass filtering
   - anti-windup via output saturation.
4. Map control output magnitude to guidance mode:
   - high -> aggressive re-plan
   - medium -> balanced correction
   - low -> fine polish.
5. Persist controller state in `.pid-runtime/state.json`.

## Execution

Use the local harness:

`npm run dev -- intent --intent "<intent>" --result "<result>"`

Then report:

- score and distance,
- PID output and mode,
- three concrete next-step steering actions.
