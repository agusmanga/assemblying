import type { Pin } from "../domain/circuit/Model/Pin"
import type { Wire } from "../domain/circuit/Model/Wire"

export type Point = {
    x: number
    y: number
}

export type Viewport = Point & {
    scale: number
}

export type DragState =
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

export type PinHit = {
    pin: Pin
    ownerId: string
}

export type WireHit = {
    wire: Wire
    point: Point
}

export type PendingConnection =
    | {
        type: "pin"
        pinId: string
    }
    | {
        type: "wire"
        wireId: string
        point: Point
    }
