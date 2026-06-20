import { Module } from "../Model/Module"
import { deserializeModule } from "../serialization/moduleSerializer"
import type {
    ComponentData,
    EmbeddedModuleData,
    ModuleDefinitionData,
    ModuleInstanceData,
    PinData,
    WireData,
} from "../schema/CircuitSchema"

function clonePinData(pin: PinData, idPrefix: string): PinData {
    return {
        ...pin,
        id: `${idPrefix}${pin.id}`,
    }
}

function cloneWireData(wire: WireData, idPrefix: string): WireData {
    return {
        ...wire,
        id: `${idPrefix}${wire.id}`,
        points: wire.points.map((point) => ({ x: point.x, y: point.y })),
        connectionPinIds: wire.connectionPinIds.map((pinId) => `${idPrefix}${pinId}`),
        connectedWireIds: wire.connectedWireIds.map((wireId) => `${idPrefix}${wireId}`),
    }
}

function cloneComponentData(component: ComponentData, idPrefix: string): ComponentData {
    if (component.type === "module") {
        return cloneEmbeddedModuleData(component, idPrefix)
    }

    if (component.type === "moduleInstance") {
        return cloneModuleInstanceData(component, idPrefix)
    }

    return {
        ...component,
        id: `${idPrefix}${component.id}`,
    }
}

function cloneModuleInstanceData(component: ModuleInstanceData, idPrefix: string): ModuleInstanceData {
    return {
        ...component,
        id: `${idPrefix}${component.id}`,
        pins: component.pins.map((pin) => clonePinData(pin, idPrefix)),
    }
}

function cloneEmbeddedModuleData(module: EmbeddedModuleData, idPrefix: string): EmbeddedModuleData {
    return {
        ...module,
        id: `${idPrefix}${module.id}`,
        pins: module.pins.map((pin) => clonePinData(pin, idPrefix)),
        components: module.components.map((component) => cloneComponentData(component, idPrefix)),
        wires: module.wires.map((wire) => cloneWireData(wire, idPrefix)),
    }
}

function cloneModuleDefinition(data: ModuleDefinitionData, idPrefix: string): ModuleDefinitionData {
    return {
        ...data,
        id: `${idPrefix}${data.id}`,
        pins: data.pins.map((pin) => clonePinData(pin, idPrefix)),
        components: data.components.map((component) => cloneComponentData(component, idPrefix)),
        wires: data.wires.map((wire) => cloneWireData(wire, idPrefix)),
    }
}

function resetWireSignals(wires: WireData[]): WireData[] {
    return wires.map((wire) => ({
        ...wire,
        fixedSignal: null,
    }))
}

function normalizeComponentForLibrary(component: ComponentData): ComponentData {
    if (component.type === "module") {
        return {
            ...component,
            components: component.components.map(normalizeComponentForLibrary),
            wires: resetWireSignals(component.wires),
        }
    }

    if (component.type === "moduleInstance") {
        return {
            ...component,
            pins: component.pins.map((pin) => ({ ...pin })),
        }
    }

    return { ...component }
}

export function normalizeModuleDefinitionForLibrary(data: ModuleDefinitionData): ModuleDefinitionData {
    return {
        ...data,
        pins: data.pins.map((pin) => ({ ...pin })),
        components: data.components.map(normalizeComponentForLibrary),
        wires: resetWireSignals(data.wires),
    }
}

export function instantiateModuleDefinition(
    data: ModuleDefinitionData,
    input: {
        idPrefix: string
        x: number
        y: number
    },
): Module {
    const module = deserializeModule(cloneModuleDefinition(data, input.idPrefix))
    module.moveBy(input.x - module.x, input.y - module.y)
    return module
}
