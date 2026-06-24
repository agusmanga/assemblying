import type { Module } from "../../domain/circuit/Model/Module"
import {
    breadcrumbButtonStyle,
    breadcrumbSeparatorStyle,
    breadcrumbStyle,
} from "../styles"

type ModuleBreadcrumbProps = {
    path: readonly Module[]
    onSelectModule: (module: Module) => void
}

export function ModuleBreadcrumb({ path, onSelectModule }: ModuleBreadcrumbProps) {
    return <nav aria-label="Module path" style={breadcrumbStyle}>
        {path.map((module, index) => (
            <span key={module.id} style={{ display: "contents" }}>
                {index > 0 && <span style={breadcrumbSeparatorStyle}>/</span>}
                <button
                    type="button"
                    title={module.name}
                    onClick={() => onSelectModule(module)}
                    style={{
                        ...breadcrumbButtonStyle,
                        background: index === path.length - 1 ? "rgba(31, 111, 100, 0.12)" : "transparent",
                    }}
                >
                    {module.name}
                </button>
            </span>
        ))}
    </nav>
}
