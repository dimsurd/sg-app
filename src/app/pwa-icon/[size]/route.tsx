import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

/** Star Generation star mark (public/brand/star-mark.png, 568×636) as a data URL, read once. */
let markDataUrl: Promise<string> | null = null;
function starMark() {
  markDataUrl ??= readFile(path.join(process.cwd(), "public/brand/star-mark.png")).then(
    (buf) => `data:image/png;base64,${buf.toString("base64")}`,
  );
  return markDataUrl;
}

/** App icon: the official gold star mark on a navy tile, as PNG at the requested size. */
export async function GET(request: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size: raw } = await params;
  const size = Math.min(1024, Math.max(48, Number(raw) || 192));
  const maskable = new URL(request.url).searchParams.has("maskable");
  const markHeight = size * (maskable ? 0.5 : 0.66); // maskable icons need a safe zone
  const markWidth = markHeight * (568 / 636);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2F3F5F",
          borderRadius: maskable ? 0 : size * 0.22,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain <img> */}
        <img src={await starMark()} width={markWidth} height={markHeight} alt="" />
      </div>
    ),
    { width: size, height: size, headers: { "Cache-Control": "public, max-age=604800, immutable" } },
  );
}
