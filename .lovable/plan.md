

## Bug: Off-by-one in fluxo media step calculation

### Problem
The edge function logs confirm:
```
15:35:49 — Processing: "oi" (1st user msg)
15:36:44 — Processing: "Lucas" (2nd user msg)
15:36:49 — FALLBACK: Auto-sending fluxo media for step 2 (id="qualificacao")
```

When processing "Lucas", there are 2 user messages in the DB (including "Lucas" itself). The code sets `currentStepIndex = userMessageCount = 2`, which maps to step 3 (Qualificação, index 2). The correct step is index 1 (Identificação e Interesse).

The correct mapping is:
- "oi" (userMsgCount=1) → step index 0 (Saudação)
- "Lucas" (userMsgCount=2) → step index 1 (Identificação)
- 3rd msg (userMsgCount=3) → step index 2 (Qualificação)

### Fix

Two locations in `supabase/functions/avivar-ai-agent/index.ts`:

1. **Guard (line 3342)**: Change `maxAllowedIndex = userMsgCount` to `maxAllowedIndex = userMsgCount - 1`

2. **Fallback (line 5237)**: Change `currentStepIndex = userMessageCount` to `currentStepIndex = userMessageCount - 1`

Both changes subtract 1 to account for the fact that the current inbound message is already saved in the database before the agent processes it.

### Impact
- Media will only be sent for the correct step matching the conversation progress
- No other behavior is affected

