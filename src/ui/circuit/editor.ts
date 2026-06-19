import { Component } from "../../domain/circuit/Model/Component"
import { InputSource } from "../../domain/circuit/Model/InputSource"
import { Module } from "../../domain/circuit/Model/Module"
import { Pin } from "../../domain/circuit/Model/Pin"
import { PowerSource, type PowerSourceKind } from "../../domain/circuit/Model/PowerSource"
import { Transistor, type TransistorKind } from "../../domain/circuit/Model/Transistor"
import { Wire } from "../../domain/circuit/Model/Wire"
import { gridMajor, pinHitRadius, wireHitRadius } from "../constants"
import { clamp, closestPointOnSegment, distance, snap } from "../geometry"
import type { PendingConnection, PinHit, Point, WireHit } from "../types"

export function findComponentById(component: Component, id: string): Component | null {
    if (component.id === id) {
        return component
    }

    if (component instanceof Module) {
        for (const child of component.children) {
            const match = findComponentById(child, id)
            if (match) {
                return match
            }
        }
    }

    return null
}

function findParentModule(module: Module, componentId: string): Module | null {
    if (module.children.some((child) => child.id === componentId)) {
        return module
    }

    for (const child of module.children) {
        if (child instanceof Module) {
            const parent = findParentModule(child, componentId)
            if (parent) {
                return parent
            }
        }
    }

    return null
}

function pointInComponent(point: Point, component: Component) {
    return point.x >= component.x
        && point.x <= component.x + component.width
        && point.y >= component.y
        && point.y <= component.y + component.height
}

export function findComponentAt(module: Module, point: Point, scale: number): Component | null {
    for (const child of [...module.children].reverse()) {
        if (child instanceof Module && scale >= child.detailScale) {
            const nested = findComponentAt(child, point, scale)
            if (nested) {
                return nested
            }
        }

        if (pointInComponent(point, child)) {
            return child
        }
    }

    return null
}

