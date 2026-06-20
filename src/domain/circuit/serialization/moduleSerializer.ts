import { Component } from "../Model/Component"
import { InputSource } from "../Model/InputSource"
import { Module } from "../Model/Module"
import { Pin } from "../Model/Pin"
import { PowerSource } from "../Model/PowerSource"
import { Transistor } from "../Model/Transistor"
import { Wire } from "../Model/Wire"
import {
    circuitSchemaVersion,
    type ComponentData,
    type EmbeddedModuleData,
    type InputSourceData,
    type ModuleDefinitionData,
    type ModuleInstanceData,
    type PinData,
    type PowerSourceData,
    type TransistorData,
    type WireData,
} from "../schema/CircuitSchema"

const defaultModuleVersion = "1.0.0"

type SerializableModuleData = ModuleDefinitionData | EmbeddedModuleData

type PendingWireConnection = {
    wireId: string
    connectedWireId: string
}

function collectWireIds(module: Module, wireIds = new Set<string>()) {
    for (const wire of module.wires) {
        wireIds.add(wire.id)
    }

    for (const child of module.children) {
        if (child instanceof Module) {
            collectWireIds(child, wireIds)
        }
    }

    return wireIds
}

function serializePin(pin: Pin): PinData {
    return {
        id: pin.id,
        label: pin.label,
        role: pin.role,
        x: pin.x,
        y: pin.y,
    }
}

function serializeWire(wire: Wire, includedWireIds: ReadonlySet<string>): WireData {
    return {
        id: wire.id,
        label: wire.label,
        points: wire.points.map((point) => ({ x: point.x, y: point.y })),
        fixedSignal: wire.localFixedSignal,
        connectionPinIds: wire.connections.map((pin) => pin.id),
        connectedWireIds: wire.connectedWires
            .filter((connectedWire) => includedWireIds.has(connectedWire.id))
            .map((connectedWire) => connectedWire.id),
    }
}

function serializeComponent(component: Component, includedWireIds: ReadonlySet<string>): ComponentData {
    if (component instanceof Transistor) {
        return {
            type: "transistor",
            id: component.id,
            name: component.name,
            kind: component.kind,
            x: component.x,
            y: component.y,
        }
    }

    if (component instanceof PowerSource) {
        return {
            type: "powerSource",
            id: component.id,
            name: component.name,
            kind: component.kind,
            x: component.x,
            y: component.y,
        }
    }

    if (component instanceof InputSource) {
        return {
            type: "inputSource",
            id: component.id,
            name: component.name,
            value: component.value,
            x: component.x,
            y: component.y,
        }
    }

    if (component instanceof Module) {
        return serializeEmbeddedModule(component, includedWireIds)
    }

    throw new Error(`Unsupported component type: ${component.constructor.name}`)
}

function serializeEmbeddedModule(module: Module, includedWireIds: ReadonlySet<string>): EmbeddedModuleData {
    return {
        type: "module",
        id: module.id,
        name: module.name,
        x: module.x,
        y: module.y,
        width: module.width,
        height: module.height,
        pins: module.pins.map(serializePin),
        components: module.children.map((component) => serializeComponent(component, includedWireIds)),
        wires: module.wires.map((wire) => serializeWire(wire, includedWireIds)),
        detailScale: module.detailScale,
    }
}

function deserializePin(data: PinData): Pin {
    return new Pin({
        id: data.id,
        label: data.label,
        role: data.role,
        x: data.x,
        y: data.y,
    })
}

function deserializeTransistor(data: TransistorData): Transistor {
    return new Transistor({
        id: data.id,
        name: data.name,
        kind: data.kind,
        x: data.x,
        y: data.y,
    })
}

function deserializePowerSource(data: PowerSourceData): PowerSource {
    const source = new PowerSource({
        id: data.id,
        kind: data.kind,
        x: data.x,
        y: data.y,
    })
    source.name = data.name
    return source
}

function deserializeInputSource(data: InputSourceData): InputSource {
    return new InputSource({
        id: data.id,
        name: data.name,
        value: data.value,
        x: data.x,
        y: data.y,
    })
}

function deserializeModuleInstance(data: ModuleInstanceData): Module {
    return new Module({
        id: data.id,
        name: data.name,
        x: data.x,
        y: data.y,
        width: data.width,
        height: data.height,
        pins: data.pins.map(deserializePin),
        detailScale: data.detailScale,
    })
}

