import DigApi, {
    iCarbonORMState,
    iRestfulObjectArrayTypes,
    tRestfulObjectValues
} from "DigApi";


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
export default function updateRestfulObjectArray<ObjectType extends tRestfulObjectValues>
(dataOrCallback: ((prev: Readonly<iCarbonORMState>) => ObjectType[]) | ObjectType[],
 uniqueObjectId: keyof ObjectType,
 stateKey: keyof iRestfulObjectArrayTypes,
 insertUpdateOrder: eUpdateInsertMethod = eUpdateInsertMethod.LAST,
 callback?: () => void): void {

    const bootstrap: DigApi = CarbonORM.instance;

    return bootstrap.setState((previousBootstrapState): {} => {

        let newOrReplacementData: ObjectType[] = dataOrCallback instanceof Function ? dataOrCallback(previousBootstrapState) : dataOrCallback;

        const previousStateProperty = previousBootstrapState[stateKey] as ObjectType[];

        let updatedData = newOrReplacementData.map(value => {
            return {
                ...previousStateProperty?.find(previousValue => previousValue[uniqueObjectId] === value[uniqueObjectId]) || {},
                ...value
            }
        })

        switch (insertUpdateOrder) {
            default:
                throw Error('The insertUpdateOrder (eUpdateInsertMethod) was not implemented')
            case eUpdateInsertMethod.LAST:
                return {
                    [stateKey]: null === newOrReplacementData ? null : [
                        ...updatedData,
                        ...(previousStateProperty?.filter(item => false === (newOrReplacementData?.find(value => value[uniqueObjectId] === item[uniqueObjectId]) || false)) ?? [])
                    ]
                }

            case eUpdateInsertMethod.FIRST:
                return {
                    [stateKey]: null === newOrReplacementData ? null : [
                        ...(previousStateProperty?.filter(item => false === (newOrReplacementData?.find(value => value[uniqueObjectId] === item[uniqueObjectId]) || false)) ?? []),
                        ...updatedData,
                    ]
                }
            case eUpdateInsertMethod.REPLACE: {

                return {
                    [stateKey]: [
                        ...(previousStateProperty?.map(oldObject => {

                            const index = updatedData.findIndex(item => item[uniqueObjectId] === oldObject[uniqueObjectId]);

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


