import type { CSSProperties } from "react"

export const appStyle: CSSProperties = {
    position: "relative",
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
}

export const toolbarStyle: CSSProperties = {
    position: "absolute",
    top: 18,
    left: 18,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: 8,
    border: "1px solid rgba(38, 59, 53, 0.18)",
    borderRadius: 8,
    background: "rgba(255, 250, 240, 0.9)",
    boxShadow: "0 12px 34px rgba(38, 59, 53, 0.12)",
    backdropFilter: "blur(10px)",
}

export const statusStyle: CSSProperties = {
    position: "absolute",
    right: 18,
    bottom: 18,
    display: "flex",
    gap: 10,
    alignItems: "center",
    padding: "8px 10px",
    border: "1px solid rgba(38, 59, 53, 0.18)",
    borderRadius: 8,
    background: "rgba(255, 250, 240, 0.9)",
    color: "#263b35",
    fontSize: 12,
    boxShadow: "0 12px 34px rgba(38, 59, 53, 0.12)",
    backdropFilter: "blur(10px)",
}

export const dividerStyle: CSSProperties = {
    width: 1,
    height: 24,
    background: "rgba(38, 59, 53, 0.18)",
}

export const zoomStyle: CSSProperties = {
    minWidth: 58,
    textAlign: "center",
    color: "#263b35",
    fontVariantNumeric: "tabular-nums",
    fontSize: 13,
}

export const toolButtonStyle: CSSProperties = {
    width: 34,
    height: 34,
    border: "1px solid rgba(38, 59, 53, 0.2)",
    borderRadius: 6,
    background: "#fffdf8",
    color: "#263b35",
    cursor: "pointer",
    fontSize: 15,
    fontWeight: 700,
}
