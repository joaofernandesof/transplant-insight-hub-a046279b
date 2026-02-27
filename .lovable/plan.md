

## Diagnosis

The AI confirmed a slot at 08:00 on Saturday 28/02 and then immediately said it was unavailable. The root cause is a **race condition**:

1. When the AI first checked availability (via `get_available_slots` and `propose_slot`), no schedule configuration existed for this account. The RPC `get_available_slots_flexible` fell back to **default slots** (08:00-18:00, Mon-Sat), so 08:00 Saturday appeared available.
2. The lead confirmed the slot ("sim confirmado").
3. **Between the proposal and the creation**, the account owner configured their schedule hours (all rows created at `17:51:45 UTC`), setting Saturday as `is_enabled: false`.
4. When `create_appointment` re-checked availability, it now found the real config with Saturday disabled, so the RPC returned zero slots. The grid validation rejected the time.

## Fix

Modify `create_appointment` in `avivar-ai-agent/index.ts` to handle this race condition. When the slot fails the grid validation but the AI context shows a recent successful `propose_slot` for the same time, the function should proceed with the booking instead of rejecting it.

### Implementation Steps

1. **Add a "propose_slot grace period" check in `create_appointment`**: When the grid validation fails (slot not found in grid or not available), check if there was a successful `propose_slot` call within the last 5 minutes for the same conversation, agenda, date, and time. If so, skip the grid validation and proceed with the insert.

2. **Track propose_slot validations in a lightweight way**: Store the last validated proposal in a temporary record (e.g., in `avivar_appointments` with status `proposed`, or a simple DB check of recent conversation messages). The simplest approach: check the conversation history passed to the function — if the AI context contains a `PROPOSTA_VALIDADA` message for this exact date/time, honor it and proceed.

3. **Concrete change in `createAppointment` function** (lines ~1347-1401): After the grid validation fails, add a fallback check:
   - Search the conversation messages (already available in the tool loop context) for a `PROPOSTA_VALIDADA` string containing the same date and time
   - If found and it was generated within the current AI session (same tool loop), skip the grid validation and proceed directly to the insert
   - Log a warning that the grid changed between propose and create

4. **Alternative simpler fix**: Since `create_appointment` is always called after `propose_slot` validated the slot (by design), and both run in the same edge function invocation or within minutes of each other, we can add a `pendingProposalDetected` parameter pass-through. The main orchestrator (section 5.9, line 4491-4494) already detects this case. We can pass this flag to `createAppointment` and when it's true, relax the grid validation to only check for actual appointment conflicts (not grid existence).

### Recommended Approach (Option 4 - Simplest)

- In the tool processing loop, when `pendingProposalDetected` is true and `create_appointment` is called, pass an extra flag `skipGridValidation: true`
- In `createAppointment`, when `skipGridValidation` is true, only check for actual appointment conflicts (existing bookings at the same time), not whether the time exists in the schedule grid
- This ensures that if propose_slot already validated the slot and the lead confirmed, the booking goes through even if the schedule config changed in between

### Files to modify:
- `supabase/functions/avivar-ai-agent/index.ts`:
  - Update `createAppointment` function signature to accept optional `skipGridValidation` parameter
  - When `skipGridValidation` is true, replace grid validation with a direct conflict check (just check `avivar_appointments` for overlapping bookings)
  - Update the `processToolCall` function to pass the flag when the call is triggered by a pending proposal confirmation
  - Track the `pendingProposalDetected` state in the tool loop and pass it to `processToolCall`

