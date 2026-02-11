import { NextResponse } from 'next/server';

export const revalidate = 900; // ISR: cache for 15 minutes

const TIMEOUT_MS = 10_000;

export async function GET() {
  // Public Octopus Energy Agile tariff identifiers — hardcoded as they're
  // non-secret defaults from the Octopus API docs, not per-environment config.
  const product = 'AGILE-24-10-01';
  const region = 'L';

  const now = new Date();
  const periodFrom = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1),
  );
  const periodTo = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 2),
  );

  const url = new URL(
    `https://api.octopus.energy/v1/products/${product}/electricity-tariffs/E-1R-${product}-${region}/standard-unit-rates/`,
  );
  url.searchParams.set('period_from', periodFrom.toISOString());
  url.searchParams.set('period_to', periodTo.toISOString());
  url.searchParams.set('page_size', '200');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      next: { revalidate: 900 },
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    const isTimeout = err instanceof DOMException && err.name === 'AbortError';
    return NextResponse.json(
      { error: isTimeout ? 'Upstream request timed out' : 'Failed to reach upstream API' },
      { status: 504 },
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!upstream.ok) {
    return NextResponse.json(
      { error: `Upstream API returned ${upstream.status}` },
      { status: upstream.status },
    );
  }

  let data: unknown;
  try {
    data = await upstream.json();
  } catch {
    return NextResponse.json(
      { error: 'Upstream returned invalid JSON' },
      { status: 502 },
    );
  }

  return NextResponse.json(data);
}
