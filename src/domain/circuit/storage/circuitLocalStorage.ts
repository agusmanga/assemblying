import type { ModuleDefinitionData } from "../schema/CircuitSchema"

const circuitStorageKey = "assemblying.circuit"

export function saveCircuitToLocalStorage(data: ModuleDefinitionData): void {
    window.localStorage.setItem(circuitStorageKey, JSON.stringify(data))
}

export function loadCircuitFromLocalStorage(): ModuleDefinitionData | null {
    const stored = window.localStorage.getItem(circuitStorageKey)
    if (!stored) {
        return null
    }

    return JSON.parse(stored) as ModuleDefinitionData
}

export function clearCircuitLocalStorage(): void {
    window.localStorage.removeItem(circuitStorageKey)
}
