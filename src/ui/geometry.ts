import type { Point, Viewport } from "./types"

export function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value))
}

export function distance(a: Point, b: Point) {
    return Math.hypot(a.x - b.x, a.y - b.y)
}

export function closestPointOnSegment(point: Point, a: Point, b: Point) {
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

export function snap(value: number, size = 24) {
    return Math.round(value / size) * size
}

export function screenToWorld(x: number, y: number, viewport: Viewport) {
    return {
        x: (x - viewport.x) / viewport.scale,
        y: (y - viewport.y) / viewport.scale,
    }
}
