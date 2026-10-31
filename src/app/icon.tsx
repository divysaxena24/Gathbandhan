import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 20,
          background: "linear-gradient(135deg, #7A1C2E 0%, #D4AF37 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#FFFDF9",
          borderRadius: "8px",
          fontWeight: 700,
        }}
      >
        💍
      </div>
    ),
    {
      ...size,
    }
  );
}
