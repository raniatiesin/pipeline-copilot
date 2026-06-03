# System Harmony Implementation

## Status

- Phase: 1 (audit instrumentation + repo-wide ledger)
- Canonical flow: module flow (`app/style-matcher`, `app/scene-segmentation`, `app/project`)
- Reference-only subtree: `neobrutalist-ui-design/`
- Vendor-only subtree: `assets/images/neo-scroll-master-main/`
- Contract mismatch policy: neutral reporting (`runtime` vs `SQL/docs` both tracked)

## Implemented in this phase

1. Added automated workspace audit script: `scripts/system-audit.mjs`
2. Added npm command: `npm run audit:system`
3. Audit outputs generated under `dist/audit/`:
   - `system-audit.json` (file-level ledger)
   - `system-audit.md` (summary)

## What the audit currently captures

- Full file manifest for runtime + docs + boundary trees
- Per-file role/layer classification
- Import/dependent graph relations
- Internal unresolved edge detection
- Drift markers: `@ts-ignore/@ts-expect-error`, `as any`, hardcoded color literals
- Risk scoring buckets and top-risk shortlist

## How to run

```bash
npm run audit:system
```

## Output contract

- `dist/audit/system-audit.json`
  - `summary`: totals, relationship counts, unresolved count, risk buckets
  - `files`: each file with imports, dependents, analysis, and risk
- `dist/audit/system-audit.md`
  - human-readable snapshot for quick triage

## Next implementation phases

### Phase 2 — Contract alignment engine

- Route/type parity checks (`app/**` vs `types/navigation.ts`)
- API/schema parity checks (`lib/api/**` vs `supabase-schema.sql` + docs)
- Barrel usage and dead-export detection (`**/index.ts`)

### Phase 3 — Override harmonization

- Token compliance scanner for `components/**` and `app/**`
- Shared primitive migration map (small/big pills, typography, shadows)
- Layering rule checks (`types -> constants -> lib -> hooks -> components -> app`)

### Phase 4 — Controlled remediation

- Priority-ordered fixes by severity and blast radius
- Regression gate in CI via audit command
- Documentation sync pass (`ARCHITECTURE.md`, `README.md`, module status docs)

## Working rule

No “local fix only” merges: each change must either reduce cross-file drift or explicitly document why divergence is intentional.
