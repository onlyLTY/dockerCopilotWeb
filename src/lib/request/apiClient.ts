import axios from 'axios';
import {useAtom} from 'jotai';
import {configAtom} from './configAtom';

export const useApiClient = () => {
    const [config] = useAtom(configAtom);

    return axios.create({
        baseURL: `${config.hostname}:${config.port}`,
        headers: {
            'Authorization': `Bearer ${config.jwt}`
        }
    });
};