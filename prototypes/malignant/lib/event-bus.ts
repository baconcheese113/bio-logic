import type { MalignantEvents } from './types';

type EventName = keyof MalignantEvents;
type Handler<Name extends EventName> = (payload: MalignantEvents[Name]) => void;

class TypedEventBus {
  private target = new EventTarget();

  emit<Name extends EventName>(name: Name, payload: MalignantEvents[Name]) {
    this.target.dispatchEvent(new CustomEvent(String(name), { detail: payload }));
  }

  on<Name extends EventName>(name: Name, handler: Handler<Name>) {
    const listener = (event: Event) => {
      handler((event as CustomEvent<MalignantEvents[Name]>).detail);
    };
    this.target.addEventListener(String(name), listener);
    return () => this.target.removeEventListener(String(name), listener);
  }
}

export const malignantBus = new TypedEventBus();
