

## Plan: Always Show "Aula Anterior" and "Próxima Aula" with Titles

### Current State
The lesson navigation footer (lines 337-372) already shows prev/next buttons with lesson titles, but:
- On mobile (`sm:hidden`), it only shows "Anterior" / "Próxima" without titles
- The labels don't include "Aula Anterior:" / "Próxima Aula:" prefix

### Changes
**File: `src/neoacademy/pages/NeoAcademyLesson.tsx`** (lines 337-371)

Update the navigation footer to always display full labels with titles:

- **Previous button**: Show `← Aula Anterior: {title}` (always visible, not hidden on mobile). Remove the `hidden sm:inline` / `sm:hidden` split — always show title with truncation.
- **Next button**: Show `Próxima Aula: {title} →` (same approach).
- Both should truncate long titles with `max-w-[200px] truncate` on all screen sizes.
- Keep the `{currentIndex + 1} / {totalLessons}` counter in the center.
- When there's no previous/next lesson, show empty div as spacer (already done).

