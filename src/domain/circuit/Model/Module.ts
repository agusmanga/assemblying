import { Component } from "./Component"
import type { Pin } from "./Pin"
import { Wire } from "./Wire"

function collectWires(module: Module): Wire[] {
    const wires = [...module.wires]

    for (const child of module.children) {
        if (child instanceof Module) {
            wires.push(...collectWires(child))
        }
    }

    return wires
}

function collectComponents(module: Module): Component[] {
    const components: Component[] = []

    for (const child of module.children) {
        components.push(child)
        if (child instanceof Module) {
            components.push(...collectComponents(child))
        }
    }

    return components
}

function snapshotSignals(wires: Wire[]) {
    return wires.map((wire) => wire.signal).join("|")
}

/**
 * Abstract class made from components
 */
export class Module extends Component {
    pins: Pin[] = []
    children: Component[] = []
    wires: Wire[] = []
    detailScale = 0.72

    constructor(input: {
        id: string
        name: string
        x: number
        y: number
        width: number
        height: number
        children?: Component[]
        wires?: Wire[]
        pins?: Pin[]
        detailScale?: number
    }) {
        super(input)
        this.children = input.children ?? []
        this.wires = input.wires ?? []
        this.pins = input.pins ?? []
        this.detailScale = input.detailScale ?? this.detailScale
    }

    addChild(component: Component) {
        this.children.push(component)
    }

    addWire(wire: Wire) {
        this.wires.push(wire)
    }

    moveBy(dx: number, dy: number): void {
        super.moveBy(dx, dy)

        for (const pin of this.pins) {
            pin.x += dx
            pin.y += dy
        }

        for (const wire of this.wires) {
            for (const point of wire.points) {
                point.x += dx
                point.y += dy
            }
        }

        for (const child of this.children) {
            child.moveBy(dx, dy)
        }
    }

    evaluate(): void {
        const wires = collectWires(this)
        const components = collectComponents(this).filter((component) => !(component instanceof Module))
        const maxPasses = Math.max(4, components.length * 2)

        for (const wire of wires) {
            wire.reset()
        }

        for (let pass = 0; pass < maxPasses; pass += 1) {
            const before = snapshotSignals(wires)

            for (const component of components) {
                component.evaluate()
            }

            if (snapshotSignals(wires) === before) {
                break
            }
        }
    }
}
