
import {useEffectOnce} from "src/api/hoc/useEffectOnce";
import TryWebSocket from "src/components/WebSocket/TryWebSocket";


export default function DigWebSocket() {

    useEffectOnce(() => {

        TryWebSocket()

    })

    return null
}