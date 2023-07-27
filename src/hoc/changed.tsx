const clone = (obj: any) => {

    try {

        return structuredClone(obj)

    } catch (e) {

        try {

            return JSON.stringify(obj) || obj

        } catch (e) {

            return obj

        }

    }

}

const changed = (name: string, context: "state" | "props", old, v) => {

    let groupStarted = false
    const keys = Object.keys(old);

    for (let i = 0; i < keys.length; i++) {

        if (v[keys[i]] !== old[keys[i]]) {

            if (groupStarted === false) {

                groupStarted = true;

                console.group('%c %s; %s', context === 'state' ? 'color: #c00' : 'color: #0c0', name, context)

            }

            console.log('%c [%s] => has changed from %o to %o', 'color: #c00',
                keys[i],
                clone(old[keys[i]]),
                clone(v[keys[i]])
            )
        }

    }

    if (true === groupStarted) {

        console.groupEnd()

    }

}


export default changed