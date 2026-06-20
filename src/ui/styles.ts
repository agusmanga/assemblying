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

export const libraryPanelStyle: CSSProperties = {
    position: "absolute",
    top: 18,
    right: 18,
    bottom: 18,
    width: 260,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: 12,
    border: "1px solid rgba(38, 59, 53, 0.18)",
    borderRadius: 8,
    background: "rgba(255, 250, 240, 0.92)",
    boxShadow: "0 12px 34px rgba(38, 59, 53, 0.12)",
    backdropFilter: "blur(10px)",
    transition: "transform 160ms ease",
}

export const libraryTabStyle: CSSProperties = {
    position: "absolute",
    top: 18,
    left: -34,
    width: 34,
    height: 54,
    border: "1px solid rgba(38, 59, 53, 0.18)",
    borderRight: 0,
    borderRadius: "8px 0 0 8px",
    background: "rgba(255, 250, 240, 0.92)",
    color: "#263b35",
    boxShadow: "-8px 10px 24px rgba(38, 59, 53, 0.1)",
    cursor: "pointer",
    fontSize: 18,
    fontWeight: 900,
}

export const libraryHeaderStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
}

export const libraryTitleStyle: CSSProperties = {
    margin: 0,
    color: "#263b35",
    fontSize: 15,
    fontWeight: 800,
}

export const libraryListStyle: CSSProperties = {
    display: "flex",
    flex: 1,
    minHeight: 0,
    flexDirection: "column",
    gap: 8,
    overflowY: "auto",
}

export const libraryItemStyle: CSSProperties = {
    width: "100%",
    minHeight: 52,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 4,
    padding: "8px 10px",
    border: "1px solid rgba(38, 59, 53, 0.16)",
    borderRadius: 6,
    background: "#fffdf8",
    color: "#263b35",
    cursor: "pointer",
    textAlign: "left",
}

export const libraryItemMetaStyle: CSSProperties = {
    color: "rgba(38, 59, 53, 0.62)",
    fontSize: 11,
    fontWeight: 700,
}

export const libraryEmptyStyle: CSSProperties = {
    padding: "14px 10px",
    border: "1px dashed rgba(38, 59, 53, 0.2)",
    borderRadius: 6,
    color: "rgba(38, 59, 53, 0.62)",
    fontSize: 12,
    fontWeight: 700,
}

export const libraryActionRowStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
}

export const panelButtonStyle: CSSProperties = {
    minHeight: 34,
    border: "1px solid rgba(38, 59, 53, 0.2)",
    borderRadius: 6,
    background: "#263b35",
    color: "#fffdf8",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 800,
}

export const secondaryPanelButtonStyle: CSSProperties = {
    ...panelButtonStyle,
    background: "#fffdf8",
    color: "#263b35",
}
