import { Component } from "./Component"
import { Pin } from "./Pin"

export class OutputProbe extends Component {
    input: Pin

    constructor(input: {
        id: string
        name: string
        x: number
        y: number
    }) {
        super({
            id: input.id,
            name: input.name,
            x: input.x,
            y: input.y,
            width: 96,
            height: 68,
        })

        this.input = new Pin({
            id: `${input.id}:in`,
            label: "Q",
            role: "input",
            x: input.x,
            y: input.y + this.height / 2,
        })
    }

    moveBy(dx: number, dy: number): void {
        super.moveBy(dx, dy)
        this.input.x += dx
        this.input.y += dy
    }

    evaluate(): void {
        // Probes observe their input signal without driving the circuit.
    }
}
