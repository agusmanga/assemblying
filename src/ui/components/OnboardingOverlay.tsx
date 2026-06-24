import {
    onboardingCardTextStyle,
    onboardingHeaderStyle,
    onboardingOverlayStyle,
    onboardingPanelStyle,
    onboardingSpotlightStyle,
    onboardingTitleStyle,
    panelButtonStyle,
    secondaryPanelButtonStyle,
} from "../styles"
import { useState, type CSSProperties } from "react"

type OnboardingOverlayProps = {
    onClose: () => void
}

const steps = [
    {
        title: "Place parts",
        text: "Use the toolbar to add NMOS, PMOS, logical 1/0, and inputs. The controls are grouped by creation, editing, files, zoom, and help.",
        panel: { top: 86, right: 18 },
        spotlight: { top: 18, right: 18, width: 620, height: 58 },
    },
    {
        title: "Wire the circuit",
        text: "Click a pin or wire endpoint, then click another endpoint to connect them. Drag parts on the canvas to lay out the circuit.",
        panel: { left: "50%", top: "50%", transform: "translate(-50%, -50%)" },
        spotlight: { left: "28%", top: "24%", width: "44%", height: "42%" },
    },
    {
        title: "Inspect modules",
        text: "Zoom into a module to reveal internals. Double-click a module to focus it; the viewport jumps in so the internals are visible.",
        panel: { right: 18, bottom: 84 },
        spotlight: { right: 18, bottom: 18, width: 520, height: 46 },
    },
    {
        title: "Save reusable modules",
        text: "The library stores full module internals. Save selected modules, import JSON, and insert saved modules from the sidebar.",
        panel: { left: 296, top: 18 },
        spotlight: { left: 18, top: 18, width: 260, height: "calc(100% - 36px)" },
    },
]

export function OnboardingOverlay({ onClose }: OnboardingOverlayProps) {
    const [stepIndex, setStepIndex] = useState(0)
    const step = steps[stepIndex]
    const isLastStep = stepIndex === steps.length - 1
    const panelStyle = {
        ...onboardingPanelStyle,
        ...step.panel,
    } satisfies CSSProperties
    const spotlightStyle = {
        ...onboardingSpotlightStyle,
        ...step.spotlight,
    } satisfies CSSProperties

    return <div style={onboardingOverlayStyle}>
        <div style={spotlightStyle} />
        <section aria-labelledby="onboarding-title" style={panelStyle}>
            <header style={onboardingHeaderStyle}>
                <div>
                    <h1 id="onboarding-title" style={onboardingTitleStyle}>{step.title}</h1>
                    <p style={{ ...onboardingCardTextStyle, marginTop: 6 }}>Step {stepIndex + 1} of {steps.length}</p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    style={{ ...secondaryPanelButtonStyle, minWidth: 38 }}
                    aria-label="Close onboarding"
                    title="Close onboarding"
                >
                    x
                </button>
            </header>

            <p style={onboardingCardTextStyle}>{step.text}</p>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 14 }}>
                <button
                    type="button"
                    disabled={stepIndex === 0}
                    onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
                    style={{
                        ...secondaryPanelButtonStyle,
                        minWidth: 86,
                        opacity: stepIndex === 0 ? 0.45 : 1,
                        cursor: stepIndex === 0 ? "default" : "pointer",
                    }}
                >
                    Back
                </button>
                <button
                    type="button"
                    onClick={() => {
                        if (isLastStep) {
                            onClose()
                        } else {
                            setStepIndex((current) => current + 1)
                        }
                    }}
                    style={{ ...panelButtonStyle, minWidth: 110 }}
                >
                    {isLastStep ? "Start" : "Next"}
                </button>
            </div>
        </section>
    </div>
}
