import type { Pin } from "./Pin";
import type { Signal } from "./Signal";


/**
 * Base class wire
 */
export class Wire {
    signal: Signal = null

    connections: Pin[] = []

    connect(pin: Pin) {
        this.connections.push(pin)
        pin.wire = this
    }
}