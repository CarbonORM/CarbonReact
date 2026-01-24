import {getEnv} from "./getEnv";

// @ts-ignore
const isProduction = () => getEnv("NODE_ENV", "") === "production"

export default isProduction