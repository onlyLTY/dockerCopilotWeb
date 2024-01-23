import {atomWithStorage} from 'jotai/utils';

export const configAtom = atomWithStorage('externalControllers', {
    hostname: '',
    port: '',
    secretKey: '',
    jwt: '',
});
