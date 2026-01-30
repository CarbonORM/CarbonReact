import CarbonReact, { iCarbonReactState, tStatefulApiData } from "core/CarbonReact";
import { KeysMatching } from "types/KeysMatching";
import { iStateAdapter } from "./stateAdapter";

export interface iDeleteRestfulObjectArrays<
    ObjectType extends {
        [key: string]: any
    } = {},
    S extends iCarbonReactState = CarbonReact['state'],
    P = CarbonReact['props']
> {
    instance: CarbonReact<P, S>,
    dataOrCallback: ObjectType[] | ((state: Readonly<S>, props: Readonly<P>) => ObjectType[] | null),
    stateKey: KeysMatching<S, tStatefulApiData<ObjectType>>,
    uniqueObjectId: keyof ObjectType | (keyof ObjectType)[],
    callback?: () => void,
    stateAdapter?: iStateAdapter<S>
}

export default function deleteRestfulObjectArrays<
    ObjectType extends {
        [key: string]: any
    } = {},
    S extends iCarbonReactState = CarbonReact['state'],
    P = CarbonReact['props']
>({
      instance,
      dataOrCallback,
      stateKey,
      uniqueObjectId,
      callback,
      stateAdapter
  }: iDeleteRestfulObjectArrays<ObjectType, S, P>): void {

    const uniqueObjectIds = Array.isArray(uniqueObjectId) ? uniqueObjectId : [uniqueObjectId];
    const resolvedStateAdapter = stateAdapter ?? instance.stateAdapter;

    const computeNextState = (
        previousBootstrapState: Readonly<S & iCarbonReactState>,
        props: Readonly<P>
    ): Pick<S & iCarbonReactState, keyof S> | null => {

        let newOrReplacementData: ObjectType[] = [];

        if (Array.isArray(dataOrCallback)) {

            newOrReplacementData = dataOrCallback;

        } else if (typeof dataOrCallback === 'function') {

            const callbackReturn = dataOrCallback(previousBootstrapState, props);

            if (callbackReturn === null) {

                return null; // No updates needed (noop)

            }

            newOrReplacementData = callbackReturn;

        } else {

            throw new Error('The dataOrCallback parameter was not an array or function');

        }

        const previousStateProperty: tStatefulApiData<ObjectType> = previousBootstrapState[stateKey] as tStatefulApiData<ObjectType>;

        const updatedStateProperty = previousStateProperty?.filter(item =>
            !newOrReplacementData.some(value =>
                uniqueObjectIds.every(uniqueId => value[uniqueId] === item[uniqueId])
            )
        ) ?? [];

        return {
            [stateKey]: updatedStateProperty
        } as Pick<S & iCarbonReactState, keyof S>;

    };

    if (resolvedStateAdapter) {
        const previousBootstrapState = resolvedStateAdapter.getState();
        const nextState = computeNextState(previousBootstrapState, instance.props as Readonly<P>);
        if (nextState !== null) {
            resolvedStateAdapter.setState(nextState as Partial<S>);
            callback?.();
        }
        return;
    }

    instance.setState(computeNextState, callback);
}
