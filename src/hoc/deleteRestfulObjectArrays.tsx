import CarbonReact, {iCarbonReactState} from "CarbonReact";
import {iRestfulObjectArrayTypes, tRestfulObjectValues} from "variables/C6";


//ObjectType, UniqueIdType extends keyof ObjectType
export default function deleteRestfulObjectArrays<ObjectType = tRestfulObjectValues, ObjectArrayTypes = iRestfulObjectArrayTypes>
(dataOrCallback: ((prev: Readonly<iCarbonReactState>) => ObjectType[]) | ObjectType[],
 stateKey: keyof ObjectArrayTypes,
 uniqueObjectId: keyof ObjectType,
 callback?: () => void): void {

    return CarbonReact.instance.setState((previousBootstrapState ): {} => {

        let newOrReplacementData: ObjectType[] = dataOrCallback instanceof Function ? dataOrCallback(previousBootstrapState) : dataOrCallback;

        // @ts-ignore
        const previousStateProperty = previousBootstrapState[stateKey];

        return {
            [stateKey]: null === previousBootstrapState ? null : [
                ...previousStateProperty?.filter(item => false === (newOrReplacementData?.find(value => value[uniqueObjectId] === item[uniqueObjectId]) || false)) || []
            ] as ObjectType[]
        }
    }, callback);

}

