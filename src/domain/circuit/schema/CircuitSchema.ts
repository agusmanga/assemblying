export const circuitSchemaVersion = 1

export type CircuitSchemaVersion = typeof circuitSchemaVersion

export type SignalData = 0 | 1 | null

export type PointData = {
    x: number
    y: number
}

export type RectData = PointData & {
    width: number
    height: number
}

export type PinRoleData = "input" | "output" | "bidirectional"

export type PinData = {
    id: string
    label: string
    role: PinRoleData
    x: number
    y: number
}

export type WireData = {
    id: string
    label: string
    points: PointData[]
    fixedSignal: SignalData
    connectionPinIds: string[]
    connectedWireIds: string[]
}

export type TransistorData = {
    type: "transistor"
    id: string
    name: string
    kind: "nmos" | "pmos"
    x: number
    y: number
}

export type PowerSourceData = {
    type: "powerSource"
    id: string
    name: string
    kind: "vdd" | "gnd"
    x: number
    y: number
}

export type InputSourceData = {
    type: "inputSource"
    id: string
    name: string
    value: 0 | 1
    x: number
    y: number
}

export type ModuleInstanceData = {
    type: "moduleInstance"
    id: string
    name: string
    moduleDefinitionId: string
    moduleVersion: string
    x: number
    y: number
    width: number
    height: number
    pins: PinData[]
    detailScale?: number
}

export type EmbeddedModuleData = {
    type: "module"
    id: string
    name: string
    x: number
    y: number
    width: number
    height: number
    pins: PinData[]
    components: ComponentData[]
    wires: WireData[]
    detailScale?: number
}

export type ComponentData =
    | TransistorData
    | PowerSourceData
    | InputSourceData
    | ModuleInstanceData
    | EmbeddedModuleData

export type ModuleDefinitionData = {
    kind: "assemblying.module"
    schemaVersion: CircuitSchemaVersion
    id: string
    name: string
    version: string
    description?: string
    bounds: RectData
    pins: PinData[]
    components: ComponentData[]
    wires: WireData[]
    detailScale?: number
}

export type CircuitDocumentData = {
    kind: "assemblying.document"
    schemaVersion: CircuitSchemaVersion
    id: string
    name: string
    rootModuleId: string
    modules: Record<string, ModuleDefinitionData>
}
