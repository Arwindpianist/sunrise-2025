# Sunset is not a separate Next.js app

Sunset uses **the same application as Sunrise**: `apps/sunrise-web`.

What differs by brand:

- **Theme**: `data-brand` / `[data-brand="sunset"]` tokens in `packages/ui/src/themes/sunset.css`
- **Wording**: copy paths keyed off `useBrand()` / registry in `@repo/config`
- **Templates**: email and preview variants (e.g. `@repo/marketing` memorial previews)

## How brand is chosen

`getEffectiveBrandId` in `@repo/config` resolves in order:

1. **Hostname** lists: `NEXT_PUBLIC_SUNSET_HOSTS` and `NEXT_PUBLIC_SUNRISE_HOSTS` (comma-separated), when the request `Host` matches.
2. **`NEXT_PUBLIC_BRAND_ID`**: `sunset` or `sunrise` for single-brand deployments.
3. **Local/preview**: `IS_SUNSET` / `NEXT_PUBLIC_IS_SUNSET` (not used in production).
4. Default deployment brand (Sunrise primary).

## Local development

- Sunrise: `pnpm dev` or `pnpm dev:sunrise`
- Sunset preview (same codebase, port 3001): `pnpm dev:sunset`

## Deploy

See **[docs/VERCEL_SUNRISE_SUNSET.md](../../docs/VERCEL_SUNRISE_SUNSET.md)** for full Vercel setup (one project / two domains or two projects).

Quick summary:
