import CarbonReact, {iCarbonReactState} from "CarbonReact";
import {tRestfulObjectArrayValues, tStatefulApiData} from "variables/C6";
import {KeysMatching} from "./KeysMatching";


//ObjectType, UniqueIdType extends keyof ObjectType
// @link https://www.typescriptlang.org/docs/handbook/2/mapped-types.html
export default function deleteRestfulObjectArrays<
    ObjectType = tRestfulObjectArrayValues,
    S extends iCarbonReactState = iCarbonReactState,
    P = CarbonReact['props']
>(
    instance: CarbonReact,
    dataOrCallback: ObjectType[] | ((state: Readonly<S>, props: Readonly<P>) => ObjectType[] | null),
    stateKey: KeysMatching<S, tStatefulApiData<ObjectType>>,
    uniqueObjectId: (keyof ObjectType) | (keyof ObjectType)[],
    callback?: () => void
): void {

    const uniqueObjectIds = uniqueObjectId instanceof Array ? uniqueObjectId : [uniqueObjectId];

    instance.setState((previousBootstrapState: Readonly<S>, props: Readonly<P>): {} | null => {
        let newOrReplacementData: ObjectType[] = [];

        if (Array.isArray(dataOrCallback)) {

            newOrReplacementData = dataOrCallback;

        } else if (typeof dataOrCallback === 'function') {

            const callbackReturn = dataOrCallback(previousBootstrapState, props);

            if (callbackReturn === null) {

                // No updates needed (noop)
                return null;

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
        };
    }, callback);
}
