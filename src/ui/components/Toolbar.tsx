import type { PowerSourceKind } from "../../domain/circuit/Model/PowerSource"
import type { TransistorKind } from "../../domain/circuit/Model/Transistor"
import type { ModuleDefinitionData } from "../../domain/circuit/schema/CircuitSchema"
import { dividerStyle, toolbarStyle, toolButtonStyle, zoomStyle } from "../styles"

type ToolbarProps = {
    scale: number
    canDeleteSelection: boolean
    canModularizeSelection: boolean
    moduleLibrary: readonly ModuleDefinitionData[]
    selectedLibraryModuleId: string
    canSaveModuleSelection: boolean
    canInsertLibraryModule: boolean
    canEditLibraryModule: boolean
    onCreateTransistor: (kind: TransistorKind) => void
    onCreatePowerSource: (kind: PowerSourceKind) => void
    onCreateInputSource: () => void
    onDeleteSelected: () => void
    onModularizeSelected: () => void
    onExportCircuit: () => void
    onImportCircuit: () => void
    onCreateNewCircuit: () => void
    onSaveSelectedModule: () => void
    onSelectLibraryModule: (id: string) => void
    onInsertLibraryModule: () => void
    onRenameLibraryModule: () => void
    onDeleteLibraryModule: () => void
    onExportLibraryModule: () => void
    onImportLibraryModule: () => void
    onZoomOut: () => void
    onZoomIn: () => void
    onResetView: () => void
}

export function Toolbar({
    scale,
    canDeleteSelection,
    canModularizeSelection,
    moduleLibrary,
    selectedLibraryModuleId,
    canSaveModuleSelection,
    canInsertLibraryModule,
    canEditLibraryModule,
    onCreateTransistor,
    onCreatePowerSource,
    onCreateInputSource,
    onDeleteSelected,
    onModularizeSelected,
    onExportCircuit,
    onImportCircuit,
    onCreateNewCircuit,
    onSaveSelectedModule,
    onSelectLibraryModule,
    onInsertLibraryModule,
    onRenameLibraryModule,
    onDeleteLibraryModule,
    onExportLibraryModule,
    onImportLibraryModule,
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
        <button
            aria-label="Create new circuit"
            title="Create new circuit"
            onClick={onCreateNewCircuit}
            style={{ ...toolButtonStyle, width: 44 }}
        >
            New
        </button>
        <div style={dividerStyle} />
        <button
            aria-label="Save selected module to library"
            title="Save selected module to library"
            disabled={!canSaveModuleSelection}
            onClick={onSaveSelectedModule}
            style={{
                ...toolButtonStyle,
                width: 48,
                opacity: canSaveModuleSelection ? 1 : 0.45,
                cursor: canSaveModuleSelection ? "pointer" : "default",
            }}
        >
            Save
        </button>
        <select
            aria-label="Module library"
            title="Module library"
            value={selectedLibraryModuleId}
            onChange={(event) => onSelectLibraryModule(event.currentTarget.value)}
            style={{
                height: 34,
                maxWidth: 160,
                border: "1px solid rgba(38, 59, 53, 0.2)",
                borderRadius: 6,
                background: "#fffdf8",
                color: "#263b35",
                fontSize: 13,
                fontWeight: 700,
            }}
        >
            <option value="">Library</option>
            {moduleLibrary.map((module) => (
                <option key={module.id} value={module.id}>
                    {module.name}
                </option>
            ))}
        </select>
        <button
            aria-label="Insert selected library module"
            title="Insert selected library module"
            disabled={!canInsertLibraryModule}
            onClick={onInsertLibraryModule}
            style={{
                ...toolButtonStyle,
                width: 44,
                opacity: canInsertLibraryModule ? 1 : 0.45,
                cursor: canInsertLibraryModule ? "pointer" : "default",
            }}
        >
            Use
        </button>
        <button
            aria-label="Rename selected library module"
            title="Rename selected library module"
            disabled={!canEditLibraryModule}
            onClick={onRenameLibraryModule}
            style={{
                ...toolButtonStyle,
                width: 44,
                opacity: canEditLibraryModule ? 1 : 0.45,
                cursor: canEditLibraryModule ? "pointer" : "default",
            }}
        >
            Ren
        </button>
        <button
            aria-label="Delete selected library module"
            title="Delete selected library module"
            disabled={!canEditLibraryModule}
            onClick={onDeleteLibraryModule}
            style={{
                ...toolButtonStyle,
                width: 44,
                opacity: canEditLibraryModule ? 1 : 0.45,
                cursor: canEditLibraryModule ? "pointer" : "default",
            }}
        >
            Del
        </button>
        <button
            aria-label="Export selected library module"
            title="Export selected library module"
            disabled={!canEditLibraryModule}
            onClick={onExportLibraryModule}
            style={{
                ...toolButtonStyle,
                width: 56,
                opacity: canEditLibraryModule ? 1 : 0.45,
                cursor: canEditLibraryModule ? "pointer" : "default",
            }}
        >
            ExpM
        </button>
        <button
            aria-label="Import module into library"
            title="Import module into library"
            onClick={onImportLibraryModule}
            style={{ ...toolButtonStyle, width: 56 }}
        >
            ImpM
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
