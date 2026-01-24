function getProcessEnv(key: string): string | undefined {
    // works in node + most polyfills
    return typeof process !== "undefined" ? process.env?.[key] : undefined;
}

function getViteEnv(key: string): string | undefined {
    // IMPORTANT:
    // this file must be ESM-compatible in any environment where it's executed
    // because import.meta may not even parse in CJS contexts
    // @ts-ignore
    return typeof import.meta !== "undefined" ? import.meta.env?.[key] : undefined;
}

export function getEnv<T = string>(key: string, fallback?: T): T {
    // Prefer process.env in SSR/node (secrets, runtime config)
    const proc = getProcessEnv(key);
    if (proc !== undefined) return proc as T;

    // Vite client / build-time vars
    try {
        const vite = getViteEnv(key);
        if (vite !== undefined) return vite as T;
    } catch {
        // ignore
    }

    if (fallback !== undefined) return fallback;
    throw new Error(`Missing required environment variable: ${key}`);
}