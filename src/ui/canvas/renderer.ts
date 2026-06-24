import { Component } from "../../domain/circuit/Model/Component"
import { ClockSource } from "../../domain/circuit/Model/ClockSource"
import { InputSource } from "../../domain/circuit/Model/InputSource"
import { Led } from "../../domain/circuit/Model/Led"
import { Module } from "../../domain/circuit/Model/Module"
import { OutputProbe } from "../../domain/circuit/Model/OutputProbe"
import type { Pin } from "../../domain/circuit/Model/Pin"
import { PowerSource } from "../../domain/circuit/Model/PowerSource"
import { Transistor } from "../../domain/circuit/Model/Transistor"
import type { Wire } from "../../domain/circuit/Model/Wire"
import {
    gridMajor,
    gridMinor,
    moduleNestedRevealStep,
    moduleRevealAdvance,
    moduleRevealRange,
    moduleResizeHandleSize,
} from "../constants"
import { screenToWorld } from "../geometry"
import type { Point, Viewport } from "../types"

function smoothstep(edge0: number, edge1: number, value: number) {
    const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)))
    return t * t * (3 - 2 * t)
}

function moduleRevealScale(module: Module, depth: number) {
    return module.detailScale - moduleRevealAdvance + depth * moduleNestedRevealStep
}

function moduleRevealAlpha(module: Module, scale: number, depth: number) {
    if (module.detailScale <= 0) {
        return {
            shell: 0,
            detail: 1,
        }
    }

    const halfRange = moduleRevealRange / 2
    const revealScale = moduleRevealScale(module, depth)
    const detail = smoothstep(revealScale - halfRange, revealScale + halfRange, scale)

    return {
        shell: 1 - detail,
        detail,
    }
}

function drawWithAlpha(context: CanvasRenderingContext2D, alpha: number, draw: () => void) {
    if (alpha <= 0) {
        return
    }

    context.save()
    context.globalAlpha *= alpha
    draw()
    context.restore()
}

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

