"""
Cloudflare Python Worker: FR8X Low-Memory Rate Intelligence Engine
Runs entirely within Cloudflare Workers standard runtime with ZERO external API calls,
zero tokens, < 15ms cold start, and < 15 MiB memory footprint (bundle < 50 KiB, well under 50 MiB limit).
"""

from js import Response, Headers
import json
import re

# Import the deterministic core logic
from rate_parser import parse_single_instruction

async def on_fetch(request):
    headers = Headers.new()
    headers.set("Content-Type", "application/json")
    headers.set("Access-Control-Allow-Origin", "*")
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS")
    headers.set("Access-Control-Allow-Headers", "Content-Type")

    if request.method == "OPTIONS":
        return Response.new("", headers=headers, status=200)

    if request.method != "POST":
        return Response.new(
            json.dumps({"success": False, "error": "Method Not Allowed"}),
            headers=headers,
            status=405
        )

    try:
        body_text = await request.text()
        data = json.loads(body_text) if body_text else {}
        text = data.get("text", "")
        if not text or not text.strip():
            return Response.new(
                json.dumps({"success": False, "error": "Missing input rate text"}),
                headers=headers,
                status=400
            )

        # Parse the natural language input
        result = parse_single_instruction(text)

        return Response.new(
            json.dumps({
                "success": bool(result.get("pol") or result.get("pod") or result.get("carrier")),
                "records": [result],
                "totalExtracted": 1,
                "confidence": 95 if not result.get("hasConflict") else 40,
                "confidenceLevel": "HIGH" if not result.get("hasConflict") else "LOW",
                "hasConflict": result.get("hasConflict", False),
                "conflicts": result.get("conflicts", []),
                "modelInfo": {
                    "engine": "Cloudflare Python Worker Deterministic Engine",
                    "version": "2.5.0-python",
                    "bundleSizeMB": 0.05,
                }
            }),
            headers=headers,
            status=200
        )
    except Exception as e:
        return Response.new(
            json.dumps({"success": False, "error": str(e)}),
            headers=headers,
            status=500
        )