function deserializeComponent(
    data: ComponentData,
    wireIndex: Map<string, Wire>,
    pendingWireConnections: PendingWireConnection[],
): Component {
    switch (data.type) {
        case "transistor":
            return deserializeTransistor(data)
        case "powerSource":
            return deserializePowerSource(data)
        case "inputSource":
            return deserializeInputSource(data)
        case "moduleInstance":
            return deserializeModuleInstance(data)
        case "module":
            return deserializeModuleShape(data, wireIndex, pendingWireConnections)
    }
}

function pinsForComponent(component: Component): Pin[] {
    if (component instanceof Transistor) {
        return [component.gate, component.source, component.drain]
    }

    if (component instanceof PowerSource) {
        return [component.output]
    }

    if (component instanceof InputSource) {
        return [component.output]
    }

    if (component instanceof Module) {
        return component.pins
    }

    return []
}

function indexPins(module: Module) {
    const pins = new Map<string, Pin>()

    for (const pin of module.pins) {
        pins.set(pin.id, pin)
    }

    for (const child of module.children) {
        for (const pin of pinsForComponent(child)) {
            pins.set(pin.id, pin)
        }
    }

    return pins
}

export function serializeModule(module: Module): ModuleDefinitionData {
    const includedWireIds = collectWireIds(module)

    return {
        kind: "assemblying.module",
        schemaVersion: circuitSchemaVersion,
        id: module.id,
        name: module.name,
        version: defaultModuleVersion,
        bounds: {
            x: module.x,
            y: module.y,
            width: module.width,
            height: module.height,
        },
        pins: module.pins.map(serializePin),
        components: module.children.map((component) => serializeComponent(component, includedWireIds)),
        wires: module.wires.map((wire) => serializeWire(wire, includedWireIds)),
        detailScale: module.detailScale,
    }
}

function deserializeModuleShape(
    data: SerializableModuleData,
    wireIndex: Map<string, Wire>,
    pendingWireConnections: PendingWireConnection[],
): Module {
    const module = new Module({
        id: data.id,
        name: data.name,
        x: "bounds" in data ? data.bounds.x : data.x,
        y: "bounds" in data ? data.bounds.y : data.y,
        width: "bounds" in data ? data.bounds.width : data.width,
        height: "bounds" in data ? data.bounds.height : data.height,
        pins: data.pins.map(deserializePin),
        children: data.components.map((component) => (
            deserializeComponent(component, wireIndex, pendingWireConnections)
        )),
        detailScale: data.detailScale,
    })
    const pins = indexPins(module)

    for (const wireData of data.wires) {
        const wire = new Wire({
            id: wireData.id,
            label: wireData.label,
            points: wireData.points.map((point) => ({ x: point.x, y: point.y })),
            signal: wireData.fixedSignal,
        })

        for (const pinId of wireData.connectionPinIds) {
            const pin = pins.get(pinId)
            if (!pin) {
                throw new Error(`Wire ${wireData.id} references missing pin ${pinId}`)
            }
            wire.connect(pin)
        }

        wireIndex.set(wire.id, wire)
        module.addWire(wire)

        for (const connectedWireId of wireData.connectedWireIds) {
            pendingWireConnections.push({ wireId: wireData.id, connectedWireId })
        }
    }

    return module
}

export function deserializeModule(data: ModuleDefinitionData): Module {
    if (data.kind !== "assemblying.module") {
        throw new Error(`Unsupported module kind: ${data.kind}`)
    }

    if (data.schemaVersion !== circuitSchemaVersion) {
        throw new Error(`Unsupported module schema version: ${data.schemaVersion}`)
    }

    const wireIndex = new Map<string, Wire>()
    const pendingWireConnections: PendingWireConnection[] = []
    const module = deserializeModuleShape(data, wireIndex, pendingWireConnections)

    for (const { wireId, connectedWireId } of pendingWireConnections) {
        const wire = wireIndex.get(wireId)
        const connectedWire = wireIndex.get(connectedWireId)

        if (!wire) {
            throw new Error(`Missing wire ${wireId}`)
        }

        if (!connectedWire) {
            throw new Error(`Wire ${wireId} references missing wire ${connectedWireId}`)
        }

        wire.connectWire(connectedWire)
    }

    return module
}
