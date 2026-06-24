import { Component } from "./Component"
import { Pin } from "./Pin"

export class Led extends Component {
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
            width: 84,
            height: 84,
        })

        this.input = new Pin({
            id: `${input.id}:in`,
            label: "A",
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
        // LEDs observe their input signal without driving the circuit.
    }
}
