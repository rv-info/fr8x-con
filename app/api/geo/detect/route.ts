import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/geo/detect
 * Free Location Detection & Reverse Geocoding API
 * 
 * Supports:
 * 1. High-precision GPS reverse geocoding via OpenStreetMap Nominatim (when lat & lng provided)
 * 2. Network IP geolocation fallback (when GPS is not available or blocked)
 * 3. Clean address parsing formatted for freight terminals, CFS, and registered corporate addresses.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    // SCENARIO 1: GPS Coordinates provided by browser device geolocation
    if (lat && lng) {
      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);

      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        try {
          const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${parsedLat}&lon=${parsedLng}&zoom=18&addressdetails=1`;
          const res = await fetch(nominatimUrl, {
            headers: {
              'User-Agent': 'FR8X-Global-Logistics/1.0 (support@fr8x.in)',
              'Accept-Language': 'en',
            },
            signal: AbortSignal.timeout(4500),
          });

          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};

            const country = addr.country || 'India';
            const countryCode = (addr.country_code || 'in').toUpperCase();
            const state = addr.state || addr.region || addr.province || '';
            const city =
              addr.city ||
              addr.town ||
              addr.municipality ||
              addr.village ||
              addr.city_district ||
              addr.county ||
              addr.state_district ||
              '';
            const postalCode = addr.postcode || '';

            // Extract street / premise elements
            const streetParts: string[] = [];
            if (addr.building || addr.house_number) {
              streetParts.push([addr.house_number, addr.building].filter(Boolean).join(' '));
            }
            if (addr.road) streetParts.push(addr.road);
            if (addr.industrial || addr.commercial) streetParts.push(addr.industrial || addr.commercial);
            if (addr.suburb || addr.neighbourhood) streetParts.push(addr.suburb || addr.neighbourhood);

            const streetLine = streetParts.filter(Boolean).join(', ');

            // Construct clean freight registered address
            const suggestedStreetAddress = streetLine
              ? `${streetLine}, ${city || state} ${postalCode}`.trim()
              : data.display_name
              ? data.display_name.split(',').slice(0, 4).join(',').trim()
              : `${city}, ${state} ${postalCode}`.trim();

            const suggestions = [
              suggestedStreetAddress,
              data.display_name
                ? data.display_name.split(',').slice(0, 3).join(',').trim()
                : `${city} Logistics Hub, ${state}`,
              `${city || 'Port'} Container Terminal / CFS Area, ${state} ${postalCode}`.trim(),
            ].filter((s, idx, self) => Boolean(s) && self.indexOf(s) === idx);

            // Infer timezone
            let timezone = 'Asia/Kolkata';
            if (countryCode === 'US') timezone = 'America/New_York';
            else if (countryCode === 'AE') timezone = 'Asia/Dubai';
            else if (countryCode === 'SG') timezone = 'Asia/Singapore';
            else if (countryCode === 'GB') timezone = 'Europe/London';
            else if (['DE', 'NL', 'FR', 'IT', 'ES', 'BE'].includes(countryCode)) timezone = 'Europe/Rotterdam';
            else if (countryCode === 'CN' || countryCode === 'HK') timezone = 'Asia/Shanghai';
            else if (countryCode === 'AU') timezone = 'Australia/Sydney';

            return NextResponse.json({
              success: true,
              source: 'gps',
              latitude: parsedLat,
              longitude: parsedLng,
              country,
              countryCode,
              state,
              city,
              postalCode,
              timezone,
              formattedAddress: data.display_name || suggestedStreetAddress,
              suggestedStreetAddress,
              suggestions,
            });
          }
        } catch (nominatimErr) {
          console.warn('[API /api/geo/detect] Nominatim reverse geocode error or timeout, trying IP fallback:', nominatimErr);
        }
      }
    }

    // SCENARIO 2: Fallback to Free IP Geolocation
    let clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '';

    // If local or empty IP, query default public lookup
    const isLocalIp = !clientIp || clientIp === '127.0.0.1' || clientIp === '::1' || clientIp.startsWith('192.168.');
    const ipGeoUrl = isLocalIp
      ? 'https://freeipapi.com/api/json'
      : `https://freeipapi.com/api/json/${clientIp}`;

    try {
      const ipRes = await fetch(ipGeoUrl, {
        signal: AbortSignal.timeout(3500),
      });

      if (ipRes.ok) {
        const ipData = await ipRes.json();
        const country = ipData.countryName || 'India';
        const countryCode = (ipData.countryCode || 'IN').toUpperCase();
        const state = ipData.regionName || '';
        const city = ipData.cityName || '';
        const postalCode = ipData.zipCode || '';
        const timezone = ipData.timeZone || 'Asia/Kolkata';

        const suggestedStreetAddress = city
          ? `${city} Freight Terminal, ${state || country} ${postalCode}`.trim()
          : `${country} Central Logistics Terminal`;

        const suggestions = [
          suggestedStreetAddress,
          `${city} Inland Container Depot (ICD) / Port Hub, ${state}`.trim(),
          `${city} Logistics & Cargo Logistics Park, ${postalCode}`.trim(),
        ].filter(Boolean);

        return NextResponse.json({
          success: true,
          source: 'ip',
          country,
          countryCode,
          state,
          city,
          postalCode,
          timezone,
          formattedAddress: `${city}${city && state ? ', ' : ''}${state}${state && country ? ', ' : ''}${country}`,
          suggestedStreetAddress,
          suggestions,
        });
      }
    } catch (ipErr) {
      console.warn('[API /api/geo/detect] IP Geolocation API error:', ipErr);
    }

    // SCENARIO 3: Ultimate resilient default fallback
    return NextResponse.json({
      success: true,
      source: 'fallback',
      country: 'India',
      countryCode: 'IN',
      state: 'Haryana',
      city: 'Gurgaon',
      postalCode: '122001',
      timezone: 'Asia/Kolkata',
      formattedAddress: 'Gurgaon, Haryana, India',
      suggestedStreetAddress: 'Sector 32 Logistics Corridor, Gurgaon, Haryana 122001',
      suggestions: [
        'Sector 32 Logistics Corridor, Gurgaon, Haryana 122001',
        'ICD Garhi Harsaru Logistics Park, Gurgaon, Haryana 122505',
        'Udyog Vihar Cargo Hub, Gurgaon, Haryana 122016',
      ],
    });
  } catch (error: any) {
    console.error('[API /api/geo/detect] Unhandled error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to detect device location' },
      { status: 500 }
    );
  }
}
