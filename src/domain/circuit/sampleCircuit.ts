import { Module } from "./Model/Module"
import { Pin } from "./Model/Pin"
import { Transistor } from "./Model/Transistor"
import { Wire } from "./Model/Wire"

export function createSampleCircuit() {
    const pmos = new Transistor({
        id: "inv-pmos",
        name: "P1",
        kind: "pmos",
        x: 300,
        y: 170,
    })
    const nmos = new Transistor({
        id: "inv-nmos",
        name: "N1",
        kind: "nmos",
        x: 300,
        y: 350,
    })

    const input = new Wire({
        id: "input-a",
        label: "A",
        points: [
            { x: 170, y: 302 },
            { x: 300, y: 236 },
            { x: 300, y: 416 },
        ],
    })
    input.connect(pmos.gate)
    input.connect(nmos.gate)

    const vdd = new Wire({
        id: "vdd",
        label: "VDD",
        signal: 1,
        points: [
            { x: 384, y: 128 },
            { x: 384, y: 194 },
        ],
    })
    vdd.connect(pmos.source)

    const ground = new Wire({
        id: "ground",
        label: "GND",
        signal: 0,
        points: [
            { x: 384, y: 482 },
            { x: 384, y: 536 },
        ],
    })
    ground.connect(nmos.source)

    const output = new Wire({
        id: "output-y",
        label: "Y",
        points: [
            { x: 384, y: 278 },
            { x: 486, y: 278 },
            { x: 486, y: 458 },
            { x: 384, y: 458 },
            { x: 570, y: 368 },
        ],
    })
    output.connect(pmos.drain)
    output.connect(nmos.drain)

    const inverter = new Module({
        id: "inverter",
        name: "Inverter",
        x: 120,
        y: 100,
        width: 500,
        height: 500,
        children: [pmos, nmos],
        wires: [input, vdd, output, ground],
        pins: [
            new Pin({ id: "inverter:a", label: "A", role: "input", x: 120, y: 302 }),
            new Pin({ id: "inverter:y", label: "Y", role: "output", x: 620, y: 368 }),
            new Pin({ id: "inverter:vdd", label: "VDD", role: "input", x: 384, y: 100 }),
            new Pin({ id: "inverter:gnd", label: "GND", role: "input", x: 384, y: 600 }),
        ],
        detailScale: 0.85,
    })

    const root = new Module({
        id: "root",
        name: "Assemblying",
        x: 0,
        y: 0,
        width: 900,
        height: 700,
        children: [inverter],
        wires: [
            new Wire({
                id: "root-input",
                label: "A",
                points: [
                    { x: -80, y: 302 },
                    { x: 120, y: 302 },
                ],
            }),
            new Wire({
                id: "root-output",
                label: "Y",
                points: [
                    { x: 620, y: 368 },
                    { x: 810, y: 368 },
                ],
            }),
        ],
        detailScale: 0,
    })

    return root
}
