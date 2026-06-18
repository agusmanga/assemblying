import { Component } from "./Component"
import { Pin } from "./Pin"
import type { Signal } from "./Signal"

export type PowerSourceKind = "vdd" | "gnd"

export class PowerSource extends Component {
    kind: PowerSourceKind
    output: Pin

    constructor(input: {
        id: string
        kind: PowerSourceKind
        x: number
        y: number
    }) {
        super({
            id: input.id,
            name: input.kind === "vdd" ? "VDD" : "GND",
            x: input.x,
            y: input.y,
            width: 88,
            height: 68,
        })

        this.kind = input.kind
        this.output = new Pin({
            id: `${input.id}:out`,
            label: input.kind === "vdd" ? "1" : "0",
            role: "output",
            x: input.x + this.width,
            y: input.y + this.height / 2,
        })
    }

    get signal(): Signal {
        return this.kind === "vdd" ? 1 : 0
    }

    moveBy(dx: number, dy: number): void {
        super.moveBy(dx, dy)
        this.output.x += dx
        this.output.y += dy
    }

    evaluate(): void {
        this.output.signal = this.signal
    }
}
