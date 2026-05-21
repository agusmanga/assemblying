import { Component } from "./Component"

/**
 * Abstract class made from components
 */
export class Module extends Component {
    children: Component[] = []

    evaluate() {
        for (const child of this.children) {
            child.evaluate()
        }
    }
}