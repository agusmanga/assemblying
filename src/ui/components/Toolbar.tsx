import type { PowerSourceKind } from "../../domain/circuit/Model/PowerSource"
import type { TransistorKind } from "../../domain/circuit/Model/Transistor"
import { dividerStyle, toolbarStyle, toolButtonStyle, zoomStyle } from "../styles"

type ToolbarProps = {
    scale: number
    canDeleteSelection: boolean
    canModularizeSelection: boolean
    onCreateTransistor: (kind: TransistorKind) => void
    onCreatePowerSource: (kind: PowerSourceKind) => void
    onCreateInputSource: () => void
    onDeleteSelected: () => void
    onModularizeSelected: () => void
    onExportCircuit: () => void
    onImportCircuit: () => void
    onZoomOut: () => void
    onZoomIn: () => void
    onResetView: () => void
}

export function Toolbar({
    scale,
    canDeleteSelection,
    canModularizeSelection,
    onCreateTransistor,
    onCreatePowerSource,
    onCreateInputSource,
    onDeleteSelected,
    onModularizeSelected,
    onExportCircuit,
    onImportCircuit,
    onZoomOut,
    onZoomIn,
    onResetView,
}: ToolbarProps) {
    return <section style={toolbarStyle}>
        <button
            aria-label="Create NMOS"
            title="Create NMOS"
            onClick={() => onCreateTransistor("nmos")}
            style={{ ...toolButtonStyle, color: "#1f6f64" }}
        >
            N
        </button>
        <button
            aria-label="Create PMOS"
            title="Create PMOS"
            onClick={() => onCreateTransistor("pmos")}
            style={{ ...toolButtonStyle, color: "#8d3f7c" }}
        >
            P
        </button>
        <button
            aria-label="Create VDD"
            title="Create VDD"
            onClick={() => onCreatePowerSource("vdd")}
            style={{ ...toolButtonStyle, color: "#d1493f" }}
        >
            V
        </button>
        <button
            aria-label="Create GND"
            title="Create GND"
            onClick={() => onCreatePowerSource("gnd")}
            style={{ ...toolButtonStyle, color: "#3867d6" }}
        >
            G
        </button>
        <button
            aria-label="Create input"
            title="Create input"
            onClick={onCreateInputSource}
            style={{ ...toolButtonStyle, color: "#b26b00" }}
        >
            I
        </button>
        <button
            aria-label="Delete selected"
            title="Delete selected"
            disabled={!canDeleteSelection}
            onClick={onDeleteSelected}
            style={{
                ...toolButtonStyle,
                opacity: canDeleteSelection ? 1 : 0.45,
                cursor: canDeleteSelection ? "pointer" : "default",
            }}
        >
            Del
        </button>
        <button
            aria-label="Create module from selection"
            title="Create module from selection"
            disabled={!canModularizeSelection}
            onClick={onModularizeSelected}
            style={{
                ...toolButtonStyle,
                width: 44,
                opacity: canModularizeSelection ? 1 : 0.45,
                cursor: canModularizeSelection ? "pointer" : "default",
            }}
        >
            Mod
        </button>
        <div style={dividerStyle} />
        <button
            aria-label="Export circuit JSON"
            title="Export circuit JSON"
            onClick={onExportCircuit}
            style={{ ...toolButtonStyle, width: 44 }}
        >
            Exp
        </button>
        <button
            aria-label="Import circuit JSON"
            title="Import circuit JSON"
            onClick={onImportCircuit}
            style={{ ...toolButtonStyle, width: 44 }}
        >
            Imp
        </button>
        <div style={dividerStyle} />
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
            style={{ ...toolButtonStyle, width: 64 }}
        >
            1:1
        </button>
    </section>
}
