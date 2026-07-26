import { NextRequest, NextResponse } from "next/server";
import { updateDocument, increment } from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/utils/constants";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { locationId } = body;

    if (!locationId) {
      return NextResponse.json(
        { success: false, error: "Missing locationId parameter" },
        { status: 400 }
      );
    }

    // Increment popularity frequency in Firestore
    await updateDocument(COLLECTIONS.LOCATIONS, locationId, {
      searchFrequency: increment(1),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Increment frequency API error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
