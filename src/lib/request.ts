import axios, {AxiosInstance} from 'axios'
import FormData from 'form-data';

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
        try {
            const response = await this.axiosClient.post<{
                code: number,
                msg: string,
                data: ContainerInfo[]
            }>(`/api/container/${id}/start`);
            return response.data;
        } catch (error) {
            // 在这里处理错误，返回一个自定义的错误响应
            if (axios.isAxiosError(error) && error.response) {
                // 如果错误来自 Axios，并且有响应体
                return error.response.data;
            } else {
                // 对于其他类型的错误，返回一个通用错误响应
                return {
                    code: -1,
                    msg: 'An unexpected error occurred',
                    data: []
                };
            }
        }
    }

    async stopContainer(id: string) {
        try {
            const response = await this.axiosClient.post<{
                code: number,
                msg: string,
                data: ContainerInfo[]
            }>(`/api/container/${id}/stop`);
            return response.data;
        } catch (error) {
            // 在这里处理错误，返回一个自定义的错误响应
            if (axios.isAxiosError(error) && error.response) {
                // 如果错误来自 Axios，并且有响应体
                return error.response.data;
            } else {
                // 对于其他类型的错误，返回一个通用错误响应
                return {
                    code: -1,
                    msg: 'An unexpected error occurred',
                    data: []
                };
            }
        }
    }

    async restartContainer(id: string) {
        try {
            const response = await this.axiosClient.post<{
                code: number,
                msg: string,
                data: ContainerInfo[]
            }>(`/api/container/${id}/restart`);
            return response.data;
        } catch (error) {
            // 在这里处理错误，返回一个自定义的错误响应
            if (axios.isAxiosError(error) && error.response) {
                // 如果错误来自 Axios，并且有响应体
                return error.response.data;
            } else {
                // 对于其他类型的错误，返回一个通用错误响应
                return {
                    code: -1,
                    msg: 'An unexpected error occurred',
                    data: []
                };
            }
        }
    }

    async removeContainer(id: string) {
        await this.axiosClient.delete(`/api/connections/${id}`)
    }

    async updateContainer(id: string, containerName: string, imageNameAndTag: string, delOldContainer: boolean) {
        try {
            let formData = new FormData();
            formData.append('containerName', containerName);
            formData.append('imageNameAndTag', imageNameAndTag);
            formData.append('delOldContainer', delOldContainer.toString());

            const response = await this.axiosClient.post<{
                code: number,
                msg: string,
                data: ContainerInfo[]
            }>(`/api/container/${id}/update`, formData);
            return response.data;
        } catch (error) {
            // 在这里处理错误，返回一个自定义的错误响应
            if (axios.isAxiosError(error) && error.response) {
                // 如果错误来自 Axios，并且有响应体
                return error.response.data;
            } else {
                // 对于其他类型的错误，返回一个通用错误响应
                console.log(error);
                return {
                    code: -1,
                    msg: 'An unexpected error occurred',
                    data: []
                };
            }
        }
    }

    async renameContainer(id: string, newName: string) {
        try {
            const response = await this.axiosClient.post<{
                code: number,
                msg: string,
                data: ContainerInfo[]
            }>(`/api/container/${id}/rename?newName=${newName}`);
            return response.data;
        } catch (error) {
            // 在这里处理错误，返回一个自定义的错误响应
            if (axios.isAxiosError(error) && error.response) {
                // 如果错误来自 Axios，并且有响应体
                return error.response.data;
            } else {
                // 对于其他类型的错误，返回一个通用错误响应
                return {
                    code: -1,
                    msg: 'An unexpected error occurred',
                    data: []
                };
            }
        }
    }

}