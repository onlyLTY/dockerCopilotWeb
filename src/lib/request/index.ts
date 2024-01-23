import {useApiClient} from './ApiClient';

export const useApi = () => {
    const apiClient = useApiClient();

    const login = async (secretKey: string) => {
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
            throw error;
        }
    }

    return {
        login,
        getVersion,
        getContainersList,
        // ...可以添加更多的API方法
    };
};