import { useCallback, useEffect, useRef, useState } from "react"
import { Module } from "./domain/circuit/Model/Module"
import {
    instantiateModuleDefinition,
    normalizeModuleDefinitionForLibrary,
} from "./domain/circuit/library/moduleDefinitionInstance"
import { createSampleCircuit } from "./domain/circuit/sampleCircuit"
import { deserializeModule, serializeModule } from "./domain/circuit/serialization/moduleSerializer"
import type { ModuleDefinitionData } from "./domain/circuit/schema/CircuitSchema"
import {
    clearCircuitLocalStorage,
    loadCircuitFromLocalStorage,
    saveCircuitToLocalStorage,
} from "./domain/circuit/storage/circuitLocalStorage"
import {
    deleteModuleDefinition,
    listModuleDefinitions,
    loadModuleDefinition,
    renameModuleDefinition,
    saveModuleDefinition,
} from "./domain/circuit/storage/moduleLibraryStorage"
import { drawComponent, drawGrid, drawWire, setupCanvas, strokePath } from "./ui/canvas/renderer"
import {
    maxScale,
    minScale,
} from "./ui/constants"
import { LibrarySidebar } from "./ui/components/LibrarySidebar"
import { ModuleBreadcrumb } from "./ui/components/ModuleBreadcrumb"
import { OnboardingOverlay } from "./ui/components/OnboardingOverlay"
import { Toolbar } from "./ui/components/Toolbar"
import {
    addClockSourceTo,
    addLedTo,
    addModuleTo,
    addInputSourceTo,
    addOutputProbeTo,
    addPowerSourceTo,
    addTransistorTo,
    canRemoveComponent,
    connectEndpoints,
    createModuleFromSelection,
    demodularizeModule,
    findComponentAt,
    findComponentById,
    findModuleResizeHandleAt,
    findPinAt,
    findWireAt,
    pendingConnectionPoint,
    removeComponent,
    removeWire,
    resizeModule,
    syncDirectWires,
    toggleInputAt,
} from "./ui/circuit/editor"
import { clamp, screenToWorld } from "./ui/geometry"
import { appStyle } from "./ui/styles"
import type { DragState, PendingConnection, Point, ToolComponentKind, Viewport } from "./ui/types"

function createInitialCircuit() {
    try {
        const savedCircuit = loadCircuitFromLocalStorage()
        return savedCircuit ? deserializeModule(savedCircuit) : createSampleCircuit()
    } catch (error) {
        console.error("Could not load saved circuit", error)
        clearCircuitLocalStorage()
        return createSampleCircuit()
    }
}

const onboardingStorageKey = "assemblying:onboarding:v1"

function shouldShowOnboarding() {
    try {
        return window.localStorage.getItem(onboardingStorageKey) !== "done"
    } catch {
        return true
    }
}

function circuitInsertionPoint(circuit: Module, fallback: Point): Point {
    if (circuit.children.length === 0) {
        return fallback
    }

    const maxX = Math.max(...circuit.children.map((component) => component.x + component.width))
    const minY = Math.min(...circuit.children.map((component) => component.y))

    return {
        x: maxX + 72,
        y: minY,
    }
}

function modulePathTo(root: Module, moduleId: string | null): Module[] | null {
    if (!moduleId || root.id === moduleId) {
        return [root]
    }

    for (const child of root.children) {
        if (!(child instanceof Module)) {
            continue
        }

        const nestedPath = modulePathTo(child, moduleId)
        if (nestedPath) {
            return [root, ...nestedPath]
        }
    }

    return null
}

