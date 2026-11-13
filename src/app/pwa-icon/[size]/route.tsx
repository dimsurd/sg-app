import { ImageResponse } from "next/og";

/** App icon (navy tile, gold star) rendered as PNG at the requested size. */
export async function GET(request: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size: raw } = await params;
  const size = Math.min(1024, Math.max(48, Number(raw) || 192));
  const maskable = new URL(request.url).searchParams.has("maskable");
  const star = size * (maskable ? 0.42 : 0.56); // maskable icons need a safe zone

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
        <svg width={star} height={star} viewBox="0 0 24 24">
          <path
            fill="#F1C019"
            d="M12 2.5l2.94 5.96 6.56.95-4.75 4.63 1.12 6.54L12 17.5l-5.87 3.08 1.12-6.54L2.5 9.41l6.56-.95L12 2.5z"
          />
        </svg>
      </div>
    ),
    { width: size, height: size, headers: { "Cache-Control": "public, max-age=604800, immutable" } },
  );
}
