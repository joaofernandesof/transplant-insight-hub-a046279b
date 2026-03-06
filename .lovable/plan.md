

## Plan: Remove "Comunidade" and "Chat" modules from NeoAcademy

### Changes

1. **`src/neoacademy/components/NeoAcademySidebar.tsx`** — Remove the two nav items (`Comunidade` and `Chat`) from `NAV_ITEMS` array (lines 21-22). Remove unused `MessageCircle` and `Users` icon imports.

2. **`src/App.tsx`** — Remove the following routes and lazy imports:
   - Lazy import: `NeoAcademyCommunity` (line 607)
   - Route: `community` (line 633)
   - Routes: `chat` and `chat/:recipientId` (lines 641-642)

3. **`src/neohub/lib/permissions.ts`** — Remove the `neoacademy_community` entry (line 164).

4. **`src/neoacademy/pages/NeoAcademyCommunity.tsx`** — Delete this file.

