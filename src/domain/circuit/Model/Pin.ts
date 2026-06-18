import type { Signal } from "./Signal";
import type { Wire } from "./Wire";

export type PinRole = "input" | "output" | "bidirectional"

export class Pin {
    id: string
    label: string
    role: PinRole
    x: number
    y: number
    wire: Wire | null = null

    constructor(input: {
        id: string
        label: string
        role: PinRole
        x: number
        y: number
    }) {
        this.id = input.id
        this.label = input.label
        this.role = input.role
        this.x = input.x
        this.y = input.y
    }

    get signal(): Signal {
        return this.wire?.signal ?? null
    }

    set signal(value: Signal) {
        if (this.wire) {
            this.wire.signal = value;
        }
    }
}
