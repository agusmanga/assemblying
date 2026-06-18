export abstract class Component {
    id: string
    name: string
    x: number
    y: number
    width: number
    height: number

    constructor(input: {
        id: string
        name: string
        x: number
        y: number
        width: number
        height: number
    }) {
        this.id = input.id
        this.name = input.name
        this.x = input.x
        this.y = input.y
        this.width = input.width
        this.height = input.height
    }

    moveBy(dx: number, dy: number): void {
        this.x += dx
        this.y += dy
    }

    abstract evaluate(): void
}
