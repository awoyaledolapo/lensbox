import { type NextRequest, NextResponse } from "next/server";

/**
 * GET /api/download?url=<encoded_url>&name=<filename>
 *
 * Proxies a Supabase Storage file download server-side.
 *
 * Why this is needed:
 *   The HTML `download` attribute is silently ignored by browsers for
 *   cross-origin URLs (security restriction). Photos are hosted on the
 *   Supabase CDN domain, so a plain <a href download> just opens the
 *   image in a new tab. This route fetches the file server-side and
 *   re-serves it with Content-Disposition: attachment, forcing a download.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url  = searchParams.get("url");
  const name = searchParams.get("name") ?? "photo";

  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  // Only allow downloads from our own Supabase project to prevent open-proxy abuse.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseHost = new URL(supabaseUrl).hostname;
  let requestedHost: string;
  try {
    requestedHost = new URL(url).hostname;
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (requestedHost !== supabaseHost) {
    return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
  }

  // Fetch the file from Supabase Storage.
  const upstream = await fetch(url);
  if (!upstream.ok) {
    return NextResponse.json(
      { error: "Failed to fetch file" },
      { status: upstream.status }
    );
  }

  const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
  const body = await upstream.arrayBuffer();

  // Sanitise filename — strip any path traversal characters.
  const safeFilename = name.replace(/[/\\?%*:|"<>]/g, "_");

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${safeFilename}"`,
      // Allow the client-side JS to read this response.
      "Cache-Control": "private, no-store",
    },
  });
}
