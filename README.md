# Assemblying

Assemblying is an interactive digital circuit sketcher for building and exploring transistor-level logic. It focuses on a direct canvas workflow: place components, wire pins together, group circuitry into modules, and inspect the behavior of the resulting circuit.

The project is currently a browser-based prototype built with React, TypeScript, and Vite.

<img width="1470" height="730" alt="image" src="https://github.com/user-attachments/assets/dd10f450-eea8-4201-84cf-ff0e9f0c10f7" />



## Features

- Canvas-based circuit editor with pan and zoom
- NMOS, PMOS, VDD, GND, and toggleable input components
- Wire creation between pins and existing wire segments
- Signal coloring for high, low, and floating wires
- Module creation from selected components
- Generated module input/output pins for wires crossing module boundaries
- Protected module internals: modules can be deleted, while ordinary inner components are preserved
- Nested module rendering with shell/detail views based on zoom level

## Controls

- Click a component, pin, or wire to select it
- Shift-click components to build a multi-selection
- Click `Mod` to turn the selected components into a module
- Click two pins, wires, or pin/wire endpoints to connect them
- Double-click an input source to toggle its value
- Double-click a module to center it and reveal its internal circuit
- Use the module breadcrumb in the bottom-right corner to navigate back out
- Use the mouse wheel to zoom
- Drag the canvas to pan
- Drag selected components to move them
- Press `Delete` or `Backspace` to delete the selected removable item

## Development

```sh
npm install
npm run dev
```

Production build:

```sh
npm run build
```

Lint:

```sh
npm run lint
```

## Project Structure

- `src/App.tsx` coordinates React state, canvas events, and editor actions
- `src/ui/canvas/renderer.ts` contains canvas drawing code
- `src/ui/circuit/editor.ts` contains circuit editing, hit testing, wiring, deletion, and modularisation logic
- `src/domain/circuit/Model/` contains the circuit domain model
- `src/domain/circuit/sampleCircuit.ts` defines the initial sample circuit
