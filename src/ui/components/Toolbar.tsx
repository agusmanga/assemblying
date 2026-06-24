import { toolbarGroupStyle, toolbarStyle, toolButtonStyle, zoomStyle } from "../styles"
import type { ToolComponentKind } from "../types"

type ToolbarProps = {
    scale: number
    canDeleteSelection: boolean
    canModularizeSelection: boolean
    canDemodularizeSelection: boolean
    activeTool: ToolComponentKind | null
    onPickTool: (kind: ToolComponentKind) => void
    onDeleteSelected: () => void
    onModularizeSelected: () => void
    onDemodularizeSelected: () => void
    onExportCircuit: () => void
    onImportCircuit: () => void
    onCreateNewCircuit: () => void
    onZoomOut: () => void
    onZoomIn: () => void
    onResetView: () => void
    onShowOnboarding: () => void
}

export function Toolbar({
    scale,
    canDeleteSelection,
    canModularizeSelection,
    canDemodularizeSelection,
    activeTool,
    onPickTool,
    onDeleteSelected,
    onModularizeSelected,
    onDemodularizeSelected,
    onExportCircuit,
    onImportCircuit,
    onCreateNewCircuit,
    onZoomOut,
    onZoomIn,
    onResetView,
    onShowOnboarding,
}: ToolbarProps) {
    const disabledStyle = (enabled: boolean) => ({
        opacity: enabled ? 1 : 0.45,
        cursor: enabled ? "pointer" : "default",
    })
    const componentToolButton = (
        kind: ToolComponentKind,
        label: string,
        title: string,
        color: string,
    ) => (
        <button
            aria-label={title}
            title={`${title}. Press and drag to canvas.`}
            onPointerDown={(event) => {
                event.preventDefault()
                onPickTool(kind)
            }}
            style={{
                ...toolButtonStyle,
                color,
                borderColor: activeTool === kind ? "#d68f00" : toolButtonStyle.borderColor,
                background: activeTool === kind ? "#fff4d8" : toolButtonStyle.background,
            }}
        >
            {label}
        </button>
    )

    return <section style={toolbarStyle}>
        <div style={toolbarGroupStyle}>
            {componentToolButton("nmos", "N", "Create NMOS", "#1f6f64")}
            {componentToolButton("pmos", "P", "Create PMOS", "#8d3f7c")}
            {componentToolButton("vdd", "1", "Create VDD", "#d1493f")}
            {componentToolButton("gnd", "0", "Create GND", "#3867d6")}
            {componentToolButton("input", "I", "Create input", "#b26b00")}
            {componentToolButton("output", "O", "Create output probe", "#263b35")}
            {componentToolButton("led", "L", "Create LED", "#d1493f")}
            {componentToolButton("clock", "C", "Create clock", "#7b4bb2")}
        </div>

        <div style={toolbarGroupStyle}>
            <button
                aria-label="Delete selected"
                title="Delete selected"
                disabled={!canDeleteSelection}
                onClick={onDeleteSelected}
                style={{ ...toolButtonStyle, ...disabledStyle(canDeleteSelection) }}
            >
                Del
            </button>
            <button
                aria-label="Create module from selection"
                title="Create module from selection"
                disabled={!canModularizeSelection}
                onClick={onModularizeSelected}
                style={{ ...toolButtonStyle, width: 42, ...disabledStyle(canModularizeSelection) }}
            >
                Mod
            </button>
            <button
                aria-label="Break selected module apart"
                title="Break selected module apart"
                disabled={!canDemodularizeSelection}
                onClick={onDemodularizeSelected}
                style={{ ...toolButtonStyle, width: 44, ...disabledStyle(canDemodularizeSelection) }}
            >
                Ung
            </button>
        </div>

        <div style={toolbarGroupStyle}>
            <button
                aria-label="Export circuit JSON"
                title="Export circuit JSON"
                onClick={onExportCircuit}
                style={{ ...toolButtonStyle, width: 40 }}
            >
                Out
            </button>
            <button
                aria-label="Import circuit JSON"
                title="Import circuit JSON"
                onClick={onImportCircuit}
                style={{ ...toolButtonStyle, width: 36 }}
            >
                In
            </button>
            <button
                aria-label="Create new circuit"
                title="Create new circuit"
                onClick={onCreateNewCircuit}
                style={{ ...toolButtonStyle, width: 36 }}
            >
                New
            </button>
        </div>

        <div style={toolbarGroupStyle}>
            <button
                aria-label="Zoom out"
                title="Zoom out"
                onClick={onZoomOut}
                style={toolButtonStyle}
            >
                -
            </button>
            <div style={zoomStyle}>
                {Math.round(scale * 100)}%
            </div>
            <button
                aria-label="Zoom in"
                title="Zoom in"
                onClick={onZoomIn}
                style={toolButtonStyle}
            >
                +
            </button>
            <button
                aria-label="Reset view"
                title="Reset view"
                onClick={onResetView}
                style={{ ...toolButtonStyle, width: 48 }}
            >
                1:1
            </button>
        </div>

        <div style={toolbarGroupStyle}>
            <button
                aria-label="Show onboarding"
                title="Show onboarding"
                onClick={onShowOnboarding}
                style={toolButtonStyle}
            >
                ?
            </button>
        </div>
    </section>
}
