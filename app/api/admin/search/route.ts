import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'all';

  if (!q.trim()) {
    return NextResponse.json({ results: [], total: 0 });
  }

  // Simulated server search result for demonstration
  return NextResponse.json({
    query: q,
    filterType: type,
    timestamp: new Date().toISOString(),
    status: 'success',
  });
}
