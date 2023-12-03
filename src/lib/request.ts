import axios, {AxiosInstance} from 'axios'

export interface ContainerInfo {
    id: string
    status: string
    name: string
    usingImage: string
    createTime: string
    runningTime: string
    haveUpdate: boolean
}

export class Client {
    private readonly axiosClient: AxiosInstance

    constructor(url: string) {
        const jwt = localStorage.getItem('jwt');
        this.axiosClient = axios.create({
            baseURL: url,
            headers: {
                ...(jwt ? {'Authorization': `Bearer ${jwt}`} : {}),
            },
        })
    }

    async getContainersList() {
        const response = await this.axiosClient.get<{
            code: number,
            msg: string,
            data: ContainerInfo[]
        }>('/api/containers')
        return response.data.data
    }

    async getContainerInfo(id: string) {
        const {data} = await this.axiosClient.get<ContainerInfo>(`/api/connections/${id}`)
        return data
    }

    async startContainer(id: string) {
        await this.axiosClient.post(`/api/connections/${id}/start`)
    }

    async stopContainer(id: string) {
        await this.axiosClient.post(`/api/connections/${id}/stop`)
    }

    async removeContainer(id: string) {
        await this.axiosClient.delete(`/api/connections/${id}`)
    }

    async updateContainer(id: string) {
        await this.axiosClient.post(`/api/connections/${id}/update`)
    }

}