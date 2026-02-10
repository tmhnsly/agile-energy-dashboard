import { NextResponse } from 'next/server';

export const revalidate = 900; // ISR: cache for 15 minutes

export async function GET() {
  const product = process.env.OCTOPUS_PRODUCT_CODE ?? 'AGILE-24-10-01';
  const region = process.env.OCTOPUS_REGION ?? 'L';

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

  const upstream = await fetch(url, { next: { revalidate: 900 } });

  if (!upstream.ok) {
    return NextResponse.json(
      { error: 'Upstream API error' },
      { status: upstream.status },
    );
  }

  const data = await upstream.json();
  return NextResponse.json(data);
}
