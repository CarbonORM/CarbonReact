import CarbonReact, { iCarbonReactState, tStatefulApiData } from "CarbonReact";
import { KeysMatching } from "./KeysMatching";
import { SubsetMatching } from "./SubsetMatching";

export enum eUpdateInsertMethod {
    REPLACE,
    FIRST,
    LAST,
}

export interface iUpdateRestfulObjectArrays<
    ObjectType extends {
        [key: string]: any;
    } = {},
    S extends { [key: string]: any; } = CarbonReact['state'],
    P =  CarbonReact['props']
> {
    instance: CarbonReact<P, S>;
    dataOrCallback: ObjectType[] | ((state: Readonly<S>, props: Readonly<P>) => ObjectType[] | null);
    stateKey: KeysMatching<S, tStatefulApiData<ObjectType>>;
    uniqueObjectId: keyof ObjectType | (keyof ObjectType)[];
    insertUpdateOrder: eUpdateInsertMethod;
    callback?: () => void;
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
export default function updateRestfulObjectArrays<
    ObjectType extends {
        [key: string]: any;
    } = {},
    S extends { [key: string]: any; } = CarbonReact['state'],
    P  = CarbonReact['props']
>({
      instance,
      dataOrCallback,
      stateKey,
      uniqueObjectId,
      insertUpdateOrder = eUpdateInsertMethod.LAST,
      callback,
  }: iUpdateRestfulObjectArrays<ObjectType, S, P>): void {

    const uniqueObjectIds = Array.isArray(uniqueObjectId) ? uniqueObjectId : [uniqueObjectId];

    type ValidObject = SubsetMatching<S & iCarbonReactState, tStatefulApiData<ObjectType>>;

    instance.setState((
            previousBootstrapState: Readonly<S & iCarbonReactState>,
            props: Readonly<P>
        ): Pick<S & iCarbonReactState, keyof S> | null => {

        let newOrReplacementData: ObjectType[] | null = [];

            if (Array.isArray(dataOrCallback)) {

                newOrReplacementData = dataOrCallback;

            } else if (typeof dataOrCallback === "function") {

                newOrReplacementData = dataOrCallback(previousBootstrapState, props);

            } else {

                throw new Error("The dataOrCallback parameter must be an array or function");

            }

            if (newOrReplacementData === null) {
                return null
            }

            const findUniqueObjectIds = (item: ObjectType, value: ObjectType) => {
                return uniqueObjectIds.every((id) => item[id] === value[id]);
            };

            const previousStateProperty = previousBootstrapState[stateKey] as tStatefulApiData<ObjectType> ?? [];

            let updatedData: tStatefulApiData<ObjectType> = newOrReplacementData.map((value) => {
                const existingObject = previousStateProperty?.find((item) =>
                    findUniqueObjectIds(item, value)
                ) || {};
                return { ...existingObject, ...value };
            });

            const filterOutUpdated = (array: tStatefulApiData<ObjectType>) => {
                return array?.filter((item) => !updatedData.some((value) => findUniqueObjectIds(item, value))) ?? [];
            };

            let newState: Partial<ValidObject> = {};

            switch (insertUpdateOrder) {
                case eUpdateInsertMethod.LAST:
                    newState[stateKey as keyof ValidObject] = [
                        ...filterOutUpdated(previousStateProperty),
                        ...updatedData,
                    ] as any;
                    break;
                case eUpdateInsertMethod.FIRST:
                    newState[stateKey as keyof ValidObject] = [
                        ...updatedData,
                        ...filterOutUpdated(previousStateProperty),
                    ] as any;
                    break;
                case eUpdateInsertMethod.REPLACE:
                    newState[stateKey as keyof ValidObject] = [
                        ...(previousStateProperty?.map((oldObject) => {
                            const index = updatedData.findIndex((item) => findUniqueObjectIds(item, oldObject));
                            if (index !== -1) {
                                return updatedData.splice(index, 1)[0];
                            }
                            return oldObject;
                        }) ?? []),
                        ...updatedData,
                    ] as any;
                    break;
                default:
                    throw new Error("The insertUpdateOrder (eUpdateInsertMethod) was not implemented");
            }

            return newState as Pick<S & iCarbonReactState, keyof S>;
        },
        callback
    );
}
