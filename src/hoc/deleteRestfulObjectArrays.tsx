import CarbonReact from "CarbonReact";
import {tRestfulObjectArrayValues, tStatefulApiData} from "variables/C6";
import {KeysMatching} from "./KeysMatching";


//ObjectType, UniqueIdType extends keyof ObjectType
// @link https://www.typescriptlang.org/docs/handbook/2/mapped-types.html
export default function deleteRestfulObjectArrays<ObjectType = tRestfulObjectArrayValues, S = typeof CarbonReact.instance.state, P = typeof CarbonReact.instance.props>
(dataOrCallback: ObjectType[] | (<K extends keyof S>(
     state: ((prevState: Readonly<S>, props: Readonly<P>) => (Pick<S, K> | S | null)) | (Pick<S, K> | S | null),
     callback?: () => void
 ) => null|(ObjectType[])),
 stateKey: KeysMatching<S, tStatefulApiData<ObjectType>>,
 uniqueObjectId: (keyof ObjectType) | (keyof ObjectType)[],
 callback?: () => void): void {

    const uniqueObjectIds = uniqueObjectId instanceof Array ? uniqueObjectId : [uniqueObjectId];

    return CarbonReact.instance.setState((previousBootstrapState, props) => {

        let newOrReplacementData: ObjectType[]  = [];

        if (dataOrCallback instanceof Array) {

            newOrReplacementData = dataOrCallback

        } else if (dataOrCallback instanceof Function) {

            let callbackReturn = dataOrCallback(previousBootstrapState, props);

            if (null === callbackReturn) {

                return ;

            }

            newOrReplacementData = callbackReturn;

        } else {

            throw Error('The dataOrCallback parameter was not an array or function')

        }

        const previousStateProperty : ObjectType[] = previousBootstrapState[stateKey];

        return {
            [stateKey]: [

                ...previousStateProperty?.filter(item => false === (newOrReplacementData?.find(value => {

                    let isMatch = true;

                    uniqueObjectIds.find(uniqueObjectId => {

                        if (value[uniqueObjectId] !== item[uniqueObjectId]) {

                            isMatch = false;

                            return true;

                        }

                        return false;

                    })

                    return isMatch;

                }) || false)) || []

            ]
        }
    }, callback);

}

