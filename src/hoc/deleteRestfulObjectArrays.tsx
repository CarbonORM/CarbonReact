import CarbonReact, {iCarbonORMState, iRestfulObjectArrayTypes, tRestfulObjectValues} from "CarbonReact";


//ObjectType, UniqueIdType extends keyof ObjectType
export default function deleteRestfulObjectArrays<ObjectType extends tRestfulObjectValues>
(dataOrCallback: ((prev: Readonly<iCarbonORMState>) => ObjectType[]) | ObjectType[],
 stateKey: keyof iRestfulObjectArrayTypes,
 uniqueObjectId: keyof ObjectType,
 callback?: () => void): void {

    return CarbonReact.instance.setState((previousBootstrapState): {} => {

        let newOrReplacementData: ObjectType[] = dataOrCallback instanceof Function ? dataOrCallback(previousBootstrapState) : dataOrCallback;

        const previousStateProperty = previousBootstrapState[stateKey] as ObjectType[];

        return {
            [stateKey]: null === previousBootstrapState ? null : [
                ...previousStateProperty?.filter(item => false === (newOrReplacementData?.find(value => value[uniqueObjectId] === item[uniqueObjectId]) || false)) || []
            ] as ObjectType[]
        }
    }, callback);

}

