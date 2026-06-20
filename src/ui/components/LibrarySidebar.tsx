import type { ModuleDefinitionData } from "../../domain/circuit/schema/CircuitSchema"
import {
    libraryActionRowStyle,
    libraryEmptyStyle,
    libraryHeaderStyle,
    libraryItemMetaStyle,
    libraryItemStyle,
    libraryListStyle,
    libraryPanelStyle,
    libraryTabStyle,
    libraryTitleStyle,
    panelButtonStyle,
    secondaryPanelButtonStyle,
} from "../styles"

type LibrarySidebarProps = {
    isOpen: boolean
    modules: readonly ModuleDefinitionData[]
    selectedModuleId: string
    canSaveSelection: boolean
    canInsertModule: boolean
    canEditModule: boolean
    onSaveSelectedModule: () => void
    onSelectModule: (id: string) => void
    onInsertModule: () => void
    onRenameModule: () => void
    onDeleteModule: () => void
    onExportModule: () => void
    onImportModule: () => void
    onToggle: () => void
}

export function LibrarySidebar({
    isOpen,
    modules,
    selectedModuleId,
    canSaveSelection,
    canInsertModule,
    canEditModule,
    onSaveSelectedModule,
    onSelectModule,
    onInsertModule,
    onRenameModule,
    onDeleteModule,
    onExportModule,
    onImportModule,
    onToggle,
}: LibrarySidebarProps) {
    return <aside
        style={{
            ...libraryPanelStyle,
            transform: isOpen ? "translateX(0)" : "translateX(calc(100% + 18px))",
        }}
        aria-label="Module library"
        aria-hidden={!isOpen}
    >
        <button
            aria-label={isOpen ? "Hide library" : "Show library"}
            title={isOpen ? "Hide library" : "Show library"}
            onClick={onToggle}
            style={libraryTabStyle}
        >
            {isOpen ? ">" : "<"}
        </button>
        <div style={libraryHeaderStyle}>
            <h2 style={libraryTitleStyle}>Library</h2>
            <button
                aria-label="Import module into library"
                title="Import module into library"
                onClick={onImportModule}
                style={secondaryPanelButtonStyle}
            >
                Import
            </button>
        </div>

        <button
            aria-label="Save selected module to library"
            title="Save selected module to library"
            disabled={!canSaveSelection}
            onClick={onSaveSelectedModule}
            style={{
                ...panelButtonStyle,
                opacity: canSaveSelection ? 1 : 0.45,
                cursor: canSaveSelection ? "pointer" : "default",
            }}
        >
            Save selected
        </button>

        <div style={libraryListStyle}>
            {modules.length === 0
                ? <div style={libraryEmptyStyle}>No modules saved</div>
                : modules.map((module) => {
                    const selected = module.id === selectedModuleId
                    return <button
                        key={module.id}
                        aria-pressed={selected}
                        onClick={() => onSelectModule(module.id)}
                        style={{
                            ...libraryItemStyle,
                            borderColor: selected ? "rgba(31, 111, 100, 0.55)" : libraryItemStyle.borderColor,
                            background: selected ? "#edf7f4" : libraryItemStyle.background,
                        }}
                    >
                        <span>{module.name}</span>
                        <span style={libraryItemMetaStyle}>
                            {module.components.length} parts
                        </span>
                    </button>
                })}
        </div>

        <div style={libraryActionRowStyle}>
            <button
                aria-label="Insert selected library module"
                title="Insert selected library module"
                disabled={!canInsertModule}
                onClick={onInsertModule}
                style={{
                    ...panelButtonStyle,
                    opacity: canInsertModule ? 1 : 0.45,
                    cursor: canInsertModule ? "pointer" : "default",
                }}
            >
                Use
            </button>
            <button
                aria-label="Export selected library module"
                title="Export selected library module"
                disabled={!canEditModule}
                onClick={onExportModule}
                style={{
                    ...secondaryPanelButtonStyle,
                    opacity: canEditModule ? 1 : 0.45,
                    cursor: canEditModule ? "pointer" : "default",
                }}
            >
                Export
            </button>
        </div>

        <div style={libraryActionRowStyle}>
            <button
                aria-label="Rename selected library module"
                title="Rename selected library module"
                disabled={!canEditModule}
                onClick={onRenameModule}
                style={{
                    ...secondaryPanelButtonStyle,
                    opacity: canEditModule ? 1 : 0.45,
                    cursor: canEditModule ? "pointer" : "default",
                }}
            >
                Rename
            </button>
            <button
                aria-label="Delete selected library module"
                title="Delete selected library module"
                disabled={!canEditModule}
                onClick={onDeleteModule}
                style={{
                    ...secondaryPanelButtonStyle,
                    opacity: canEditModule ? 1 : 0.45,
                    cursor: canEditModule ? "pointer" : "default",
                }}
            >
                Delete
            </button>
        </div>
    </aside>
}
