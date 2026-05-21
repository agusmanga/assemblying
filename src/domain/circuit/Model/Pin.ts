import type { Signal } from "./Signal";
import type { Wire } from "./Wire";

export class Pin {
    wire: Wire | null = null

    get signal(): Signal {
        return this.wire?.signal ?? null
    }

    set signal(value: Signal) {
        if (this.wire) {
            this.wire.signal = value;
        }
    }
}