import { Component } from "./Component"
import { Pin } from "./Pin"

export class ClockSource extends Component {
    output: Pin
    periodMs: number

    constructor(input: {
        id: string
        name: string
        x: number
        y: number
        periodMs?: number
    }) {
        super({
            id: input.id,
            name: input.name,
            x: input.x,
            y: input.y,
            width: 104,
            height: 68,
        })

        this.periodMs = input.periodMs ?? 1000
        this.output = new Pin({
            id: `${input.id}:out`,
            label: "CLK",
            role: "output",
            x: input.x + this.width,
            y: input.y + this.height / 2,
        })
    }

    moveBy(dx: number, dy: number): void {
        super.moveBy(dx, dy)
        this.output.x += dx
        this.output.y += dy
    }

    evaluate(): void {
        const phase = Math.floor(Date.now() / Math.max(1, this.periodMs / 2))
        this.output.signal = phase % 2 === 0 ? 0 : 1
        this.output.label = String(this.output.signal)
    }
}