export function App() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const dragRef = useRef<DragState | null>(null)
    const importInputRef = useRef<HTMLInputElement | null>(null)
    const importLibraryModuleInputRef = useRef<HTMLInputElement | null>(null)
    const [circuit, setCircuit] = useState(createInitialCircuit)
    const [revision, setRevision] = useState(0)
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [transparentIds, setTransparentIds] = useState<string[]>([])
    const [selectedWireId, setSelectedWireId] = useState<string | null>(null)
    const [pendingConnection, setPendingConnection] = useState<PendingConnection | null>(null)
    const [pointerWorld, setPointerWorld] = useState<Point | null>(null)
    const [isDraggingComponent, setIsDraggingComponent] = useState(false)
    const [viewport, setViewport] = useState<Viewport>({ x: 180, y: 90, scale: 0.86 })
    const [moduleLibrary, setModuleLibrary] = useState<ModuleDefinitionData[]>(() => listModuleDefinitions())
    const [selectedLibraryModuleId, setSelectedLibraryModuleId] = useState<string>("")
    const [isLibraryVisible, setIsLibraryVisible] = useState(true)
    const [activeModuleId, setActiveModuleId] = useState<string | null>(null)
    const [isOnboardingOpen, setIsOnboardingOpen] = useState(shouldShowOnboarding)
    const [activeTool, setActiveTool] = useState<ToolComponentKind | null>(null)
    const pendingPinId = pendingConnection?.type === "pin" ? pendingConnection.pinId : null
    const activeModulePath = modulePathTo(circuit, activeModuleId) ?? [circuit]
    const openModuleIds = new Set(activeModulePath.slice(1).map((module) => module.id))
    const canDeleteSelection = !!selectedWireId || selectedIds.some((id) => canRemoveComponent(circuit, id))
    const canModularizeSelection = selectedIds.length > 0 && !selectedWireId
    const canSaveModuleSelection = selectedIds.length === 1
        && findComponentById(circuit, selectedIds[0]) instanceof Module
    const canDemodularizeSelection = canSaveModuleSelection
    const canInsertLibraryModule = selectedLibraryModuleId.length > 0
    const canEditLibraryModule = selectedLibraryModuleId.length > 0

    useEffect(() => {
        const canvasElement = canvasRef.current
        if (!canvasElement) {
            return
        }

        let frame = 0

        const drawFrame = (animationTime: number) => {
            const setup = setupCanvas(canvasElement)
            if (!setup) {
                return
            }

            circuit.evaluate()
            drawGrid(setup.context, setup.width, setup.height, viewport)
            setup.context.save()
            setup.context.translate(viewport.x, viewport.y)
            setup.context.scale(viewport.scale, viewport.scale)

            for (const wire of circuit.wires) {
                drawWire(setup.context, wire, viewport.scale, selectedWireId === wire.id, animationTime)
            }

            for (const child of circuit.children) {
                drawComponent(setup.context, child, viewport.scale, selectedIds, transparentIds, selectedWireId, pendingPinId, 0, animationTime)
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
            frame = window.requestAnimationFrame(drawFrame)
        }

        frame = window.requestAnimationFrame(drawFrame)
        return () => window.cancelAnimationFrame(frame)
    }, [circuit, pendingConnection, pendingPinId, pointerWorld, revision, selectedIds, selectedWireId, transparentIds, viewport])

    useEffect(() => {
        const handleResize = () => setViewport((current) => ({ ...current }))
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    function rerenderCircuit() {
        syncDirectWires(circuit)
        saveCircuitToLocalStorage(serializeModule(circuit))
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
            const deletesActiveModule = activeModuleId ? selectedIds.includes(activeModuleId) : false
            let deleted = false
            for (const id of selectedIds) {
                deleted = removeComponent(circuit, id) || deleted
            }
            if (deleted) {
                if (deletesActiveModule) {
                    setActiveModuleId(null)
                }
                setSelectedIds([])
                setTransparentIds((current) => current.filter((id) => !selectedIds.includes(id)))
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

    function demodularizeSelected() {
        if (selectedIds.length !== 1) {
            return
        }

        const promotedChildren = demodularizeModule(circuit, selectedIds[0])
        if (promotedChildren) {
            if (activeModuleId === selectedIds[0]) {
                setActiveModuleId(null)
            }
            setSelectedIds(promotedChildren.map((component) => component.id))
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
            saveCircuitToLocalStorage(serializeModule(nextCircuit))
            setCircuit(nextCircuit)
            setSelectedIds([])
            setTransparentIds([])
            setSelectedWireId(null)
            setPendingConnection(null)
            setPointerWorld(null)
            setActiveModuleId(null)
            dragRef.current = null
            setIsDraggingComponent(false)
            setRevision((current) => current + 1)
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown import error"
            window.alert(`Could not import circuit JSON: ${message}`)
        }
    }

    function exportSelectedLibraryModule() {
        const module = loadModuleDefinition(selectedLibraryModuleId)
        if (!module) {
            return
        }

        const blob = new Blob([JSON.stringify(module, null, 2)], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `${module.name.toLowerCase().replaceAll(/\s+/g, "-")}.assemblying-module.json`
        link.click()
        URL.revokeObjectURL(url)
    }

    async function importLibraryModuleFile(file: File) {
        try {
            const text = await file.text()
            const data = normalizeModuleDefinitionForLibrary(JSON.parse(text) as ModuleDefinitionData)
            deserializeModule(data)
            saveModuleDefinition(data)
            refreshModuleLibrary(data.id)
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown import error"
            window.alert(`Could not import module JSON: ${message}`)
        }
    }

    function createNewCircuit() {
        const nextCircuit = createSampleCircuit()
        clearCircuitLocalStorage()
        setCircuit(nextCircuit)
        setSelectedIds([])
        setTransparentIds([])
        setSelectedWireId(null)
        setPendingConnection(null)
        setPointerWorld(null)
        setActiveModuleId(null)
        dragRef.current = null
        setIsDraggingComponent(false)
        setViewport({ x: 180, y: 90, scale: 0.86 })
        setRevision((current) => current + 1)
    }

    function saveSelectedModuleToLibrary() {
        if (selectedIds.length !== 1) {
            return
        }

        const component = findComponentById(circuit, selectedIds[0])
        if (!(component instanceof Module)) {
            return
        }

        const data = normalizeModuleDefinitionForLibrary(serializeModule(component))
        saveModuleDefinition(data)
        refreshModuleLibrary(data.id)
    }

    function insertLibraryModule() {
        const definition = loadModuleDefinition(selectedLibraryModuleId)
        const canvas = canvasRef.current
        if (!definition || !canvas) {
            return
        }

        const selectedComponent = selectedIds.length === 1
            ? findComponentById(circuit, selectedIds[0])
            : null
        const rect = canvas.getBoundingClientRect()
        const center = screenToWorld(rect.width / 2, rect.height / 2, viewport)
        const fallback = {
            x: center.x - definition.bounds.width / 2,
            y: center.y - definition.bounds.height / 2,
        }
        const insertionPoint = selectedComponent instanceof Module
            ? {
                x: selectedComponent.x + selectedComponent.width + 72,
                y: selectedComponent.y,
            }
            : circuitInsertionPoint(circuit, fallback)
        const x = insertionPoint.x
        const y = insertionPoint.y
        const module = instantiateModuleDefinition(definition, {
            idPrefix: `module-copy-${Date.now()}:`,
            x,
            y,
        })

        addModuleTo(circuit, module)
        setSelectedIds([module.id])
        setSelectedWireId(null)
        setPendingConnection(null)
        rerenderCircuit()
    }

    function refreshModuleLibrary(nextSelectedId = selectedLibraryModuleId) {
        const nextLibrary = listModuleDefinitions()
        setModuleLibrary(nextLibrary)
        setSelectedLibraryModuleId(
            nextLibrary.some((module) => module.id === nextSelectedId)
                ? nextSelectedId
                : "",
        )
    }

    function deleteSelectedLibraryModule() {
        if (!selectedLibraryModuleId) {
            return
        }

        deleteModuleDefinition(selectedLibraryModuleId)
        refreshModuleLibrary("")
    }

    function renameSelectedLibraryModule() {
        const module = moduleLibrary.find((candidate) => candidate.id === selectedLibraryModuleId)
        if (!module) {
            return
        }

        const name = window.prompt("Module name", module.name)?.trim()
        if (!name) {
            return
        }

        renameModuleDefinition(module.id, name)
        refreshModuleLibrary(module.id)
    }

    function focusModule(module: Module) {
        setActiveModuleId(module === circuit ? null : module.id)
        setSelectedIds(module === circuit ? [] : [module.id])
        setSelectedWireId(null)
        setPendingConnection(null)

        const path = modulePathTo(circuit, module.id)
        const openModuleIds = new Set(
            module === circuit ? [] : (path ?? []).slice(1).map((pathModule) => pathModule.id),
        )
        setTransparentIds((current) => current
            .filter((id) => !(findComponentById(circuit, id) instanceof Module))
            .concat([...openModuleIds]))

        if (module === circuit) {
            return
        }

        const canvas = canvasRef.current
        if (!canvas || !path) {
            return
        }

        const rect = canvas.getBoundingClientRect()
        const leftInset = isLibraryVisible ? 296 : 32
        const rightInset = 32
        const topInset = 96
        const bottomInset = 72
        const availableWidth = Math.max(160, rect.width - leftInset - rightInset)
        const availableHeight = Math.max(160, rect.height - topInset - bottomInset)
        const fitScale = Math.min(
            availableWidth / Math.max(1, module.width),
            availableHeight / Math.max(1, module.height),
        ) * 0.9
        const scale = clamp(Math.min(fitScale, 1.25), minScale, maxScale)
        const centerX = module.x + module.width / 2
        const centerY = module.y + module.height / 2
        const screenCenterX = leftInset + availableWidth / 2
        const screenCenterY = topInset + availableHeight / 2

        setViewport({
            scale,
            x: screenCenterX - centerX * scale,
            y: screenCenterY - centerY * scale,
        })
    }

    function closeOnboarding() {
        try {
            window.localStorage.setItem(onboardingStorageKey, "done")
        } catch {
            // Ignore storage failures; the overlay can still close for this session.
        }
        setIsOnboardingOpen(false)
    }

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setActiveTool(null)
                setPendingConnection(null)
                return
            }

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

    const addToolComponent = useCallback((kind: ToolComponentKind, point: Point) => {
        const component = (() => {
            switch (kind) {
                case "nmos":
                    return addTransistorTo(circuit, "nmos", point)
                case "pmos":
                    return addTransistorTo(circuit, "pmos", point)
                case "vdd":
                    return addPowerSourceTo(circuit, "vdd", point)
                case "gnd":
                    return addPowerSourceTo(circuit, "gnd", point)
                case "input":
                    return addInputSourceTo(circuit, point)
                case "output":
                    return addOutputProbeTo(circuit, point)
                case "led":
                    return addLedTo(circuit, point)
                case "clock":
                    return addClockSourceTo(circuit, point)
            }
        })()

        setSelectedIds([component.id])
        setSelectedWireId(null)
        setPendingConnection(null)
        setActiveTool(null)
        syncDirectWires(circuit)
        saveCircuitToLocalStorage(serializeModule(circuit))
        setRevision((current) => current + 1)
    }, [circuit])

    useEffect(() => {
        if (!activeTool) {
            return
        }

        const handlePointerUp = (event: PointerEvent) => {
            const canvas = canvasRef.current
            if (!canvas) {
                setActiveTool(null)
                return
            }

            const rect = canvas.getBoundingClientRect()
            const isOverCanvas = event.clientX >= rect.left
                && event.clientX <= rect.right
                && event.clientY >= rect.top
                && event.clientY <= rect.bottom

            if (!isOverCanvas) {
                setActiveTool(null)
                return
            }

            const point = screenToWorld(event.clientX - rect.left, event.clientY - rect.top, viewport)
            addToolComponent(activeTool, point)
        }

        window.addEventListener("pointerup", handlePointerUp)
        return () => window.removeEventListener("pointerup", handlePointerUp)
    }, [activeTool, addToolComponent, viewport])

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
        <input
            ref={importLibraryModuleInputRef}
            type="file"
            accept="application/json,.json,.assemblying-module.json"
            style={{ display: "none" }}
            onChange={(event) => {
                const file = event.currentTarget.files?.[0]
                event.currentTarget.value = ""
                if (file) {
                    void importLibraryModuleFile(file)
                }
            }}
        />
        <canvas
            ref={canvasRef}
            style={{
                width: "100%",
                height: "100%",
                display: "block",
                cursor: activeTool ? "copy" : isDraggingComponent ? "grabbing" : "grab",
                touchAction: "none",
            }}
            onDoubleClick={(event) => {
                const world = worldFromClientPoint(event.clientX, event.clientY)
                if (!world) {
                    return
                }

                if (toggleInputAt(circuit, world, viewport.scale, openModuleIds)) {
                    setPendingConnection(null)
                    rerenderCircuit()
                    return
                }

                const component = findComponentAt(circuit, world, viewport.scale, openModuleIds)
                if (component instanceof Module) {
                    focusModule(component)
                    return
                }

                if (component) {
                    setTransparentIds((current) => (
                        current.includes(component.id)
                            ? current.filter((id) => id !== component.id)
                            : [...current, component.id]
                    ))
                    setSelectedIds([component.id])
                    setSelectedWireId(null)
                    setPendingConnection(null)
                    return
                }

                zoomAt(event.clientX, event.clientY, viewport.scale * 1.7)
            }}
            onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId)
                const world = worldFromEvent(event)
                setPointerWorld(world)

                const resizeModuleHit = findModuleResizeHandleAt(circuit, world, viewport.scale, openModuleIds)
                if (resizeModuleHit && selectedIds.includes(resizeModuleHit.id)) {
                    setSelectedIds([resizeModuleHit.id])
                    setSelectedWireId(null)
                    setPendingConnection(null)
                    dragRef.current = {
                        type: "module-resize",
                        pointerId: event.pointerId,
                        moduleId: resizeModuleHit.id,
                    }
                    setIsDraggingComponent(true)
                    return
                }

                const pinHit = findPinAt(circuit, world, viewport.scale, openModuleIds)
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

                const wireHit = findWireAt(circuit, world, viewport.scale, openModuleIds)
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

                const component = findComponentAt(circuit, world, viewport.scale, openModuleIds)
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

                if (drag.type === "module-resize") {
                    const module = findComponentById(circuit, drag.moduleId)
                    if (module instanceof Module) {
                        resizeModule(module, world)
                        rerenderCircuit()
                    }
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
            canDemodularizeSelection={canDemodularizeSelection}
            activeTool={activeTool}
            onPickTool={setActiveTool}
            onDeleteSelected={deleteSelected}
            onModularizeSelected={modularizeSelected}
            onDemodularizeSelected={demodularizeSelected}
            onExportCircuit={exportCircuit}
            onImportCircuit={() => importInputRef.current?.click()}
            onCreateNewCircuit={createNewCircuit}
            onZoomOut={() => setViewport((current) => ({ ...current, scale: clamp(current.scale / 1.25, minScale, maxScale) }))}
            onZoomIn={() => setViewport((current) => ({ ...current, scale: clamp(current.scale * 1.25, minScale, maxScale) }))}
            onResetView={() => setViewport({ x: 180, y: 90, scale: 0.86 })}
            onShowOnboarding={() => setIsOnboardingOpen(true)}
        />

        <ModuleBreadcrumb
            path={activeModulePath}
            onSelectModule={focusModule}
        />

        <LibrarySidebar
            isOpen={isLibraryVisible}
            modules={moduleLibrary}
            selectedModuleId={selectedLibraryModuleId}
            canSaveSelection={canSaveModuleSelection}
            canInsertModule={canInsertLibraryModule}
            canEditModule={canEditLibraryModule}
            onSaveSelectedModule={saveSelectedModuleToLibrary}
            onSelectModule={setSelectedLibraryModuleId}
            onInsertModule={insertLibraryModule}
            onRenameModule={renameSelectedLibraryModule}
            onDeleteModule={deleteSelectedLibraryModule}
            onExportModule={exportSelectedLibraryModule}
            onImportModule={() => importLibraryModuleInputRef.current?.click()}
            onToggle={() => setIsLibraryVisible((visible) => !visible)}
        />

        {isOnboardingOpen && <OnboardingOverlay onClose={closeOnboarding} />}
    </main>
}
