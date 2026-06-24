import type { ModuleDefinitionData } from "../../domain/circuit/schema/CircuitSchema"
import { useMemo, useState } from "react"
import {
    libraryActionRowStyle,
    libraryDetailGridStyle,
    libraryDetailStyle,
    libraryDetailTitleStyle,
    libraryEmptyStyle,
    libraryHeaderStyle,
    libraryItemTitleStyle,
    libraryItemMetaStyle,
    libraryItemStyle,
    libraryListStyle,
    libraryPanelStyle,
    librarySearchStyle,
    libraryStatStyle,
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
    const [query, setQuery] = useState("")
    const filteredModules = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase()
        if (!normalizedQuery) {
            return modules
        }

        return modules.filter((module) => module.name.toLowerCase().includes(normalizedQuery))
    }, [modules, query])
    const selectedModule = modules.find((module) => module.id === selectedModuleId) ?? null
    const selectedModuleSize = selectedModule
        ? `${Math.round(selectedModule.bounds.width)} x ${Math.round(selectedModule.bounds.height)}`
        : ""

    return <aside
        style={{
            ...libraryPanelStyle,
            transform: isOpen ? "translateX(0)" : "translateX(calc(-100% - 18px))",
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
            {isOpen ? "<" : ">"}
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

        <input
            aria-label="Search library modules"
            placeholder="Search modules"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            style={librarySearchStyle}
        />

        <div style={libraryListStyle}>
            {modules.length === 0
                ? <div style={libraryEmptyStyle}>No modules saved yet. Select a module on the canvas and save it here.</div>
                : filteredModules.length === 0
                    ? <div style={libraryEmptyStyle}>No modules match "{query}".</div>
                    : filteredModules.map((module) => {
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
                        <span style={libraryItemTitleStyle}>{module.name}</span>
                        <span style={libraryItemMetaStyle}>
                            {module.components.length} parts · {module.wires.length} wires · {Math.round(module.bounds.width)}x{Math.round(module.bounds.height)}
                        </span>
                    </button>
                })}
        </div>

        {selectedModule && <section style={libraryDetailStyle} aria-label="Selected module details">
            <h3 style={libraryDetailTitleStyle}>{selectedModule.name}</h3>
            <div style={libraryDetailGridStyle}>
                <div style={libraryStatStyle}>{selectedModule.components.length} parts</div>
                <div style={libraryStatStyle}>{selectedModule.wires.length} wires</div>
                <div style={libraryStatStyle}>{selectedModule.pins.length} pins</div>
                <div style={libraryStatStyle}>{selectedModuleSize}</div>
            </div>
        </section>}

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
