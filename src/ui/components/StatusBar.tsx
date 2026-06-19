import type { PendingConnection } from "../types"
import { statusStyle } from "../styles"

type StatusBarProps = {
    selectedIds: readonly string[]
    selectedWireId: string | null
    pendingConnection: PendingConnection | null
    itemCount: number
}

export function StatusBar({
    selectedIds,
    selectedWireId,
    pendingConnection,
    itemCount,
}: StatusBarProps) {
    const selectionLabel = selectedWireId
        ?? (selectedIds.length === 1 ? selectedIds[0] : selectedIds.length > 1 ? `${selectedIds.length} selected` : "Canvas")

    return <section style={statusStyle}>
        <span>{selectionLabel}</span>
        <span>{pendingConnection ? "Endpoint armed" : `${itemCount} items`}</span>
    </section>
}
