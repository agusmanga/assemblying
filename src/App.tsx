import { useEffect, useRef, useState } from "react"
import type { PowerSourceKind } from "./domain/circuit/Model/PowerSource"
import type { TransistorKind } from "./domain/circuit/Model/Transistor"
import { createSampleCircuit } from "./domain/circuit/sampleCircuit"
import { deserializeModule, serializeModule } from "./domain/circuit/serialization/moduleSerializer"
import type { ModuleDefinitionData } from "./domain/circuit/schema/CircuitSchema"
import { drawComponent, drawGrid, drawWire, setupCanvas, strokePath } from "./ui/canvas/renderer"
import { maxScale, minScale } from "./ui/constants"
import { StatusBar } from "./ui/components/StatusBar"
import { Toolbar } from "./ui/components/Toolbar"
import {
    addInputSourceTo,
    addPowerSourceTo,
    addTransistorTo,
    canRemoveComponent,
    connectEndpoints,
    createModuleFromSelection,
    findComponentAt,
    findComponentById,
    findPinAt,
    findWireAt,
    pendingConnectionPoint,
    removeComponent,
    removeWire,
    syncDirectWires,
    toggleInputAt,
} from "./ui/circuit/editor"
import { clamp, screenToWorld } from "./ui/geometry"
import { appStyle } from "./ui/styles"
import type { DragState, PendingConnection, Point, Viewport } from "./ui/types"

