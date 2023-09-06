import {tRestfulObjectArrayValues, tStatefulApiData} from "variables/C6";
import CarbonReact from "CarbonReact";
import {KeysMatching} from "./KeysMatching";


export enum eUpdateInsertMethod {
    REPLACE,
    FIRST,
    LAST,
}

/**
 *
 *                  merged with existing objects.uniqueObjectId || {}.
 * @param dataOrCallback
 * @param uniqueObjectId - the uniqueObjectId of the object to update; typically the primary key of the table.
 * @param stateKey -
 * @param insertUpdateOrder
 * @param callback - if you want to do something with the updated state, you can pass a callback here. Run as the second
 *  parameter of setState.
 */
export default function updateRestfulObjectArrays<ObjectType = tRestfulObjectArrayValues, S = typeof CarbonReact.instance.state, P = typeof CarbonReact.instance.props>
(dataOrCallback: ObjectType[] | (<K extends keyof S>(
     state: ((prevState: Readonly<S>, props: Readonly<P>) => (Pick<S, K> | S | null)) | (Pick<S, K> | S | null),
     callback?: () => void
 ) => null|(ObjectType[])),
 stateKey: KeysMatching<S, tStatefulApiData<ObjectType>>,
 uniqueObjectId: (keyof ObjectType) | (keyof ObjectType)[],
 insertUpdateOrder: eUpdateInsertMethod = eUpdateInsertMethod.LAST,
 callback?: () => void): void {

    const uniqueObjectIds = uniqueObjectId instanceof Array ? uniqueObjectId : [uniqueObjectId];

    const bootstrap = CarbonReact.instance;

    return bootstrap.setState((previousBootstrapState, props): {} => {

        let newOrReplacementData: null|(ObjectType[]) = [];

        if (dataOrCallback instanceof Array) {

            newOrReplacementData = dataOrCallback

        } else if (dataOrCallback instanceof Function) {

            newOrReplacementData = dataOrCallback(previousBootstrapState, props);

        } else {

            throw Error('The dataOrCallback parameter was not an array or function')

        }

        const findUniqueObjectIds = (item : ObjectType, value: ObjectType) => {

            let isMatch = true;

            uniqueObjectIds.find(uniqueObjectId => {

                if (value[uniqueObjectId] !== item[uniqueObjectId]) {

                    isMatch = false;

                    return true;

                }

                return false;

            })

            return isMatch;

        }

        const previousStateProperty : ObjectType[] = previousBootstrapState[stateKey];

        let updatedData : ObjectType[] = newOrReplacementData?.map(value => {
            return {
                ...previousStateProperty?.find(previousValue => findUniqueObjectIds(previousValue, value)) || {},
                ...value
            }
        }) ?? [];

        switch (insertUpdateOrder) {
            default:
                throw Error('The insertUpdateOrder (eUpdateInsertMethod) was not implemented')
            case eUpdateInsertMethod.LAST:
                return {
                    [stateKey]: null === newOrReplacementData ? null : [
                        ...updatedData,
                        ...(previousStateProperty?.filter(item => false === (updatedData?.find(value => findUniqueObjectIds(item, value)) || false)) ?? [])
                    ]
                }

            case eUpdateInsertMethod.FIRST:
                return {
                    [stateKey]: null === newOrReplacementData ? null : [
                        ...(previousStateProperty?.filter(item => false === (updatedData?.find(value => findUniqueObjectIds(item, value)) || false)) ?? []),
                        ...updatedData,
                    ]
                }
            case eUpdateInsertMethod.REPLACE: {

                return {
                    [stateKey]: [
                        ...(previousStateProperty?.map(oldObject => {

                            const index = updatedData.findIndex(item => findUniqueObjectIds(item, oldObject));

                            if (-1 === index) {

                                return oldObject

                            }

                            return updatedData.splice(index, 1).pop()

                        }) ?? []),
                        ...updatedData
                    ]
                };
            }

        }

    }, callback);

}


