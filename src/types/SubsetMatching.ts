// Utility type to extract keys and corresponding values
import {KeysMatching} from "./KeysMatching";

export type SubsetMatching<T extends object, V> = {
    [K in KeysMatching<T, V>]: T[K]
};
