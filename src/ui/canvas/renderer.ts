import { Component } from "../../domain/circuit/Model/Component"
import { InputSource } from "../../domain/circuit/Model/InputSource"
import { Module } from "../../domain/circuit/Model/Module"
import type { Pin } from "../../domain/circuit/Model/Pin"
import { PowerSource } from "../../domain/circuit/Model/PowerSource"
import { Transistor } from "../../domain/circuit/Model/Transistor"
import type { Wire } from "../../domain/circuit/Model/Wire"
import { gridMajor, gridMinor } from "../constants"
import { screenToWorld } from "../geometry"
import type { Point, Viewport } from "../types"

export function setupCanvas(canvas: HTMLCanvasElement) {
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

export function strokePath(context: CanvasRenderingContext2D, points: Point[]) {
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

export function drawGrid(
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

export function drawWire(context: CanvasRenderingContext2D, wire: Wire, scale: number, selected: boolean) {
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
    selectedIds: readonly string[],
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

    if (selectedIds.includes(transistor.id)) {
        drawSelection(context, transistor, scale)
    }
    context.restore()
}

function drawPowerSource(
    context: CanvasRenderingContext2D,
    source: PowerSource,
    scale: number,
    selectedIds: readonly string[],
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

    if (selectedIds.includes(source.id)) {
        drawSelection(context, source, scale)
    }
    context.restore()
}

function drawInputSource(
    context: CanvasRenderingContext2D,
    input: InputSource,
    scale: number,
    selectedIds: readonly string[],
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

    if (selectedIds.includes(input.id)) {
        drawSelection(context, input, scale)
    }
    context.restore()
}

function drawModuleShell(
    context: CanvasRenderingContext2D,
    module: Module,
    scale: number,
    selectedIds: readonly string[],
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

    if (selectedIds.includes(module.id)) {
        drawSelection(context, module, scale)
    }
    context.restore()
}

function drawModuleDetail(
    context: CanvasRenderingContext2D,
    module: Module,
    scale: number,
    selectedIds: readonly string[],
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
        drawComponent(context, child, scale, selectedIds, selectedWireId, pendingPinId)
    }

    for (const pin of module.pins) {
        drawPin(context, pin, scale, pendingPinId === pin.id)
    }

    if (selectedIds.includes(module.id)) {
        drawSelection(context, module, scale)
    }
    context.restore()
}

export function drawComponent(
    context: CanvasRenderingContext2D,
    component: Component,
    scale: number,
    selectedIds: readonly string[],
    selectedWireId: string | null,
    pendingPinId: string | null,
) {
    if (component instanceof Transistor) {
        drawTransistor(context, component, scale, selectedIds, pendingPinId)
        return
    }

    if (component instanceof PowerSource) {
        drawPowerSource(context, component, scale, selectedIds, pendingPinId)
        return
    }

    if (component instanceof InputSource) {
        drawInputSource(context, component, scale, selectedIds, pendingPinId)
        return
    }

    if (component instanceof Module) {
        if (scale >= component.detailScale) {
            drawModuleDetail(context, component, scale, selectedIds, selectedWireId, pendingPinId)
        } else {
            drawModuleShell(context, component, scale, selectedIds, pendingPinId)
        }
    }
}