export function drawWire(
    context: CanvasRenderingContext2D,
    wire: Wire,
    scale: number,
    selected: boolean,
    animationTime = 0,
) {
    context.save()
    context.lineWidth = (selected ? 7 : 4) / scale
    context.lineCap = "round"
    context.lineJoin = "round"
    context.strokeStyle = selected
        ? "#d68f00"
        : wire.signal === 1 ? "#d1493f" : wire.signal === 0 ? "#3867d6" : "#263b35"
    strokePath(context, wire.points)

    if (wire.signal !== null) {
        const direction = wire.signal === 1 ? -1 : 1
        const pulseOffset = (animationTime / 42) * direction
        context.save()
        context.lineWidth = (selected ? 3.4 : 2.4) / scale
        context.strokeStyle = wire.signal === 1 ? "rgba(255, 236, 206, 0.9)" : "rgba(218, 230, 255, 0.9)"
        context.setLineDash([10 / scale, 18 / scale])
        context.lineDashOffset = pulseOffset / scale
        strokePath(context, wire.points)
        context.restore()
    }

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

    if (component instanceof Module) {
        const size = moduleResizeHandleSize / scale
        const centerX = component.x + component.width
        const centerY = component.y + component.height
        const inset = size * 0.18
        const arrow = size * 0.26
        const startX = centerX - size / 2 + inset
        const startY = centerY - size / 2 + inset
        const endX = centerX + size / 2 - inset
        const endY = centerY + size / 2 - inset
        context.setLineDash([])
        context.strokeStyle = "#d68f00"
        context.lineWidth = 2.4 / scale
        context.lineCap = "round"
        context.lineJoin = "round"
        context.beginPath()
        context.moveTo(startX, startY)
        context.lineTo(endX, endY)
        context.moveTo(startX, startY)
        context.lineTo(startX + arrow, startY)
        context.moveTo(startX, startY)
        context.lineTo(startX, startY + arrow)
        context.moveTo(endX, endY)
        context.lineTo(endX - arrow, endY)
        context.moveTo(endX, endY)
        context.lineTo(endX, endY - arrow)
        context.stroke()
    }

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
    const symbolTopY = source.y + source.height * 0.32
    const symbolMiddleY = source.y + source.height * 0.5
    const symbolBottomY = source.y + source.height * 0.68
    const color = source.kind === "vdd" ? "#d1493f" : "#3867d6"

    context.save()
    context.fillStyle = "#fffdf8"
    context.strokeStyle = color
    context.lineWidth = 3 / scale
    context.beginPath()
    context.roundRect(source.x, source.y, source.width, source.height, Math.min(8, source.width / 5, source.height / 5))
    context.fill()
    context.stroke()

    context.strokeStyle = color
    context.lineWidth = 4 / scale
    context.lineCap = "round"
    context.beginPath()
    if (source.kind === "vdd") {
        context.moveTo(source.x + source.width * 0.23, symbolTopY)
        context.lineTo(source.x + source.width * 0.39, symbolTopY)
        context.moveTo(source.x + source.width * 0.31, source.y + source.height * 0.21)
        context.lineTo(source.x + source.width * 0.31, source.y + source.height * 0.43)
        context.moveTo(source.x + source.width * 0.55, symbolTopY)
        context.lineTo(source.x + source.width * 0.7, symbolTopY)
    } else {
        context.moveTo(source.x + source.width * 0.25, symbolTopY)
        context.lineTo(source.x + source.width * 0.7, symbolTopY)
        context.moveTo(source.x + source.width * 0.34, symbolMiddleY)
        context.lineTo(source.x + source.width * 0.61, symbolMiddleY)
        context.moveTo(source.x + source.width * 0.43, symbolBottomY)
        context.lineTo(source.x + source.width * 0.52, symbolBottomY)
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

function signalColor(signal: 0 | 1 | null) {
    return signal === 1 ? "#d1493f" : signal === 0 ? "#3867d6" : "#7d8983"
}

function signalLabel(signal: 0 | 1 | null) {
    return signal === null ? "Z" : String(signal)
}

function drawOutputProbe(
    context: CanvasRenderingContext2D,
    probe: OutputProbe,
    scale: number,
    selectedIds: readonly string[],
    pendingPinId: string | null,
) {
    const signal = probe.input.signal
    const color = signalColor(signal)

    context.save()
    context.fillStyle = signal === 1 ? "#fff7f4" : signal === 0 ? "#f5f8ff" : "#f6f1e8"
    context.strokeStyle = color
    context.lineWidth = 3 / scale
    context.beginPath()
    context.roundRect(probe.x, probe.y, probe.width, probe.height, 8)
    context.fill()
    context.stroke()

    context.fillStyle = color
    context.font = `${24 / scale}px Inter, sans-serif`
    context.textAlign = "center"
    context.textBaseline = "middle"
    context.fillText(signalLabel(signal), probe.x + probe.width / 2, probe.y + probe.height / 2)

    context.fillStyle = "#263b35"
    context.font = `${13 / scale}px Inter, sans-serif`
    context.fillText(probe.name, probe.x + probe.width / 2, probe.y - 10 / scale)
    context.textBaseline = "alphabetic"

    drawPin(context, probe.input, scale, pendingPinId === probe.input.id)

    if (selectedIds.includes(probe.id)) {
        drawSelection(context, probe, scale)
    }
    context.restore()
}

function drawLed(
    context: CanvasRenderingContext2D,
    led: Led,
    scale: number,
    selectedIds: readonly string[],
    pendingPinId: string | null,
) {
    const signal = led.input.signal
    const color = signalColor(signal)
    const centerX = led.x + led.width / 2
    const centerY = led.y + led.height / 2

    context.save()
    context.fillStyle = "#fffdf8"
    context.strokeStyle = color
    context.lineWidth = 3 / scale
    context.beginPath()
    context.roundRect(led.x, led.y, led.width, led.height, 8)
    context.fill()
    context.stroke()

    context.beginPath()
    context.arc(centerX, centerY, Math.min(led.width, led.height) * 0.26, 0, Math.PI * 2)
    context.fillStyle = signal === 1 ? "#ffb3a9" : signal === 0 ? "#dbe4ff" : "#e6e1d8"
    context.strokeStyle = color
    context.fill()
    context.stroke()

    if (signal === 1) {
        context.beginPath()
        context.arc(centerX, centerY, Math.min(led.width, led.height) * 0.36, 0, Math.PI * 2)
        context.strokeStyle = "rgba(209, 73, 63, 0.28)"
        context.lineWidth = 7 / scale
        context.stroke()
    }

    context.fillStyle = "#263b35"
    context.font = `${13 / scale}px Inter, sans-serif`
    context.textAlign = "center"
    context.fillText(led.name, led.x + led.width / 2, led.y - 10 / scale)

    drawPin(context, led.input, scale, pendingPinId === led.input.id)

    if (selectedIds.includes(led.id)) {
        drawSelection(context, led, scale)
    }
    context.restore()
}

function drawClockSource(
    context: CanvasRenderingContext2D,
    clock: ClockSource,
    scale: number,
    selectedIds: readonly string[],
    pendingPinId: string | null,
) {
    const color = signalColor(clock.output.signal)
    const centerY = clock.y + clock.height / 2

    context.save()
    context.fillStyle = "#fffdf8"
    context.strokeStyle = color
    context.lineWidth = 3 / scale
    context.beginPath()
    context.roundRect(clock.x, clock.y, clock.width, clock.height, 8)
    context.fill()
    context.stroke()

    context.strokeStyle = color
    context.lineWidth = 3 / scale
    context.lineJoin = "round"
    context.beginPath()
    context.moveTo(clock.x + 18, centerY + 10)
    context.lineTo(clock.x + 18, centerY - 10)
    context.lineTo(clock.x + 34, centerY - 10)
    context.lineTo(clock.x + 34, centerY + 10)
    context.lineTo(clock.x + 50, centerY + 10)
    context.lineTo(clock.x + 50, centerY - 10)
    context.lineTo(clock.x + 66, centerY - 10)
    context.lineTo(clock.x + 66, centerY + 10)
    context.stroke()

    context.fillStyle = "#263b35"
    context.font = `${13 / scale}px Inter, sans-serif`
    context.textAlign = "center"
    context.fillText(clock.name, clock.x + clock.width / 2, clock.y - 10 / scale)

    drawPin(context, clock.output, scale, pendingPinId === clock.output.id)

    if (selectedIds.includes(clock.id)) {
        drawSelection(context, clock, scale)
    }
    context.restore()
}

function drawModuleShell(
    context: CanvasRenderingContext2D,
    module: Module,
    scale: number,
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
    context.restore()
}

function drawModuleDetail(
    context: CanvasRenderingContext2D,
    module: Module,
    scale: number,
    depth: number,
    selectedIds: readonly string[],
    transparentIds: readonly string[],
    selectedWireId: string | null,
    pendingPinId: string | null,
    animationTime: number,
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
        drawWire(context, wire, scale, selectedWireId === wire.id, animationTime)
    }

    for (const child of module.children) {
        drawComponent(context, child, scale, selectedIds, transparentIds, selectedWireId, pendingPinId, depth + 1, animationTime)
    }

    for (const pin of module.pins) {
        drawPin(context, pin, scale, pendingPinId === pin.id)
    }
    context.restore()
}

export function drawComponent(
    context: CanvasRenderingContext2D,
    component: Component,
    scale: number,
    selectedIds: readonly string[],
    transparentIds: readonly string[],
    selectedWireId: string | null,
    pendingPinId: string | null,
    depth = 0,
    animationTime = 0,
) {
    const isTransparent = transparentIds.includes(component.id)
    if (isTransparent && !(component instanceof Module)) {
        context.save()
        context.globalAlpha *= 0.28
    }

    if (component instanceof Transistor) {
        drawTransistor(context, component, scale, selectedIds, pendingPinId)
        if (isTransparent) {
            context.restore()
        }
        return
    }

    if (component instanceof PowerSource) {
        drawPowerSource(context, component, scale, selectedIds, pendingPinId)
        if (isTransparent) {
            context.restore()
        }
        return
    }

    if (component instanceof InputSource) {
        drawInputSource(context, component, scale, selectedIds, pendingPinId)
        if (isTransparent) {
            context.restore()
        }
        return
    }

    if (component instanceof OutputProbe) {
        drawOutputProbe(context, component, scale, selectedIds, pendingPinId)
        if (isTransparent) {
            context.restore()
        }
        return
    }

    if (component instanceof Led) {
        drawLed(context, component, scale, selectedIds, pendingPinId)
        if (isTransparent) {
            context.restore()
        }
        return
    }

    if (component instanceof ClockSource) {
        drawClockSource(context, component, scale, selectedIds, pendingPinId)
        if (isTransparent) {
            context.restore()
        }
        return
    }

    if (component instanceof Module) {
        const revealAlpha = moduleRevealAlpha(component, scale, depth)
        const alpha = isTransparent
            ? { shell: Math.max(0.18, revealAlpha.shell * 0.28), detail: 1 }
            : revealAlpha

        drawWithAlpha(context, alpha.detail, () => {
            drawModuleDetail(context, component, scale, depth, selectedIds, transparentIds, selectedWireId, pendingPinId, animationTime)
        })
        drawWithAlpha(context, alpha.shell, () => {
            drawModuleShell(context, component, scale, pendingPinId)
        })

        if (selectedIds.includes(component.id)) {
            drawSelection(context, component, scale)
        }
    }

    if (isTransparent && !(component instanceof Module)) {
        context.restore()
    }
}
