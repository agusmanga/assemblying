import type { ModuleDefinitionData } from "../schema/CircuitSchema"

const moduleLibraryStorageKey = "assemblying.moduleLibrary"

function readLibrary(): Record<string, ModuleDefinitionData> {
    const stored = window.localStorage.getItem(moduleLibraryStorageKey)
    if (!stored) {
        return {}
    }

    return JSON.parse(stored) as Record<string, ModuleDefinitionData>
}

function writeLibrary(library: Record<string, ModuleDefinitionData>): void {
    window.localStorage.setItem(moduleLibraryStorageKey, JSON.stringify(library))
}

export function saveModuleDefinition(data: ModuleDefinitionData): void {
    writeLibrary({
        ...readLibrary(),
        [data.id]: data,
    })
}

export function listModuleDefinitions(): ModuleDefinitionData[] {
    return Object.values(readLibrary()).sort((a, b) => a.name.localeCompare(b.name))
}

export function loadModuleDefinition(id: string): ModuleDefinitionData | null {
    return readLibrary()[id] ?? null
}

export function deleteModuleDefinition(id: string): void {
    const library = readLibrary()
    delete library[id]
    writeLibrary(library)
}

export function renameModuleDefinition(id: string, name: string): void {
    const library = readLibrary()
    const module = library[id]
    if (!module) {
        return
    }

    writeLibrary({
        ...library,
        [id]: {
            ...module,
            name,
        },
    })
}