export function App() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const dragRef = useRef<DragState | null>(null)
    const importInputRef = useRef<HTMLInputElement | null>(null)
    const [circuit, setCircuit] = useState(() => createSampleCircuit())
    const [revision, setRevision] = useState(0)
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [selectedWireId, setSelectedWireId] = useState<string | null>(null)
    const [pendingConnection, setPendingConnection] = useState<PendingConnection | null>(null)
    const [pointerWorld, setPointerWorld] = useState<Point | null>(null)
    const [isDraggingComponent, setIsDraggingComponent] = useState(false)
    const [viewport, setViewport] = useState<Viewport>({ x: 180, y: 90, scale: 0.86 })
    const pendingPinId = pendingConnection?.type === "pin" ? pendingConnection.pinId : null
    const canDeleteSelection = !!selectedWireId || selectedIds.some((id) => canRemoveComponent(circuit, id))
    const canModularizeSelection = selectedIds.length > 0 && !selectedWireId

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) {
            return
        }

        const frame = window.requestAnimationFrame(() => {
            const setup = setupCanvas(canvas)
            if (!setup) {
                return
            }

            circuit.evaluate()
            drawGrid(setup.context, setup.width, setup.height, viewport)
            setup.context.save()
            setup.context.translate(viewport.x, viewport.y)
            setup.context.scale(viewport.scale, viewport.scale)

            for (const wire of circuit.wires) {
                drawWire(setup.context, wire, viewport.scale, selectedWireId === wire.id)
            }

            for (const child of circuit.children) {
                drawComponent(setup.context, child, viewport.scale, selectedIds, selectedWireId, pendingPinId)
            }

            if (pendingConnection && pointerWorld) {
                const pendingPoint = pendingConnectionPoint(circuit, pendingConnection)
                if (pendingPoint) {
                    setup.context.save()
                    setup.context.strokeStyle = "#b26b00"
                    setup.context.lineWidth = 3 / viewport.scale
                    setup.context.setLineDash([8 / viewport.scale, 7 / viewport.scale])
                    strokePath(setup.context, [pendingPoint, pointerWorld])
                    setup.context.restore()
                }
            }

            setup.context.restore()
        })

        return () => window.cancelAnimationFrame(frame)
    }, [circuit, pendingConnection, pendingPinId, pointerWorld, revision, selectedIds, selectedWireId, viewport])

    useEffect(() => {
        const handleResize = () => setViewport((current) => ({ ...current }))
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    function rerenderCircuit() {
        syncDirectWires(circuit)
        setRevision((current) => current + 1)
    }

    function deleteSelected() {
        if (selectedWireId) {
            if (removeWire(circuit, selectedWireId)) {
                setSelectedWireId(null)
                setPendingConnection(null)
                rerenderCircuit()
            }
            return
        }

        if (selectedIds.length > 0) {
            let deleted = false
            for (const id of selectedIds) {
                deleted = removeComponent(circuit, id) || deleted
            }
            if (deleted) {
                setSelectedIds([])
                setPendingConnection(null)
                rerenderCircuit()
            }
        }
    }

    function modularizeSelected() {
        const module = createModuleFromSelection(circuit, selectedIds)
        if (module) {
            setSelectedIds([module.id])
            setSelectedWireId(null)
            setPendingConnection(null)
            rerenderCircuit()
        }
    }

    function exportCircuit() {
        const data = serializeModule(circuit)
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `${circuit.name.toLowerCase().replaceAll(/\s+/g, "-")}.assemblying-module.json`
        link.click()
        URL.revokeObjectURL(url)
    }

    async function importCircuitFile(file: File) {
        try {
            const text = await file.text()
            const data = JSON.parse(text) as ModuleDefinitionData
            const nextCircuit = deserializeModule(data)
            setCircuit(nextCircuit)
            setSelectedIds([])
            setSelectedWireId(null)
            setPendingConnection(null)
            setPointerWorld(null)
            dragRef.current = null
            setIsDraggingComponent(false)
            setRevision((current) => current + 1)
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown import error"
            window.alert(`Could not import circuit JSON: ${message}`)
        }
    }

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== "Delete" && event.key !== "Backspace") {
                return
            }

            const target = event.target
            if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
                return
            }

            event.preventDefault()
            deleteSelected()
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    })

    function worldFromEvent(event: React.PointerEvent<HTMLCanvasElement>) {
        const rect = event.currentTarget.getBoundingClientRect()
        return screenToWorld(event.clientX - rect.left, event.clientY - rect.top, viewport)
    }

    function worldFromClientPoint(clientX: number, clientY: number) {
        const canvas = canvasRef.current
        if (!canvas) {
            return null
        }

        const rect = canvas.getBoundingClientRect()
        return screenToWorld(clientX - rect.left, clientY - rect.top, viewport)
    }

    function zoomAt(clientX: number, clientY: number, nextScale: number) {
        const canvas = canvasRef.current
        if (!canvas) {
            return
        }

        const rect = canvas.getBoundingClientRect()
        const x = clientX - rect.left
        const y = clientY - rect.top
        setViewport((current) => {
            const scale = clamp(nextScale, minScale, maxScale)
            const world = screenToWorld(x, y, current)
            return {
                scale,
                x: x - world.x * scale,
                y: y - world.y * scale,
            }
        })
    }

    function createTransistor(kind: TransistorKind) {
        const canvas = canvasRef.current
        if (!canvas) {
            return
        }

        const rect = canvas.getBoundingClientRect()
        const center = screenToWorld(rect.width / 2, rect.height / 2, viewport)
        const transistor = addTransistorTo(circuit, kind, center)
        setSelectedIds([transistor.id])
        setSelectedWireId(null)
        setPendingConnection(null)
        rerenderCircuit()
    }

    function createPowerSource(kind: PowerSourceKind) {
        const canvas = canvasRef.current
        if (!canvas) {
            return
        }

        const rect = canvas.getBoundingClientRect()
        const center = screenToWorld(rect.width / 2, rect.height / 2, viewport)
        const source = addPowerSourceTo(circuit, kind, center)
        setSelectedIds([source.id])
        setSelectedWireId(null)
        setPendingConnection(null)
        rerenderCircuit()
    }

    function createInputSource() {
        const canvas = canvasRef.current
        if (!canvas) {
            return
        }

        const rect = canvas.getBoundingClientRect()
        const center = screenToWorld(rect.width / 2, rect.height / 2, viewport)
        const input = addInputSourceTo(circuit, center)
        setSelectedIds([input.id])
        setSelectedWireId(null)
        setPendingConnection(null)
        rerenderCircuit()
    }

    return <main style={appStyle}>
        <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json,.assemblying-module.json"
            style={{ display: "none" }}
            onChange={(event) => {
                const file = event.currentTarget.files?.[0]
                event.currentTarget.value = ""
                if (file) {
                    void importCircuitFile(file)
                }
            }}
        />
        <canvas
            ref={canvasRef}
            style={{
                width: "100%",
                height: "100%",
                display: "block",
                cursor: isDraggingComponent ? "grabbing" : "grab",
                touchAction: "none",
            }}
            onDoubleClick={(event) => {
                const world = worldFromClientPoint(event.clientX, event.clientY)
                if (!world) {
                    return
                }

                if (toggleInputAt(circuit, world, viewport.scale)) {
                    setPendingConnection(null)
                    rerenderCircuit()
                    return
                }

                zoomAt(event.clientX, event.clientY, viewport.scale * 1.7)
            }}
            onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId)
                const world = worldFromEvent(event)
                setPointerWorld(world)

                const pinHit = findPinAt(circuit, world, viewport.scale)
                if (pinHit) {
                    const nextConnection: PendingConnection = { type: "pin", pinId: pinHit.pin.id }
                    if (pendingConnection) {
                        connectEndpoints(circuit, pendingConnection, nextConnection)
                        rerenderCircuit()
                        setPendingConnection(null)
                    } else {
                        setPendingConnection(nextConnection)
                        setSelectedIds([pinHit.ownerId])
                        setSelectedWireId(null)
                    }
                    return
                }

                const wireHit = findWireAt(circuit, world, viewport.scale)
                if (wireHit) {
                    const nextConnection: PendingConnection = {
                        type: "wire",
                        wireId: wireHit.wire.id,
                        point: wireHit.point,
                    }

                    if (pendingConnection) {
                        connectEndpoints(circuit, pendingConnection, nextConnection)
                        rerenderCircuit()
                        setPendingConnection(null)
                        setSelectedWireId(null)
                    } else {
                        setSelectedWireId(wireHit.wire.id)
                        setPendingConnection(nextConnection)
                        setSelectedIds([])
                    }
                    return
                }

                const component = findComponentAt(circuit, world, viewport.scale)
                if (component) {
                    const nextSelectedIds = event.shiftKey
                        ? selectedIds.includes(component.id)
                            ? selectedIds.filter((id) => id !== component.id)
                            : [...selectedIds, component.id]
                        : [component.id]
                    setSelectedIds(nextSelectedIds)
                    setSelectedWireId(null)
                    setPendingConnection(null)
                    if (event.shiftKey) {
                        return
                    }
                    dragRef.current = {
                        type: "component",
                        pointerId: event.pointerId,
                        componentId: component.id,
                        previousWorld: world,
                    }
                    setIsDraggingComponent(true)
                    return
                }

                setSelectedIds([])
                setSelectedWireId(null)
                setPendingConnection(null)
                dragRef.current = {
                    type: "pan",
                    pointerId: event.pointerId,
                    x: event.clientX,
                    y: event.clientY,
                    viewport,
                }
            }}
            onPointerMove={(event) => {
                const world = worldFromEvent(event)
                setPointerWorld(world)

                const drag = dragRef.current
                if (!drag || drag.pointerId !== event.pointerId) {
                    return
                }

                if (drag.type === "pan") {
                    setViewport({
                        ...drag.viewport,
                        x: drag.viewport.x + event.clientX - drag.x,
                        y: drag.viewport.y + event.clientY - drag.y,
                    })
                    return
                }

                const component = findComponentById(circuit, drag.componentId)
                if (!component) {
                    return
                }

                const dx = world.x - drag.previousWorld.x
                const dy = world.y - drag.previousWorld.y
                const movingIds = selectedIds.includes(component.id) ? selectedIds : [component.id]

                for (const id of movingIds) {
                    const movingComponent = findComponentById(circuit, id)
                    movingComponent?.moveBy(dx, dy)
                }
                drag.previousWorld = world
                rerenderCircuit()
            }}
            onPointerUp={(event) => {
                if (dragRef.current?.pointerId === event.pointerId) {
                    dragRef.current = null
                    setIsDraggingComponent(false)
                }
            }}
            onPointerCancel={() => {
                dragRef.current = null
                setIsDraggingComponent(false)
            }}
            onWheel={(event) => {
                event.preventDefault()
                const zoom = Math.exp(-event.deltaY * 0.001)
                zoomAt(event.clientX, event.clientY, viewport.scale * zoom)
            }}
        />

        <Toolbar
            scale={viewport.scale}
            canDeleteSelection={canDeleteSelection}
            canModularizeSelection={canModularizeSelection}
            onCreateTransistor={createTransistor}
            onCreatePowerSource={createPowerSource}
            onCreateInputSource={createInputSource}
            onDeleteSelected={deleteSelected}
            onModularizeSelected={modularizeSelected}
            onExportCircuit={exportCircuit}
            onImportCircuit={() => importInputRef.current?.click()}
            onZoomOut={() => setViewport((current) => ({ ...current, scale: clamp(current.scale / 1.25, minScale, maxScale) }))}
            onZoomIn={() => setViewport((current) => ({ ...current, scale: clamp(current.scale * 1.25, minScale, maxScale) }))}
            onResetView={() => setViewport({ x: 180, y: 90, scale: 0.86 })}
        />

        <StatusBar
            selectedIds={selectedIds}
            selectedWireId={selectedWireId}
            pendingConnection={pendingConnection}
            itemCount={circuit.children.length}
        />
    </main>
}
