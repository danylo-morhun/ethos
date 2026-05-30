import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
	return new ImageResponse(
		<div
			style={{
				background: "#0a0a0a",
				width: "100%",
				height: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				borderRadius: "7px",
			}}
		>
			<span
				style={{
					color: "white",
					fontSize: 22,
					fontWeight: 700,
					fontFamily: "Georgia, serif",
					lineHeight: 1,
					marginTop: "2px",
				}}
			>
				e
			</span>
		</div>,
		{ ...size },
	);
}
