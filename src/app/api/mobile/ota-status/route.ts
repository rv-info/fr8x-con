// FR8X-CON Mobile OTA Status API Route
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    platform: "android",
    packageName: "in.fr8x.con",
    version: "1.0.0",
    channel: "production",
    easProjectId: "a6b388b8-9419-4569-88f8-44566339ab15",
    otaAutoUpdateEnabled: true,
    lastUpdated: new Date().toISOString(),
    downloadUrl: "/downloads/fr8x-con-release.apk",
    expoProjectUrl: "https://expo.dev/projects/a6b388b8-9419-4569-88f8-44566339ab15",
    expoBuildsUrl: "https://expo.dev/accounts/fr8xs-team/projects/fr8x-con/builds",
    easUpdateChannelUrl: "https://u.expo.dev/a6b388b8-9419-4569-88f8-44566339ab15",
  });
}
