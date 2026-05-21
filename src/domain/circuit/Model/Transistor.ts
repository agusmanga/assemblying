import { Component } from "./Component";
import { Pin } from "./Pin";

/**
 * Exports transistor class as a collection of pins
 */
export class Transistor extends Component {
    gate = new Pin()
    source = new Pin()
    drain = new Pin()

    evaluate(): void {
        if (this.gate.signal === 1) {
            this.drain.signal = this.source.signal
        }
    }
}