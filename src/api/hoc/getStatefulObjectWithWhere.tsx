import {iAPI} from "@carbonorm/carbonnode";


interface iWHERE {
    [key: string]: any|iWHERE
}

export interface iGetStatefulObjectWithWhere {
    WHERE: iWHERE | iWHERE[]
}

export default ({request}: { request: iAPI<any> & iWHERE }) => {




}