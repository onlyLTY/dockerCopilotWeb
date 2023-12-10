import {Button, notification, Space} from 'antd';
import {v4 as uuidv4} from 'uuid';

export type NotificationType = 'success' | 'info' | 'warning' | 'error';

const useCustomNotification = () => {
    const [api, contextHolder] = notification.useNotification();

    const openNotificationWithButton = (
        type: NotificationType,
        message: string,
        description: JSX.Element,
        buttonText: string,
        onClose: () => void
    ) => {
        const key = uuidv4();
        const btn = (
            <Space>
                <Button type="link" size="small" onClick={() => api.destroy(key)}>
                    {buttonText}
                </Button>
            </Space>
        );

        api.open({
            message,
            description,
            btn,
            key,
            onClose,
            type,
        });
    };

    return {api, contextHolder, openNotificationWithButton};
};

export default useCustomNotification;