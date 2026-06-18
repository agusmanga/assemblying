import { useEffect, useRef, useState, type CSSProperties } from "react"
import { Component } from "./domain/circuit/Model/Component"
import { InputSource } from "./domain/circuit/Model/InputSource"
import { Module } from "./domain/circuit/Model/Module"
import type { Pin } from "./domain/circuit/Model/Pin"
import { PowerSource, type PowerSourceKind } from "./domain/circuit/Model/PowerSource"
import { Transistor, type TransistorKind } from "./domain/circuit/Model/Transistor"
import { Wire } from "./domain/circuit/Model/Wire"
import { createSampleCircuit } from "./domain/circuit/sampleCircuit"

type Point = {
    x: number
    y: number
}

type Viewport = Point & {
    scale: number
}

type DragState =
    | {
        type: "pan"
        pointerId: number
        x: number
        y: number
        viewport: Viewport
    }
    | {
        type: "component"
        pointerId: number
        componentId: string
        previousWorld: Point
    }

type PinHit = {
    pin: Pin
    ownerId: string
}

type WireHit = {
    wire: Wire
    point: Point
}

type PendingConnection =
    | {
        type: "pin"
        pinId: string
    }
    | {
        type: "wire"
        wireId: string
        point: Point
    }

const minScale = 0.22
const maxScale = 3.4
const gridMinor = 24
const gridMajor = 120
const pinHitRadius = 14
const wireHitRadius = 10

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value))
}

function distance(a: Point, b: Point) {
    return Math.hypot(a.x - b.x, a.y - b.y)
}

