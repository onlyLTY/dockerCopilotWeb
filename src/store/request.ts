import {atomWithStorage} from "jotai/utils";
import {useLocation} from "react-router-dom";
import {useAtomValue} from "jotai/react/useAtomValue";
import {atom} from "jotai/vanilla/atom";
import {useAtom} from "jotai/react/useAtom";
import {Client} from "@lib/request.ts";

export const localStorageAtom = atomWithStorage<Array<{
    hostname: string
    port: string
    secret: string
}>>('externalControllers', [])

export function useAPIInfo() {
    const location = useLocation()
    const localStorage = useAtomValue(localStorageAtom)

    let url: URL | undefined
    {
        const meta = document.querySelector<HTMLMetaElement>('meta[name="external-controller"]')
        if ((meta?.content?.match(/^https?:/)) != null) {
            // [protocol]://[secret]@[hostname]:[port]
            url = new URL(meta.content)
        }
    }

    const qs = new URLSearchParams(location.search)

    const hostname = qs.get('host') ?? localStorage?.[0]?.hostname ?? url?.hostname ?? '127.0.0.1'
    const port = qs.get('port') ?? localStorage?.[0]?.port ?? url?.port ?? '12712'
    const secret = qs.get('secret') ?? localStorage?.[0]?.secret ?? url?.username ?? ''
    const protocol = qs.get('protocol') ?? hostname === '127.0.0.1' ? 'http:' : (url?.protocol ?? window.location.protocol)

    return {hostname, port, secret, protocol}
}

const clientAtom = atom({
    key: '',
    instance: null as Client | null,
})

export function useClient() {
    const {
        hostname,
        port,
        protocol,
    } = useAPIInfo()

    const [item, setItem] = useAtom(clientAtom)
    const key = `${protocol}//${hostname}:${port}`
    if (item.key === key) {
        return item.instance!
    }

    const client = new Client(`${protocol}//${hostname}:${port}`)
    setItem({key, instance: client})

    return client
}