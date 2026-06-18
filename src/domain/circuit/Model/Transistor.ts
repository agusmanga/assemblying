import { Component } from "./Component";
import { Pin } from "./Pin";

export type TransistorKind = "nmos" | "pmos"

/**
 * Exports transistor class as a collection of pins
 */
export class Transistor extends Component {
    kind: TransistorKind
    gate: Pin
    source: Pin
    drain: Pin

    constructor(input: {
        id: string
        name: string
        kind: TransistorKind
        x: number
        y: number
    }) {
        super({
            id: input.id,
            name: input.name,
            x: input.x,
            y: input.y,
            width: 84,
            height: 132,
        })

        this.kind = input.kind
        const sourceY = input.kind === "pmos" ? input.y + 24 : input.y + 108
        const drainY = input.kind === "pmos" ? input.y + 108 : input.y + 24

        this.gate = new Pin({
            id: `${input.id}:gate`,
            label: "G",
            role: "input",
            x: input.x,
            y: input.y + 66,
        })
        this.source = new Pin({
            id: `${input.id}:source`,
            label: "S",
            role: "bidirectional",
            x: input.x + 84,
            y: sourceY,
        })
        this.drain = new Pin({
            id: `${input.id}:drain`,
            label: "D",
            role: "bidirectional",
            x: input.x + 84,
            y: drainY,
        })
    }

    moveBy(dx: number, dy: number): void {
        super.moveBy(dx, dy)
        this.gate.x += dx
        this.gate.y += dy
        this.source.x += dx
        this.source.y += dy
        this.drain.x += dx
        this.drain.y += dy
    }

    evaluate(): void {
        const isClosed = this.kind === "nmos"
            ? this.gate.signal === 1
            : this.gate.signal === 0

        if (isClosed) {
            this.drain.signal = this.source.signal
        }
    }
}
