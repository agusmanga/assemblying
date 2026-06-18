import { Component } from "./Component"
import { Pin } from "./Pin"
import type { Signal } from "./Signal"

export class InputSource extends Component {
    output: Pin
    value: Exclude<Signal, null>

    constructor(input: {
        id: string
        name: string
        value?: Exclude<Signal, null>
        x: number
        y: number
    }) {
        super({
            id: input.id,
            name: input.name,
            x: input.x,
            y: input.y,
            width: 88,
            height: 68,
        })

        this.value = input.value ?? 0
        this.output = new Pin({
            id: `${input.id}:out`,
            label: String(this.value),
            role: "output",
            x: input.x + this.width,
            y: input.y + this.height / 2,
        })
    }

    toggle() {
        this.value = this.value === 1 ? 0 : 1
        this.output.label = String(this.value)
    }

    moveBy(dx: number, dy: number): void {
        super.moveBy(dx, dy)
        this.output.x += dx
        this.output.y += dy
    }

    evaluate(): void {
        this.output.signal = this.value
    }
}
