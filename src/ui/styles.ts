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
    right: 18,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: 8,
    maxWidth: "calc(100vw - 36px)",
    border: "1px solid rgba(38, 59, 53, 0.18)",
    borderRadius: 8,
    background: "rgba(255, 250, 240, 0.9)",
    boxShadow: "0 12px 34px rgba(38, 59, 53, 0.12)",
    backdropFilter: "blur(10px)",
}

export const toolbarGroupStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: 3,
    border: "1px solid rgba(38, 59, 53, 0.12)",
    borderRadius: 7,
    background: "rgba(255, 253, 248, 0.62)",
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

export const breadcrumbStyle: CSSProperties = {
    position: "absolute",
    right: 18,
    bottom: 18,
    display: "flex",
    alignItems: "center",
    gap: 6,
    maxWidth: "min(520px, calc(100vw - 36px))",
    padding: "8px 10px",
    border: "1px solid rgba(38, 59, 53, 0.18)",
    borderRadius: 8,
    background: "rgba(255, 250, 240, 0.9)",
    color: "#263b35",
    fontSize: 12,
    boxShadow: "0 12px 34px rgba(38, 59, 53, 0.12)",
    backdropFilter: "blur(10px)",
    overflow: "hidden",
}

export const breadcrumbButtonStyle: CSSProperties = {
    maxWidth: 150,
    padding: "3px 6px",
    border: 0,
    borderRadius: 5,
    background: "transparent",
    color: "#263b35",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 800,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
}

export const breadcrumbSeparatorStyle: CSSProperties = {
    color: "rgba(38, 59, 53, 0.45)",
    fontWeight: 800,
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
    boxSizing: "border-box",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 4px",
    border: "1px solid rgba(38, 59, 53, 0.2)",
    borderRadius: 6,
    background: "#fffdf8",
    color: "#263b35",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1,
    overflow: "hidden",
    textOverflow: "clip",
    whiteSpace: "nowrap",
}

export const onboardingOverlayStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    padding: 24,
    background: "rgba(38, 59, 53, 0.16)",
    backdropFilter: "blur(2px)",
    zIndex: 5,
}

export const onboardingPanelStyle: CSSProperties = {
    position: "absolute",
    width: "min(360px, calc(100vw - 48px))",
    padding: 18,
    border: "1px solid rgba(38, 59, 53, 0.18)",
    borderRadius: 8,
    background: "#fffdf8",
    color: "#263b35",
    boxShadow: "0 22px 70px rgba(38, 59, 53, 0.2)",
}

export const onboardingSpotlightStyle: CSSProperties = {
    position: "absolute",
    border: "2px solid #d68f00",
    borderRadius: 10,
    boxShadow: "0 0 0 9999px rgba(38, 59, 53, 0.18), 0 12px 34px rgba(38, 59, 53, 0.18)",
    pointerEvents: "none",
}

export const onboardingHeaderStyle: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 14,
}

export const onboardingTitleStyle: CSSProperties = {
    margin: 0,
    fontSize: 20,
    lineHeight: 1.2,
}

export const onboardingCardTextStyle: CSSProperties = {
    margin: 0,
    color: "rgba(38, 59, 53, 0.72)",
    fontSize: 12,
    lineHeight: 1.45,
}

export const libraryPanelStyle: CSSProperties = {
    position: "absolute",
    top: 18,
    left: 18,
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
    right: -34,
    width: 34,
    height: 54,
    border: "1px solid rgba(38, 59, 53, 0.18)",
    borderLeft: 0,
    borderRadius: "0 8px 8px 0",
    background: "rgba(255, 250, 240, 0.92)",
    color: "#263b35",
    boxShadow: "8px 10px 24px rgba(38, 59, 53, 0.1)",
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

export const librarySearchStyle: CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    minHeight: 34,
    padding: "0 10px",
    border: "1px solid rgba(38, 59, 53, 0.18)",
    borderRadius: 6,
    background: "#fffdf8",
    color: "#263b35",
    fontSize: 13,
    outline: "none",
}

export const libraryItemStyle: CSSProperties = {
    width: "100%",
    minHeight: 64,
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

export const libraryItemTitleStyle: CSSProperties = {
    width: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: 13,
    fontWeight: 900,
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

export const libraryDetailStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: 10,
    border: "1px solid rgba(38, 59, 53, 0.14)",
    borderRadius: 7,
    background: "#fffdf8",
}

export const libraryDetailTitleStyle: CSSProperties = {
    margin: 0,
    color: "#263b35",
    fontSize: 13,
    fontWeight: 900,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
}

export const libraryDetailGridStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 6,
}

export const libraryStatStyle: CSSProperties = {
    padding: "7px 8px",
    borderRadius: 6,
    background: "#f8f2e7",
    color: "rgba(38, 59, 53, 0.72)",
    fontSize: 11,
    fontWeight: 800,
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