function closestPointOnSegment(point: Point, a: Point, b: Point) {
    const dx = b.x - a.x
    const dy = b.y - a.y
    const lengthSquared = dx * dx + dy * dy

    if (lengthSquared === 0) {
        return a
    }

    const t = clamp(((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared, 0, 1)
    return {
        x: a.x + dx * t,
        y: a.y + dy * t,
    }
}

function snap(value: number, size = 24) {
    return Math.round(value / size) * size
}

function screenToWorld(x: number, y: number, viewport: Viewport) {
    return {
        x: (x - viewport.x) / viewport.scale,
        y: (y - viewport.y) / viewport.scale,
    }
}

function setupCanvas(canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d")
    if (!context) {
        return null
    }

    const rect = canvas.getBoundingClientRect()
    const pixelRatio = window.devicePixelRatio || 1
    canvas.width = Math.floor(rect.width * pixelRatio)
    canvas.height = Math.floor(rect.height * pixelRatio)
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

    return {
        context,
        width: rect.width,
        height: rect.height,
    }
}

function strokePath(context: CanvasRenderingContext2D, points: Point[]) {
    if (points.length === 0) {
        return
    }

    context.beginPath()
    context.moveTo(points[0].x, points[0].y)
    for (const point of points.slice(1)) {
        context.lineTo(point.x, point.y)
    }
    context.stroke()
}

function drawGrid(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    viewport: Viewport,
) {
    context.save()
    context.fillStyle = "#f6f1e8"
    context.fillRect(0, 0, width, height)

    const topLeft = screenToWorld(0, 0, viewport)
    const bottomRight = screenToWorld(width, height, viewport)

    context.translate(viewport.x, viewport.y)
    context.scale(viewport.scale, viewport.scale)

    for (const size of [gridMinor, gridMajor]) {
        context.beginPath()
        const startX = Math.floor(topLeft.x / size) * size
        const endX = Math.ceil(bottomRight.x / size) * size
        const startY = Math.floor(topLeft.y / size) * size
        const endY = Math.ceil(bottomRight.y / size) * size

        for (let x = startX; x <= endX; x += size) {
            context.moveTo(x, startY)
            context.lineTo(x, endY)
        }

        for (let y = startY; y <= endY; y += size) {
            context.moveTo(startX, y)
            context.lineTo(endX, y)
        }

        context.lineWidth = size === gridMajor ? 1.2 / viewport.scale : 0.7 / viewport.scale
        context.strokeStyle = size === gridMajor ? "rgba(42, 68, 60, 0.15)" : "rgba(42, 68, 60, 0.07)"
        context.stroke()
    }

    context.restore()
}

function drawWire(context: CanvasRenderingContext2D, wire: Wire, scale: number, selected: boolean) {
    context.save()
    context.lineWidth = (selected ? 7 : 4) / scale
    context.lineCap = "round"
    context.lineJoin = "round"
    context.strokeStyle = selected
        ? "#d68f00"
        : wire.signal === 1 ? "#d1493f" : wire.signal === 0 ? "#3867d6" : "#263b35"
    strokePath(context, wire.points)

    for (const point of wire.points) {
        context.beginPath()
        context.arc(point.x, point.y, 5 / scale, 0, Math.PI * 2)
        context.fillStyle = context.strokeStyle
        context.fill()
    }
    context.restore()
}

function drawPin(
    context: CanvasRenderingContext2D,
    pin: Pin,
    scale: number,
    highlighted: boolean,
) {
    context.save()
    context.beginPath()
    context.arc(pin.x, pin.y, (highlighted ? 10 : 7) / scale, 0, Math.PI * 2)
    context.fillStyle = highlighted ? "#ffe08a" : "#fffdf8"
    context.strokeStyle = highlighted ? "#b26b00" : "#263b35"
    context.lineWidth = (highlighted ? 3 : 2) / scale
    context.fill()
    context.stroke()

    if (scale > 0.78) {
        context.fillStyle = "#263b35"
        context.font = `${12 / scale}px Inter, sans-serif`
        context.textAlign = "center"
        context.fillText(pin.label, pin.x, pin.y - 12 / scale)
    }
    context.restore()
}

function drawSelection(context: CanvasRenderingContext2D, component: Component, scale: number) {
    context.save()
    context.strokeStyle = "#d68f00"
    context.lineWidth = 2 / scale
    context.setLineDash([10 / scale, 7 / scale])
    context.beginPath()
    context.roundRect(
        component.x - 10 / scale,
        component.y - 10 / scale,
        component.width + 20 / scale,
        component.height + 20 / scale,
        10 / scale,
    )
    context.stroke()
    context.restore()
}

function drawTransistor(
    context: CanvasRenderingContext2D,
    transistor: Transistor,
    scale: number,
    selectedId: string | null,
    pendingPinId: string | null,
) {
    const centerY = transistor.y + transistor.height / 2
    const top = transistor.y + 22
    const bottom = transistor.y + transistor.height - 22
    const channelX = transistor.x + 48
    const terminalX = transistor.x + transistor.width

    context.save()
    context.lineCap = "round"
    context.lineJoin = "round"
    context.strokeStyle = transistor.kind === "pmos" ? "#8d3f7c" : "#1f6f64"
    context.lineWidth = 4 / scale

    context.beginPath()
    context.roundRect(transistor.x + 18, transistor.y + 10, 48, transistor.height - 20, 12)
    context.strokeStyle = "rgba(38, 59, 53, 0.25)"
    context.stroke()

    context.strokeStyle = transistor.kind === "pmos" ? "#8d3f7c" : "#1f6f64"
    context.beginPath()
    context.moveTo(channelX, top)
    context.lineTo(channelX, bottom)
    context.moveTo(transistor.x, centerY)
    context.lineTo(channelX - 14, centerY)
    context.moveTo(channelX, top)
    context.lineTo(terminalX, top)
    context.moveTo(channelX, bottom)
    context.lineTo(terminalX, bottom)
    context.stroke()

    if (transistor.kind === "pmos") {
        context.beginPath()
        context.arc(channelX - 20, centerY, 7 / scale, 0, Math.PI * 2)
        context.fillStyle = "#fffdf8"
        context.stroke()
        context.fill()
    }

    context.fillStyle = "#263b35"
    context.font = `${15 / scale}px Inter, sans-serif`
    context.textAlign = "center"
    context.fillText(transistor.name, transistor.x + transistor.width / 2, transistor.y - 12 / scale)

    drawPin(context, transistor.gate, scale, pendingPinId === transistor.gate.id)
    drawPin(context, transistor.source, scale, pendingPinId === transistor.source.id)
    drawPin(context, transistor.drain, scale, pendingPinId === transistor.drain.id)

    if (selectedId === transistor.id) {
        drawSelection(context, transistor, scale)
    }
    context.restore()
}

function drawPowerSource(
    context: CanvasRenderingContext2D,
    source: PowerSource,
    scale: number,
    selectedId: string | null,
    pendingPinId: string | null,
) {
    const centerY = source.y + source.height / 2
    const color = source.kind === "vdd" ? "#d1493f" : "#3867d6"

    context.save()
    context.fillStyle = "#fffdf8"
    context.strokeStyle = color
    context.lineWidth = 3 / scale
    context.beginPath()
    context.roundRect(source.x, source.y, source.width, source.height, 8)
    context.fill()
    context.stroke()

    context.strokeStyle = color
    context.lineWidth = 4 / scale
    context.lineCap = "round"
    context.beginPath()
    if (source.kind === "vdd") {
        context.moveTo(source.x + 20, centerY - 12)
        context.lineTo(source.x + 34, centerY - 12)
        context.moveTo(source.x + 27, centerY - 19)
        context.lineTo(source.x + 27, centerY - 5)
        context.moveTo(source.x + 48, centerY - 12)
        context.lineTo(source.x + 62, centerY - 12)
    } else {
        context.moveTo(source.x + 22, centerY - 12)
        context.lineTo(source.x + 62, centerY - 12)
        context.moveTo(source.x + 30, centerY)
        context.lineTo(source.x + 54, centerY)
        context.moveTo(source.x + 38, centerY + 12)
        context.lineTo(source.x + 46, centerY + 12)
    }
    context.stroke()

    context.fillStyle = "#263b35"
    context.font = `${13 / scale}px Inter, sans-serif`
    context.textAlign = "center"
    context.fillText(source.name, source.x + source.width / 2, source.y - 10 / scale)

    drawPin(context, source.output, scale, pendingPinId === source.output.id)

    if (selectedId === source.id) {
        drawSelection(context, source, scale)
    }
    context.restore()
}

function drawInputSource(
    context: CanvasRenderingContext2D,
    input: InputSource,
    scale: number,
    selectedId: string | null,
    pendingPinId: string | null,
) {
    const color = input.value === 1 ? "#d1493f" : "#3867d6"

    context.save()
    context.fillStyle = input.value === 1 ? "#fff7f4" : "#f5f8ff"
    context.strokeStyle = color
    context.lineWidth = 3 / scale
    context.beginPath()
    context.roundRect(input.x, input.y, input.width, input.height, 8)
    context.fill()
    context.stroke()

    context.fillStyle = color
    context.font = `${26 / scale}px Inter, sans-serif`
    context.textAlign = "center"
    context.textBaseline = "middle"
    context.fillText(String(input.value), input.x + input.width / 2, input.y + input.height / 2)

    context.fillStyle = "#263b35"
    context.font = `${13 / scale}px Inter, sans-serif`
    context.fillText(input.name, input.x + input.width / 2, input.y - 10 / scale)
    context.textBaseline = "alphabetic"

    drawPin(context, input.output, scale, pendingPinId === input.output.id)

    if (selectedId === input.id) {
        drawSelection(context, input, scale)
    }
    context.restore()
}

function drawModuleShell(
    context: CanvasRenderingContext2D,
    module: Module,
    scale: number,
    selectedId: string | null,
    pendingPinId: string | null,
) {
    context.save()
    context.fillStyle = "#fffaf0"
    context.strokeStyle = "#263b35"
    context.lineWidth = 3 / scale
    context.beginPath()
    context.roundRect(module.x, module.y, module.width, module.height, 10)
    context.fill()
    context.stroke()

    context.fillStyle = "#263b35"
    context.font = `${Math.max(18 / scale, 18)}px Inter, sans-serif`
    context.textAlign = "center"
    context.fillText(module.name, module.x + module.width / 2, module.y + module.height / 2 - 8 / scale)

    context.fillStyle = "rgba(38, 59, 53, 0.68)"
    context.font = `${13 / scale}px Inter, sans-serif`
    context.fillText(
        `${module.children.length} parts`,
        module.x + module.width / 2,
        module.y + module.height / 2 + 22 / scale,
    )

    for (const pin of module.pins) {
        drawPin(context, pin, scale, pendingPinId === pin.id)
    }

    if (selectedId === module.id) {
        drawSelection(context, module, scale)
    }
    context.restore()
}

function drawModuleDetail(
    context: CanvasRenderingContext2D,
    module: Module,
    scale: number,
    selectedId: string | null,
    selectedWireId: string | null,
    pendingPinId: string | null,
) {
    context.save()
    context.fillStyle = "rgba(255, 250, 240, 0.48)"
    context.strokeStyle = "rgba(38, 59, 53, 0.25)"
    context.lineWidth = 2 / scale
    context.beginPath()
    context.roundRect(module.x, module.y, module.width, module.height, 12)
    context.fill()
    context.stroke()

    context.fillStyle = "rgba(38, 59, 53, 0.72)"
    context.font = `${18 / scale}px Inter, sans-serif`
    context.textAlign = "left"
    context.fillText(module.name, module.x + 18 / scale, module.y + 30 / scale)

    for (const wire of module.wires) {
        drawWire(context, wire, scale, selectedWireId === wire.id)
    }

    for (const child of module.children) {
        drawComponent(context, child, scale, selectedId, selectedWireId, pendingPinId)
    }

    for (const pin of module.pins) {
        drawPin(context, pin, scale, pendingPinId === pin.id)
    }

    if (selectedId === module.id) {
        drawSelection(context, module, scale)
    }
    context.restore()
}

function drawComponent(
    context: CanvasRenderingContext2D,
    component: Component,
    scale: number,
    selectedId: string | null,
    selectedWireId: string | null,
    pendingPinId: string | null,
) {
    if (component instanceof Transistor) {
        drawTransistor(context, component, scale, selectedId, pendingPinId)
        return
    }

    if (component instanceof PowerSource) {
        drawPowerSource(context, component, scale, selectedId, pendingPinId)
        return
    }

    if (component instanceof InputSource) {
        drawInputSource(context, component, scale, selectedId, pendingPinId)
        return
    }

    if (component instanceof Module) {
        if (scale >= component.detailScale) {
            drawModuleDetail(context, component, scale, selectedId, selectedWireId, pendingPinId)
        } else {
            drawModuleShell(context, component, scale, selectedId, pendingPinId)
        }
    }
}

function findComponentById(component: Component, id: string): Component | null {
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

function findComponentAt(module: Module, point: Point, scale: number): Component | null {
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

function removeComponent(root: Module, componentId: string) {
    const parent = findParentModule(root, componentId)
    if (!parent) {
        return false
    }

    const component = parent.children.find((child) => child.id === componentId)
    if (!component) {
        return false
    }

    const removedPins = new Set(collectPins(component))
    parent.children = parent.children.filter((child) => child.id !== componentId)
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

function removeWire(root: Module, wireId: string) {
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

function syncDirectWires(module: Module) {
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

function findPinAt(module: Module, point: Point, scale: number): PinHit | null {
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

function findWireAt(module: Module, point: Point, scale: number): WireHit | null {
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

function addTransistorTo(module: Module, kind: TransistorKind, center: Point) {
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

function addPowerSourceTo(module: Module, kind: PowerSourceKind, center: Point) {
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

function addInputSourceTo(module: Module, center: Point) {
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

function toggleInputAt(root: Module, point: Point, scale: number) {
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

function connectEndpoints(root: Module, from: PendingConnection, to: PendingConnection) {
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

function pendingConnectionPoint(root: Module, connection: PendingConnection): Point | null {
    if (connection.type === "wire") {
        return connection.point
    }

    return findPinById(root, connection.pinId)
}

export function App() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const dragRef = useRef<DragState | null>(null)
    const [circuit] = useState(() => createSampleCircuit())
    const [revision, setRevision] = useState(0)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [selectedWireId, setSelectedWireId] = useState<string | null>(null)
    const [pendingConnection, setPendingConnection] = useState<PendingConnection | null>(null)
    const [pointerWorld, setPointerWorld] = useState<Point | null>(null)
    const [isDraggingComponent, setIsDraggingComponent] = useState(false)
    const [viewport, setViewport] = useState<Viewport>({ x: 180, y: 90, scale: 0.86 })
    const pendingPinId = pendingConnection?.type === "pin" ? pendingConnection.pinId : null

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) {
            return
        }

        const frame = window.requestAnimationFrame(() => {
            const setup = setupCanvas(canvas)
            if (!setup) {
                return
            }

            circuit.evaluate()
            drawGrid(setup.context, setup.width, setup.height, viewport)
            setup.context.save()
            setup.context.translate(viewport.x, viewport.y)
            setup.context.scale(viewport.scale, viewport.scale)

            for (const wire of circuit.wires) {
                drawWire(setup.context, wire, viewport.scale, selectedWireId === wire.id)
            }

            for (const child of circuit.children) {
                drawComponent(setup.context, child, viewport.scale, selectedId, selectedWireId, pendingPinId)
            }

            if (pendingConnection && pointerWorld) {
                const pendingPoint = pendingConnectionPoint(circuit, pendingConnection)
                if (pendingPoint) {
                    setup.context.save()
                    setup.context.strokeStyle = "#b26b00"
                    setup.context.lineWidth = 3 / viewport.scale
                    setup.context.setLineDash([8 / viewport.scale, 7 / viewport.scale])
                    strokePath(setup.context, [pendingPoint, pointerWorld])
                    setup.context.restore()
                }
            }

            setup.context.restore()
        })

        return () => window.cancelAnimationFrame(frame)
    }, [circuit, pendingConnection, pendingPinId, pointerWorld, revision, selectedId, selectedWireId, viewport])

    useEffect(() => {
        const handleResize = () => setViewport((current) => ({ ...current }))
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    function rerenderCircuit() {
        syncDirectWires(circuit)
        setRevision((current) => current + 1)
    }

    function deleteSelected() {
        if (selectedWireId) {
            if (removeWire(circuit, selectedWireId)) {
                setSelectedWireId(null)
                setPendingConnection(null)
                rerenderCircuit()
            }
            return
        }

        if (selectedId && removeComponent(circuit, selectedId)) {
            setSelectedId(null)
            setPendingConnection(null)
            rerenderCircuit()
        }
    }

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== "Delete" && event.key !== "Backspace") {
                return
            }

            const target = event.target
            if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
                return
            }

            event.preventDefault()
            deleteSelected()
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    })

    function worldFromEvent(event: React.PointerEvent<HTMLCanvasElement>) {
        const rect = event.currentTarget.getBoundingClientRect()
        return screenToWorld(event.clientX - rect.left, event.clientY - rect.top, viewport)
    }

    function worldFromClientPoint(clientX: number, clientY: number) {
        const canvas = canvasRef.current
        if (!canvas) {
            return null
        }

        const rect = canvas.getBoundingClientRect()
        return screenToWorld(clientX - rect.left, clientY - rect.top, viewport)
    }

    function zoomAt(clientX: number, clientY: number, nextScale: number) {
        const canvas = canvasRef.current
        if (!canvas) {
            return
        }

        const rect = canvas.getBoundingClientRect()
        const x = clientX - rect.left
        const y = clientY - rect.top
        setViewport((current) => {
            const scale = clamp(nextScale, minScale, maxScale)
            const world = screenToWorld(x, y, current)
            return {
                scale,
                x: x - world.x * scale,
                y: y - world.y * scale,
            }
        })
    }

    function createTransistor(kind: TransistorKind) {
        const canvas = canvasRef.current
        if (!canvas) {
            return
        }

        const rect = canvas.getBoundingClientRect()
        const center = screenToWorld(rect.width / 2, rect.height / 2, viewport)
        const transistor = addTransistorTo(circuit, kind, center)
        setSelectedId(transistor.id)
        setSelectedWireId(null)
        setPendingConnection(null)
        rerenderCircuit()
    }

    function createPowerSource(kind: PowerSourceKind) {
        const canvas = canvasRef.current
        if (!canvas) {
            return
        }

        const rect = canvas.getBoundingClientRect()
        const center = screenToWorld(rect.width / 2, rect.height / 2, viewport)
        const source = addPowerSourceTo(circuit, kind, center)
        setSelectedId(source.id)
        setSelectedWireId(null)
        setPendingConnection(null)
        rerenderCircuit()
    }

    function createInputSource() {
        const canvas = canvasRef.current
        if (!canvas) {
            return
        }

        const rect = canvas.getBoundingClientRect()
        const center = screenToWorld(rect.width / 2, rect.height / 2, viewport)
        const input = addInputSourceTo(circuit, center)
        setSelectedId(input.id)
        setSelectedWireId(null)
        setPendingConnection(null)
        rerenderCircuit()
    }

    return <main style={appStyle}>
        <canvas
            ref={canvasRef}
            style={{
                width: "100%",
                height: "100%",
                display: "block",
                cursor: isDraggingComponent ? "grabbing" : "grab",
                touchAction: "none",
            }}
            onDoubleClick={(event) => {
                const world = worldFromClientPoint(event.clientX, event.clientY)
                if (!world) {
                    return
                }

                if (toggleInputAt(circuit, world, viewport.scale)) {
                    setPendingConnection(null)
                    rerenderCircuit()
                    return
                }

                zoomAt(event.clientX, event.clientY, viewport.scale * 1.7)
            }}
            onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId)
                const world = worldFromEvent(event)
                setPointerWorld(world)

                const pinHit = findPinAt(circuit, world, viewport.scale)
                if (pinHit) {
                    const nextConnection: PendingConnection = { type: "pin", pinId: pinHit.pin.id }
                    if (pendingConnection) {
                        connectEndpoints(circuit, pendingConnection, nextConnection)
                        rerenderCircuit()
                        setPendingConnection(null)
                    } else {
                        setPendingConnection(nextConnection)
                        setSelectedId(pinHit.ownerId)
                        setSelectedWireId(null)
                    }
                    return
                }

                const wireHit = findWireAt(circuit, world, viewport.scale)
                if (wireHit) {
                    const nextConnection: PendingConnection = {
                        type: "wire",
                        wireId: wireHit.wire.id,
                        point: wireHit.point,
                    }

                    if (pendingConnection) {
                        connectEndpoints(circuit, pendingConnection, nextConnection)
                        rerenderCircuit()
                        setPendingConnection(null)
                        setSelectedWireId(null)
                    } else {
                        setSelectedWireId(wireHit.wire.id)
                        setPendingConnection(nextConnection)
                        setSelectedId(null)
                    }
                    return
                }

                const component = findComponentAt(circuit, world, viewport.scale)
                if (component) {
                    setSelectedId(component.id)
                    setSelectedWireId(null)
                    setPendingConnection(null)
                    dragRef.current = {
                        type: "component",
                        pointerId: event.pointerId,
                        componentId: component.id,
                        previousWorld: world,
                    }
                    setIsDraggingComponent(true)
                    return
                }

                setSelectedId(null)
                setSelectedWireId(null)
                setPendingConnection(null)
                dragRef.current = {
                    type: "pan",
                    pointerId: event.pointerId,
                    x: event.clientX,
                    y: event.clientY,
                    viewport,
                }
            }}
            onPointerMove={(event) => {
                const world = worldFromEvent(event)
                setPointerWorld(world)

                const drag = dragRef.current
                if (!drag || drag.pointerId !== event.pointerId) {
                    return
                }

                if (drag.type === "pan") {
                    setViewport({
                        ...drag.viewport,
                        x: drag.viewport.x + event.clientX - drag.x,
                        y: drag.viewport.y + event.clientY - drag.y,
                    })
                    return
                }

                const component = findComponentById(circuit, drag.componentId)
                if (!component) {
                    return
                }

                component.moveBy(world.x - drag.previousWorld.x, world.y - drag.previousWorld.y)
                drag.previousWorld = world
                rerenderCircuit()
            }}
            onPointerUp={(event) => {
                if (dragRef.current?.pointerId === event.pointerId) {
                    dragRef.current = null
                    setIsDraggingComponent(false)
                }
            }}
            onPointerCancel={() => {
                dragRef.current = null
                setIsDraggingComponent(false)
            }}
            onWheel={(event) => {
                event.preventDefault()
                const zoom = Math.exp(-event.deltaY * 0.001)
                zoomAt(event.clientX, event.clientY, viewport.scale * zoom)
            }}
        />

        <section style={toolbarStyle}>
            <button
                aria-label="Create NMOS"
                title="Create NMOS"
                onClick={() => createTransistor("nmos")}
                style={{ ...toolButtonStyle, color: "#1f6f64" }}
            >
                N
            </button>
            <button
                aria-label="Create PMOS"
                title="Create PMOS"
                onClick={() => createTransistor("pmos")}
                style={{ ...toolButtonStyle, color: "#8d3f7c" }}
            >
                P
            </button>
            <button
                aria-label="Create VDD"
                title="Create VDD"
                onClick={() => createPowerSource("vdd")}
                style={{ ...toolButtonStyle, color: "#d1493f" }}
            >
                V
            </button>
            <button
                aria-label="Create GND"
                title="Create GND"
                onClick={() => createPowerSource("gnd")}
                style={{ ...toolButtonStyle, color: "#3867d6" }}
            >
                G
            </button>
            <button
                aria-label="Create input"
                title="Create input"
                onClick={createInputSource}
                style={{ ...toolButtonStyle, color: "#b26b00" }}
            >
                I
            </button>
            <button
                aria-label="Delete selected"
                title="Delete selected"
                disabled={!selectedId && !selectedWireId}
                onClick={deleteSelected}
                style={{
                    ...toolButtonStyle,
                    opacity: selectedId || selectedWireId ? 1 : 0.45,
                    cursor: selectedId || selectedWireId ? "pointer" : "default",
                }}
            >
                Del
            </button>
            <div style={dividerStyle} />
            <button
                aria-label="Zoom out"
                title="Zoom out"
                onClick={() => setViewport((current) => ({ ...current, scale: clamp(current.scale / 1.25, minScale, maxScale) }))}
                style={toolButtonStyle}
            >
                -
            </button>
            <div style={zoomStyle}>
                {Math.round(viewport.scale * 100)}%
            </div>
            <button
                aria-label="Zoom in"
                title="Zoom in"
                onClick={() => setViewport((current) => ({ ...current, scale: clamp(current.scale * 1.25, minScale, maxScale) }))}
                style={toolButtonStyle}
            >
                +
            </button>
            <button
                aria-label="Reset view"
                title="Reset view"
                onClick={() => setViewport({ x: 180, y: 90, scale: 0.86 })}
                style={{ ...toolButtonStyle, width: 64 }}
            >
                1:1
            </button>
        </section>

        <section style={statusStyle}>
            <span>{selectedWireId ?? selectedId ?? "Canvas"}</span>
            <span>{pendingConnection ? "Endpoint armed" : `${circuit.children.length} items`}</span>
        </section>
    </main>
}

const appStyle: CSSProperties = {
    position: "relative",
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
}

const toolbarStyle: CSSProperties = {
    position: "absolute",
    top: 18,
    left: 18,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: 8,
    border: "1px solid rgba(38, 59, 53, 0.18)",
    borderRadius: 8,
    background: "rgba(255, 250, 240, 0.9)",
    boxShadow: "0 12px 34px rgba(38, 59, 53, 0.12)",
    backdropFilter: "blur(10px)",
}

const statusStyle: CSSProperties = {
    position: "absolute",
    right: 18,
    bottom: 18,
    display: "flex",
    gap: 10,
    alignItems: "center",
    padding: "8px 10px",
    border: "1px solid rgba(38, 59, 53, 0.18)",
    borderRadius: 8,
    background: "rgba(255, 250, 240, 0.9)",
    color: "#263b35",
    fontSize: 12,
    boxShadow: "0 12px 34px rgba(38, 59, 53, 0.12)",
    backdropFilter: "blur(10px)",
}

const dividerStyle: CSSProperties = {
    width: 1,
    height: 24,
    background: "rgba(38, 59, 53, 0.18)",
}

const zoomStyle: CSSProperties = {
    minWidth: 58,
    textAlign: "center",
    color: "#263b35",
    fontVariantNumeric: "tabular-nums",
    fontSize: 13,
}

const toolButtonStyle: CSSProperties = {
    width: 34,
    height: 34,
    border: "1px solid rgba(38, 59, 53, 0.2)",
    borderRadius: 6,
    background: "#fffdf8",
    color: "#263b35",
    cursor: "pointer",
    fontSize: 15,
    fontWeight: 700,
}
