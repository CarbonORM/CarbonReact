import { tRestfulObjectArrayValues, tStatefulApiData } from "variables/C6";
import CarbonReact, {iCarbonReactState} from "CarbonReact";
import { KeysMatching } from "./KeysMatching";

export enum eUpdateInsertMethod {
    REPLACE,
    FIRST,
    LAST,
}

/**
 * Updates or inserts objects in a stateful array, merging new data with existing objects.
 * @param instance - The React component instance.
 * @param dataOrCallback - Array of objects or a callback function returning an array of objects.
 * @param stateKey - The key in the state where the data array is stored.
 * @param uniqueObjectId - The unique identifier(s) for objects, typically the primary key of the table.
 * @param insertUpdateOrder - The order in which new data should be inserted/updated.
 * @param callback - Optional callback function to run after state update.
 */
export default function updateRestfulObjectArrays<ObjectType = tRestfulObjectArrayValues, S extends iCarbonReactState = iCarbonReactState, P = CarbonReact['props']>(
    instance: CarbonReact,
    dataOrCallback: ObjectType[] | ((state: Readonly<S>, props: Readonly<P>) => ObjectType[] | null),
    stateKey: KeysMatching<S, tStatefulApiData<ObjectType>>,
    uniqueObjectId: keyof ObjectType | (keyof ObjectType)[],
    insertUpdateOrder: eUpdateInsertMethod = eUpdateInsertMethod.LAST,
    callback?: () => void
): void {

    const uniqueObjectIds = Array.isArray(uniqueObjectId) ? uniqueObjectId : [uniqueObjectId];

    (instance).setState((previousBootstrapState: Readonly<S>, props: Readonly<P>): {} => {

        let newOrReplacementData: ObjectType[] | null = [];

        if (Array.isArray(dataOrCallback)) {

            newOrReplacementData = dataOrCallback;

        } else if (typeof dataOrCallback === 'function') {

            newOrReplacementData = dataOrCallback(previousBootstrapState, props);

        } else {

            throw new Error('The dataOrCallback parameter must be an array or function');

        }

        if (!newOrReplacementData) return {};

        const findUniqueObjectIds = (item: ObjectType, value: ObjectType) => {
            return uniqueObjectIds.every(id => item[id] === value[id]);
        };

        const previousStateProperty = previousBootstrapState[stateKey] as ObjectType[];

        let updatedData: ObjectType[] = newOrReplacementData.map(value => {
            const existingObject = previousStateProperty?.find(item => findUniqueObjectIds(item, value)) || {};
            return { ...existingObject, ...value };
        });

        const filterOutUpdated = (array: ObjectType[]) => {
            return array.filter(item => !updatedData.some(value => findUniqueObjectIds(item, value)));
        };

        switch (insertUpdateOrder) {
            case eUpdateInsertMethod.LAST:
                return {
                    [stateKey]: [
                        ...filterOutUpdated(previousStateProperty),
                        ...updatedData,
                    ]
                };
            case eUpdateInsertMethod.FIRST:
                return {
                    [stateKey]: [
                        ...updatedData,
                        ...filterOutUpdated(previousStateProperty),
                    ]
                };
            case eUpdateInsertMethod.REPLACE:
                return {
                    [stateKey]: [
                        ...previousStateProperty.map(oldObject => {
                            const index = updatedData.findIndex(item => findUniqueObjectIds(item, oldObject));
                            if (index !== -1) {
                                return updatedData.splice(index, 1)[0];
                            }
                            return oldObject;
                        }),
                        ...updatedData
                    ]
                };
            default:
                throw new Error('The insertUpdateOrder (eUpdateInsertMethod) was not implemented');
        }
    }, callback);
}
