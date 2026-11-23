import { NextRequest, NextResponse } from 'next/server';
import { parseNaturalLanguageRates } from '@/lib/rates/rateParser';

export const maxDuration = 10;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { text } = body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please provide rate instruction text to parse.',
          records: [],
        },
        { status: 400 }
      );
    }

    const result = parseNaturalLanguageRates(text);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process natural-language rate instruction.',
        records: [],
      },
      { status: 500 }
    );
  }
}
