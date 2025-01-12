import { singleton } from "tsyringe";
import { Initializable } from "../common/initializable";

@singleton()
export class EventManager extends EventTarget implements Initializable {
    public async initialize(): Promise<void> {
        return;
    }

    public emit(eventName: string, detail?: any) {
        const event = new CustomEvent(eventName, { detail });
        this.dispatchEvent(event);
    }

    public on(eventName: string, callback: (event: Event) => void) {
        this.addEventListener(eventName, callback);
    }

    public off(eventName: string, callback: (event: Event) => void) {
        this.removeEventListener(eventName, callback);
    }
}
