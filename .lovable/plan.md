

## Problem

The Avivar portal shows a lock icon for user Humberto Clovis because `canAccessModule()` in `ProfileSelector.tsx` requires the user to have at least one `avivar_*:read` permission string. However, there are **zero** `module_permissions` rows for any `avivar_*` module in the database, so this check always fails.

## Solution

Modify the `canAccessModule` logic in `ProfileSelector.tsx` to handle the case where a portal has no module_permissions rows configured yet. If the user has `allowed_portals` access (or profile access) but there are simply no module_permissions rows for that portal prefix, the portal should be **unlocked** (not blocked).

### Change in `src/neohub/pages/ProfileSelector.tsx`

In the `canAccessModule` function (lines 196-208), after confirming `hasBaseAccess`, add a fallback: if no permissions exist at all with the portal prefix (meaning the portal doesn't use granular module permissions), grant access based on `hasBaseAccess` alone.

```typescript
// Current logic (blocks when no permissions exist):
const hasAnyReadableModule = user.permissions.some(p => 
  p.startsWith(portalPrefix) && p.endsWith(':read') && !p.startsWith('neolicense_hotleads')
);
return hasAnyReadableModule;

// New logic: if no permissions are configured for this portal, allow based on portal/profile access
const relevantPermissions = user.permissions.filter(p => 
  p.startsWith(portalPrefix) && !p.startsWith('neolicense_hotleads')
);

// If no module_permissions exist for this portal, trust allowed_portals/profile access
if (relevantPermissions.length === 0) return hasBaseAccess;

// Otherwise, require at least one readable module
return relevantPermissions.some(p => p.endsWith(':read'));
```

This is a single-file change that fixes the issue for Avivar and any future portal that doesn't yet have granular module_permissions configured.