function pinsForComponent(component: Component) {
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

function collectPins(component: Component): Pin[] {
    const pins = [...pinsForComponent(component)]

    if (component instanceof Module) {
        for (const child of component.children) {
            pins.push(...collectPins(child))
        }
    }

    return pins
}

function removeWiresConnectedTo(module: Module, pins: Set<Pin>) {
    module.wires = module.wires.filter((wire) => !wire.connections.some((pin) => pins.has(pin)))

    for (const child of module.children) {
        if (child instanceof Module) {
            removeWiresConnectedTo(child, pins)
        }
    }
}

function collectWires(module: Module): Wire[] {
    const wires = [...module.wires]

    for (const child of module.children) {
        if (child instanceof Module) {
            wires.push(...collectWires(child))
        }
    }

    return wires
}

function findRemovableComponent(root: Module, componentId: string) {
    const parent = findParentModule(root, componentId)
    if (!parent) {
        return null
    }

    const component = parent.children.find((child) => child.id === componentId)
    if (!component) {
        return null
    }

    if (parent !== root && !(component instanceof Module)) {
        return null
    }

    return { parent, component }
}

export function canRemoveComponent(root: Module, componentId: string) {
    return findRemovableComponent(root, componentId) !== null
}

export function removeComponent(root: Module, componentId: string) {
    const removable = findRemovableComponent(root, componentId)
    if (!removable) {
        return false
    }

    const removedPins = new Set(collectPins(removable.component))
    removable.parent.children = removable.parent.children.filter((child) => child.id !== componentId)
    removeWiresConnectedTo(root, removedPins)
    return true
}

function findWireOwner(module: Module, wireId: string): Module | null {
    if (module.wires.some((wire) => wire.id === wireId)) {
        return module
    }

    for (const child of module.children) {
        if (child instanceof Module) {
            const owner = findWireOwner(child, wireId)
            if (owner) {
                return owner
            }
        }
    }

    return null
}

function rebuildWireNetworks(module: Module) {
    const wires = collectWires(module)
    const activeWires = new Set(wires)

    for (const wire of wires) {
        wire.resetNetwork()
        wire.connectedWires = wire.connectedWires.filter((connected) => activeWires.has(connected))
    }

    for (const wire of wires) {
        for (const connected of wire.connectedWires) {
            wire.connectWire(connected)
        }
    }
}

export function removeWire(root: Module, wireId: string) {
    const owner = findWireOwner(root, wireId)
    const wire = findWireById(root, wireId)

    if (!owner || !wire) {
        return false
    }

    for (const pin of wire.connections) {
        if (pin.wire === wire) {
            pin.wire = null
        }
    }

    for (const connected of [...wire.connectedWires]) {
        wire.disconnectWire(connected)
    }

    owner.wires = owner.wires.filter((candidate) => candidate !== wire)
    rebuildWireNetworks(root)
    return true
}

export function syncDirectWires(module: Module) {
    for (const wire of module.wires) {
        if (wire.connections.length === 2 && wire.points.length === 2) {
            wire.points[0].x = wire.connections[0].x
            wire.points[0].y = wire.connections[0].y
            wire.points[1].x = wire.connections[1].x
            wire.points[1].y = wire.connections[1].y
        } else if (wire.connections.length === 1 && wire.points.length === 2) {
            wire.points[0].x = wire.connections[0].x
            wire.points[0].y = wire.connections[0].y
        }
    }

    for (const child of module.children) {
        if (child instanceof Module) {
            syncDirectWires(child)
        }
    }
}

export function findPinAt(module: Module, point: Point, scale: number): PinHit | null {
    for (const child of [...module.children].reverse()) {
        if (child instanceof Module && scale >= child.detailScale) {
            const nested = findPinAt(child, point, scale)
            if (nested) {
                return nested
            }
        }

        for (const pin of pinsForComponent(child)) {
            if (distance(point, pin) <= pinHitRadius / scale) {
                return { pin, ownerId: child.id }
            }
        }
    }

    for (const pin of module.pins) {
        if (distance(point, pin) <= pinHitRadius / scale) {
            return { pin, ownerId: module.id }
        }
    }

    return null
}

function findPinById(module: Module, id: string): Pin | null {
    for (const pin of module.pins) {
        if (pin.id === id) {
            return pin
        }
    }

    for (const child of module.children) {
        for (const pin of pinsForComponent(child)) {
            if (pin.id === id) {
                return pin
            }
        }

        if (child instanceof Module) {
            const nested = findPinById(child, id)
            if (nested) {
                return nested
            }
        }
    }

    return null
}

function findWireById(module: Module, id: string): Wire | null {
    for (const wire of module.wires) {
        if (wire.id === id) {
            return wire
        }
    }

    for (const child of module.children) {
        if (child instanceof Module) {
            const nested = findWireById(child, id)
            if (nested) {
                return nested
            }
        }
    }

    return null
}

export function findWireAt(module: Module, point: Point, scale: number): WireHit | null {
    let closest: WireHit | null = null
    let closestDistance = wireHitRadius / scale

    for (const wire of collectWires(module)) {
        for (let index = 0; index < wire.points.length - 1; index += 1) {
            const hitPoint = closestPointOnSegment(point, wire.points[index], wire.points[index + 1])
            const hitDistance = distance(point, hitPoint)

            if (hitDistance <= closestDistance) {
                closest = { wire, point: hitPoint }
                closestDistance = hitDistance
            }
        }
    }

    return closest
}

export function addTransistorTo(module: Module, kind: TransistorKind, center: Point) {
    const count = module.children.filter((child) => child instanceof Transistor).length + 1
    const prefix = kind === "pmos" ? "P" : "N"
    const transistor = new Transistor({
        id: `${kind}-${Date.now()}`,
        name: `${prefix}${count}`,
        kind,
        x: snap(center.x - 42),
        y: snap(center.y - 66),
    })

    module.addChild(transistor)
    return transistor
}

export function addPowerSourceTo(module: Module, kind: PowerSourceKind, center: Point) {
    const count = module.children.filter((child) => child instanceof PowerSource && child.kind === kind).length + 1
    const source = new PowerSource({
        id: `${kind}-${Date.now()}`,
        kind,
        x: snap(center.x - 44),
        y: snap(center.y - 34),
    })
    source.name = kind === "vdd" ? `VDD${count}` : `GND${count}`

    module.addChild(source)
    return source
}

export function addInputSourceTo(module: Module, center: Point) {
    const count = module.children.filter((child) => child instanceof InputSource).length + 1
    const input = new InputSource({
        id: `input-${Date.now()}`,
        name: `IN${count}`,
        x: snap(center.x - 44),
        y: snap(center.y - 34),
    })

    module.addChild(input)
    return input
}

function modulePinPosition(module: Module, target: Point, index: number, total: number) {
    const leftDistance = Math.abs(target.x - module.x)
    const rightDistance = Math.abs(target.x - (module.x + module.width))
    const topDistance = Math.abs(target.y - module.y)
    const bottomDistance = Math.abs(target.y - (module.y + module.height))
    const closest = Math.min(leftDistance, rightDistance, topDistance, bottomDistance)
    const spacing = module.height / (total + 1)

    if (closest === leftDistance) {
        return { x: module.x, y: module.y + spacing * (index + 1) }
    }

    if (closest === rightDistance) {
        return { x: module.x + module.width, y: module.y + spacing * (index + 1) }
    }

    if (closest === topDistance) {
        return { x: clamp(target.x, module.x + 28, module.x + module.width - 28), y: module.y }
    }

    return { x: clamp(target.x, module.x + 28, module.x + module.width - 28), y: module.y + module.height }
}

function roleForBoundaryPins(pins: Pin[]) {
    if (pins.some((pin) => pin.role === "output")) {
        return "output"
    }

    if (pins.some((pin) => pin.role === "input")) {
        return "input"
    }

    return "bidirectional"
}

export function createModuleFromSelection(root: Module, componentIds: readonly string[]) {
    const selectedIds = new Set(componentIds)
    const selected = [...selectedIds]
        .map((id) => {
            const component = findComponentById(root, id)
            const parent = findParentModule(root, id)
            return component && parent ? { component, parent } : null
        })
        .filter((item): item is { component: Component; parent: Module } => item !== null)

    if (selected.length === 0) {
        return null
    }

    const parent = selected[0].parent
    if (selected.some((item) => item.parent !== parent || item.component === root)) {
        return null
    }

    const components = selected.map((item) => item.component)
    const minX = Math.min(...components.map((component) => component.x))
    const minY = Math.min(...components.map((component) => component.y))
    const maxX = Math.max(...components.map((component) => component.x + component.width))
    const maxY = Math.max(...components.map((component) => component.y + component.height))
    const padding = 48
    const internalPins = new Set(components.flatMap(collectPins))
    const moduleWires: Wire[] = []
    const boundaryWires: Array<{ wire: Wire; pins: Pin[] }> = []

    parent.wires = parent.wires.filter((wire) => {
        const pinsInside = wire.connections.filter((pin) => internalPins.has(pin))
        const isInternal = pinsInside.length > 0 && pinsInside.length === wire.connections.length

        if (isInternal) {
            moduleWires.push(wire)
        } else if (pinsInside.length > 0) {
            boundaryWires.push({ wire, pins: pinsInside })
        }

        return !isInternal
    })

    parent.children = parent.children.filter((component) => !selectedIds.has(component.id))

    const count = parent.children.filter((component) => component instanceof Module).length + 1
    const module = new Module({
        id: `module-${Date.now()}`,
        name: `Module ${count}`,
        x: snap(minX - padding),
        y: snap(minY - padding),
        width: Math.max(gridMajor, snap(maxX - minX + padding * 2)),
        height: Math.max(gridMajor, snap(maxY - minY + padding * 2)),
        children: components,
        wires: moduleWires,
        detailScale: 0.85,
    })

    for (const [index, boundary] of boundaryWires.entries()) {
        const center = {
            x: boundary.pins.reduce((sum, pin) => sum + pin.x, 0) / boundary.pins.length,
            y: boundary.pins.reduce((sum, pin) => sum + pin.y, 0) / boundary.pins.length,
        }
        const position = modulePinPosition(module, center, index, boundaryWires.length)
        const modulePin = new Pin({
            id: `${module.id}:port-${index + 1}`,
            label: boundary.pins[0].label,
            role: roleForBoundaryPins(boundary.pins),
            x: position.x,
            y: position.y,
        })
        const bridgeWire = new Wire({
            id: `${module.id}:bridge-${index + 1}`,
            points: [position, center],
        })

        bridgeWire.connect(modulePin)
        for (const pin of boundary.pins) {
            bridgeWire.connect(pin)
        }

        boundary.wire.connections = [
            ...boundary.wire.connections.filter((pin) => !internalPins.has(pin)),
            modulePin,
        ]
        boundary.wire.connectWire(bridgeWire)
        boundary.wire.points = boundary.wire.points.map((point) => (
            boundary.pins.some((pin) => distance(point, pin) < 1)
                ? { x: modulePin.x, y: modulePin.y }
                : point
        ))

        module.pins.push(modulePin)
        moduleWires.push(bridgeWire)
    }

    parent.addChild(module)
    return module
}

export function toggleInputAt(root: Module, point: Point, scale: number) {
    const component = findComponentAt(root, point, scale)
    if (!(component instanceof InputSource)) {
        return false
    }

    component.toggle()
    return true
}

function connectPins(root: Module, from: Pin, to: Pin) {
    const wire = new Wire({
        id: `wire-${Date.now()}`,
        points: [
            { x: from.x, y: from.y },
            { x: to.x, y: to.y },
        ],
    })

    if (from.wire) {
        wire.connectWire(from.wire)
    }
    if (to.wire) {
        wire.connectWire(to.wire)
    }
    wire.connect(from)
    wire.connect(to)
    root.addWire(wire)
}

function connectPinToWire(root: Module, pin: Pin, targetWire: Wire, point: Point) {
    const wire = new Wire({
        id: `wire-${Date.now()}`,
        points: [
            { x: pin.x, y: pin.y },
            { x: point.x, y: point.y },
        ],
    })

    if (pin.wire) {
        wire.connectWire(pin.wire)
    }
    wire.connect(pin)
    wire.connectWire(targetWire)
    root.addWire(wire)
}

function connectWires(root: Module, fromWire: Wire, fromPoint: Point, toWire: Wire, toPoint: Point) {
    const wire = new Wire({
        id: `wire-${Date.now()}`,
        points: [
            { x: fromPoint.x, y: fromPoint.y },
            { x: toPoint.x, y: toPoint.y },
        ],
    })

    wire.connectWire(fromWire)
    wire.connectWire(toWire)
    root.addWire(wire)
}

export function connectEndpoints(root: Module, from: PendingConnection, to: PendingConnection) {
    if (from.type === "pin" && to.type === "pin") {
        const fromPin = findPinById(root, from.pinId)
        const toPin = findPinById(root, to.pinId)
        if (fromPin && toPin && fromPin !== toPin) {
            connectPins(root, fromPin, toPin)
        }
        return
    }

    if (from.type === "pin" && to.type === "wire") {
        const fromPin = findPinById(root, from.pinId)
        const toWire = findWireById(root, to.wireId)
        if (fromPin && toWire) {
            connectPinToWire(root, fromPin, toWire, to.point)
        }
        return
    }

    if (from.type === "wire" && to.type === "pin") {
        const fromWire = findWireById(root, from.wireId)
        const toPin = findPinById(root, to.pinId)
        if (fromWire && toPin) {
            connectPinToWire(root, toPin, fromWire, from.point)
        }
        return
    }

    if (from.type === "wire" && to.type === "wire") {
        const fromWire = findWireById(root, from.wireId)
        const toWire = findWireById(root, to.wireId)
        if (fromWire && toWire && fromWire !== toWire) {
            connectWires(root, fromWire, from.point, toWire, to.point)
        }
    }
}

export function pendingConnectionPoint(root: Module, connection: PendingConnection): Point | null {
    if (connection.type === "wire") {
        return connection.point
    }

    return findPinById(root, connection.pinId)
}
