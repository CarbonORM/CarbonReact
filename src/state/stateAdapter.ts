export interface iStateAdapter<S> {
    getState(): S;
    setState(partial: Partial<S>): void;
}

export class InMemoryStateAdapter<S extends Record<string, any>> implements iStateAdapter<S> {
    private state: S;

    constructor(initialState: S) {
        this.state = initialState;
    }

    getState(): S {
        return this.state;
    }

    setState(partial: Partial<S>): void {
        this.state = { ...this.state, ...partial };
    }

    snapshot(): S {
        return this.state;
    }

    hydrate(snapshot: S): void {
        this.state = snapshot;
    }
}

export const serializeStateSnapshot = <S>(state: S): string => JSON.stringify(state);

export const deserializeStateSnapshot = <S>(serialized: string): S => JSON.parse(serialized) as S;

export const getStateSnapshot = <S>(adapter: iStateAdapter<S>): S => adapter.getState();

export const createInMemoryStateAdapter = <S extends Record<string, any>>(initialState: S) =>
    new InMemoryStateAdapter(initialState);
