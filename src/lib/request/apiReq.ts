import {useApiClient} from './apiClient';
import axios from "axios";

export const useApi = () => {
    const apiClient = useApiClient();

    const login = async (secretKey: string) => {
        // 登录不是这里，用这个登录的话会有奇怪的问题，需要点击两次才能成功登录
        // 第一次是按照老的client发送请求，第二次是按照新的client发送请求
        // 非常奇怪，暂时不知道原因
        // 创建FormData实例
        const formData = new FormData();
        formData.append('secretKey', secretKey);

        // 发送POST请求
        try {
            const response = await apiClient.post('/api/auth', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const getVersion = async () => {
        try {
            const response = await apiClient.get('/api/version');
            return response.data;
        } catch (error) {
            console.error('Get version error:', error);
            throw error;
        }
    }

    const getContainersList = async () => {
        try {
            const response = await apiClient.get('/api/containers');
            return response.data;
        } catch (error) {
            console.error('Get containers list error:', error);
            throw new Error('Get containers list error');
        }
    }

    const startContainer = async (id: string) => {
        try {
            const response = await apiClient.post(`/api/container/${id}/start`, {
                id
            });
            return response.data;
        } catch (error) {
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

    return {
        login,
        getVersion,
        getContainersList,
        startContainer,
        // ...可以添加更多的API方法
    };
};