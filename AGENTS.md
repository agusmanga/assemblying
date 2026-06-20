# Assemblying Agent Notes

## Product Model

Assemblying is an infinite-zoom circuit editor. Modules are abstractions for navigation,
reuse, and organization, but they must not become opaque black boxes.

The intended behavior is:

- From far away, a module can render as a compact block.
- As the user zooms in, the module reveals its internal structure.
- The user should be able to keep zooming down until transistor-level detail.
- Saved/imported modules should preserve their internals.
- A module may be protected from direct editing, but it should still be inspectable.

## Module Semantics

Use these concepts consistently:

- `Component`: any item placed in a circuit.
- `Module`: a composite component with `pins`, `children`, and `wires`.
- `ModuleDefinition`: a reusable saved module design with full internals.
- `ModuleInstance`: a placement of a saved definition in a circuit.

The key distinction is not closed vs open. Modules are always open for inspection by
zooming. The distinction is editable vs linked:

- Editing a definition updates all instances of that definition.
- Editing a copy/detached instance only affects that local copy.
- Detach/Edit Copy should mean "make this instance independently editable", not
  "open the box".

## Serialization Direction

Circuit/module serialization should preserve recursive internals. Do not serialize
nested modules as empty boxes unless the format also has a reliable way to resolve the
referenced definition and render its internals.

For now, exported/imported modules should round-trip as full editable module trees.

## Next Architecture Direction

The next major feature should be a local module library:

- Save a selected module as a reusable `ModuleDefinition`.
- Import/export module definitions as JSON.
- Insert saved modules with full internals visible through zoom.
- Later, add linked definitions plus Detach/Edit Copy behavior.
