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

export interface ImageInfo {
	id: string
    name: string
    tag: string
    size: string
    inUsed: boolean
    createTime: string
}

export interface VersionInfo {
    version: string
    buildTime: string
}

export interface RemoteVersionInfo {
    remoteVersion: string
}

export interface ProgressInfo {
    name: string
    isDone: boolean
    message: string
    percentage: number
    detailMsg: string[]
}

export interface taskIdInfo {
    taskID: string
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

    async getVersion() {
        const response = await this.axiosClient.get<{
            code: number,
            msg: string,
            data: VersionInfo
        }>('/api/version')
        return response.data.data
    }

    async checkUpdate() {
        const response = await this.axiosClient.get<{
            code: number,
            msg: string,
            data: RemoteVersionInfo
        }>('/api/check')
        return response.data.data
    }

    async updateProgram() {
        try {
            const response = await this.axiosClient.put<{
                code: number,
                msg: string,
                data: null
            }>('/api/program');
            return response.data;
        }catch (error) {
            // 在这里处理错误，返回一个自定义的错误响应
            if (axios.isAxiosError(error) && error.response) {
                // 如果错误来自 Axios，并且有响应体
                return error.response.data;
            } else {
                // 对于其他类型的错误，返回一个通用错误响应
                return {
                    code: -1,
                    msg: 'An unexpected error occurred',
                    data: null
                };
            }
        }
    }

    async getContainersList() {
        const response = await this.axiosClient.get<{
            code: number,
            msg: string,
            data: ContainerInfo[]
        }>('/api/containers')
        return response.data.data
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
                return error.response.data as {code: number, msg: string, data: taskIdInfo};
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

    async updateContainer(id: string, containerName: string, imageNameAndTag: string, delOldContainer: boolean) {
        try {
            let formData = new FormData();
            formData.append('containerName', containerName);
            formData.append('imageNameAndTag', imageNameAndTag);
            formData.append('delOldContainer', delOldContainer.toString());

            const response = await this.axiosClient.post<{
                code: number,
                msg: string,
                data: taskIdInfo
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

    async getImageList() {
        const response = await this.axiosClient.get<{
            code: number,
            msg: string,
            data: ImageInfo[]
        }>('/api/images')
        return response.data.data
    }

    async deleteImage(id: string, force: boolean) {
        try {
            const response = await this.axiosClient.delete<{
                code: number,
                msg: string,
                data: ImageInfo[]
            }>(`/api/image/${id}?force=${force}`);
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

    async queryProgress(taskID: string) {
        const response = await this.axiosClient.get<{
            code: number,
            msg: string,
            data: ProgressInfo
        }>(`/api/progress/${taskID}`)
        return response.data
    }

    async getBackupsList() {
        const response = await this.axiosClient.get<{
            code: number,
            msg: string,
            data: string[]
        }>('/api/container/listBackups')
        return response.data.data
    }

    async restoreBackup(fileName: string) {
        const response = await this.axiosClient.post<{
            code: number,
            msg: string,
            data: taskIdInfo
        }>(`/api/container/backups/${fileName}/restore`)
        return response.data
    }

    async delBackup(fileName: string) {
        const response = await this.axiosClient.delete<{
            code: number,
            msg: string,
            data: null
        }>(`/api/container/backups/${fileName}`)
        return response.data
    }

    async backupContainer() {
        const response = await this.axiosClient.get<{
            code: number,
            msg: string,
            data: null
        }>(`/api/container/backup`)
        return response.data
    }
}