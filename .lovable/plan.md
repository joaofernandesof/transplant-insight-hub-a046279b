

## Plan: Reorder Dates & Add Month/All Filters

### What Changes

**1. Date Ordering (lines 313-334 in ClinicDashboard.tsx)**
Replace current sort logic with: today first, then future dates ascending, then past dates ascending. This ensures the agenda always starts at "today" and wraps around.

```
Sort key: 
  - If date >= today → priority 0, sort by date ascending
  - If date < today → priority 1, sort by date ascending
  - Within same date, sort by surgeryTime
```

**2. New Period Filter Buttons**
Change the default `selectedPeriod` from `'this-week'` to `'this-month'` (line 103). The existing period selector already has `'this-month'` and `'all'` options — no new filter values needed, just changing the default.

**3. Add Prominent Toggle Buttons**
Add two quick-access buttons ("Mês Atual" / "Todo o Período") in the header area near the existing period selector, making it easy to switch between the two most common views without opening the dropdown.

### Files Modified
- `src/clinic/pages/ClinicDashboard.tsx` — sort logic, default period, add toggle buttons

### What Does NOT Change
- No layout changes beyond the two new buttons
- All existing filters, KPIs, tabs, dialogs remain untouched

