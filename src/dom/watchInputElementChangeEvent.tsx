import {ChangeEvent} from "react";
import {timeout} from "@carbonorm/carbonnode";

export default function watchInputElementChangeEvent(event: ChangeEvent<HTMLInputElement|HTMLTextAreaElement>, cb: (event: ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => (Promise<boolean> | boolean), timeoutMs: number = 3000) {

    const target = event.target;

    const value = target.value;

    event.target.style.color = "orange";

    timeout(() => value === ((() => target.value)()),
        async () => {

            const callbackResult = await cb(event);

            console.log('User provided input callbackResult passed to WatchInputElementChangeEvent (will cause green or red) value (' + value + ')', callbackResult)

            target.style.color = false === callbackResult ? "red" : "green"

        },
        timeoutMs)

}
