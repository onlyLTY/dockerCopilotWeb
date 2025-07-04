import {useAtom} from "jotai";
import {Input, message, Modal, Select} from "antd";
import React, {useEffect, useState} from "react";
import './style.scss'
import {configAtom} from "@lib/request/configAtom";
import {modalOpenAtom} from "@layouts/ExternalControllerDrawer/constants";
import axios from "axios";
import {EyeInvisibleOutlined, EyeOutlined} from "@ant-design/icons"; // 调整路径以匹配你的文件结构

export default function ExternalControllerDrawer() {
    const [, setConfig] = useAtom(configAtom)
    const [isModalOpen, setIsModalOpen] = useAtom(modalOpenAtom);
    const [hostname, setHostname] = useState(window.location.hostname);
    const [port, setPort] = useState(window.location.port);
    const [secretKey, setSecretKey] = useState("");
    const [isVisible, setIsVisible] = useState(false);
    const [protocol, setProtocol] = useState(window.location.protocol.replace(':', '://'));

    useEffect(() => {
        const storedConfig = localStorage.getItem('externalControllers');
        if (storedConfig) {
            const parsedConfig = JSON.parse(storedConfig);
            if (parsedConfig.hostname === "" || parsedConfig.secretKey === "") {
                setIsModalOpen(true);
            }
        } else {
            setIsModalOpen(true);
        }
    },);

    const handleHostnameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setHostname(event.target.value);
    };

    const handlePortChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPort(event.target.value);
    };

    const handleSecretKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSecretKey(event.target.value);
    };

    const handleSelectChange = (value: string) => {
        setProtocol(value);
    };

    const {Option} = Select;

    const selectBefore = (
        <Select defaultValue="http://" onChange={handleSelectChange}>
            <Option value="http://">http://</Option>
            <Option value="https://">https://</Option>
        </Select>
    );

    const handleOk = async () => {
        try {
            const formData = new FormData();
            formData.append('secretKey', secretKey);
            const resp = await axios.post(protocol + hostname + ':' + port + '/api/auth', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            const jwt = resp.data.data.jwt;
            setConfig({
                hostname: protocol + hostname,
                port: port,
                secretKey: secretKey,
                jwt: jwt,
            });
            setIsModalOpen(false); // 关闭模态窗口
        } catch (error) {
            console.error('Error during login:', error);
            setIsModalOpen(true);
            message.error('登录失败。请检查'); // 弹出通知
        }
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    return (
        <div>
            <Modal
                title="登录"
                className={"config-modal"}
                open={isModalOpen}
                onOk={handleOk}
                onCancel={handleCancel}
            >
                <p>网址</p>
                <Input addonBefore={selectBefore} id="hostname" value={hostname} onChange={handleHostnameChange}/>
                <p>端口</p>
                <Input id="port" value={port} onChange={handlePortChange}/>
                <p>密钥</p>
                <div
                    onMouseEnter={() => setIsVisible(true)}
                    onMouseLeave={() => setIsVisible(false)}
                >
                    <Input
                        id="secretKey"
                        type={isVisible ? "text" : "password"}
                        value={secretKey}
                        onChange={handleSecretKeyChange}
                        autoComplete="current-password"  // 支持浏览器密码填充
                        suffix={
                        <span onClick={() => setIsVisible(!isVisible)}>
                            {isVisible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                        </span>
                    }
                    />
                </div>
            </Modal>
        </div>
    )
}
