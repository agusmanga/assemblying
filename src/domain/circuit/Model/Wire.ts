import type { Pin } from "./Pin";
import type { Signal } from "./Signal";

export type WirePoint = {
    x: number
    y: number
}

/**
 * Base class wire
 */
export class Wire {
    id: string
    label: string
    private _signal: Signal = null
    private _fixedSignal: Signal = null
    private parent: Wire | null = null
    connectedWires: Wire[] = []
    connections: Pin[] = []
    points: WirePoint[]

    constructor(input: {
        id: string
        label?: string
        points?: WirePoint[]
        signal?: Signal
    }) {
        this.id = input.id
        this.label = input.label ?? input.id
        this.points = input.points ?? []
        this._signal = input.signal ?? null
        this._fixedSignal = input.signal ?? null
    }

    get signal(): Signal {
        return this.root()._signal
    }

    set signal(value: Signal) {
        const root = this.root()
        root._signal = mergeSignal(root._signal, value)
    }

    get fixedSignal(): Signal {
        return this.root()._fixedSignal
    }

    get localFixedSignal(): Signal {
        return this._fixedSignal
    }

    set fixedSignal(value: Signal) {
        this.root()._fixedSignal = value
    }

    connect(pin: Pin) {
        if (pin.wire && pin.wire !== this) {
            this.connectWire(pin.wire)
        }

        if (!this.connections.includes(pin)) {
            this.connections.push(pin)
        }
        pin.wire = this
    }

    connectWire(wire: Wire) {
        if (!this.connectedWires.includes(wire)) {
            this.connectedWires.push(wire)
        }
        if (!wire.connectedWires.includes(this)) {
            wire.connectedWires.push(this)
        }

        const root = this.root()
        const otherRoot = wire.root()

        if (root === otherRoot) {
            return
        }

        otherRoot.parent = root
        root._fixedSignal = mergeSignal(root._fixedSignal, otherRoot._fixedSignal)
        root._signal = mergeSignal(root._signal, otherRoot._signal)
    }

    disconnectWire(wire: Wire) {
        this.connectedWires = this.connectedWires.filter((connected) => connected !== wire)
        wire.connectedWires = wire.connectedWires.filter((connected) => connected !== this)
    }

    resetNetwork() {
        this.parent = null
        this._signal = this._fixedSignal
    }

    reset() {
        const root = this.root()
        root._signal = root._fixedSignal
    }

    private root(): Wire {
        if (!this.parent) {
            return this
        }

        this.parent = this.parent.root()
        return this.parent
    }
}

function mergeSignal(a: Signal, b: Signal): Signal {
    if (a === null) {
        return b
    }

    if (b === null || a === b) {
        return a
    }

    return 1
}
