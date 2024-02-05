import classnames from 'classnames'
import logo from '@assets/DockerCopilotlogo.png'
import {NavLink, useLocation} from 'react-router-dom'
import './style.scss'
import {useEffect, useRef, useState} from "react";
import {Button, ConfigProvider} from "antd";
import useCustomNotification from "@components/Message";
import {VersionInfo} from "@lib/request/type.ts";
import {useApi} from "@lib/request/apiReq.ts";

interface SidebarProps {
    routes: Array<{
        path: string
        name: string
        noMobile?: boolean
    }>
}

export default function Sidebar (props: SidebarProps) {
    const { routes } = props
    const location = useLocation()
    const [showButton, setShowButton] = useState(false)
    const {contextHolder, openNotificationWithButton} = useCustomNotification();
    const {getVersionInfo, getRemoteVersionInfo, updateProgram} = useApi()

    const navlinks = routes.map(
        ({ path, name, noMobile }) => (
            <li className={classnames('item', { 'no-mobile': noMobile })} key={name}>
                <NavLink to={{ pathname: path, search: location.search }} className={({ isActive }) => classnames({ active: isActive })}>
                    { name }
                </NavLink>
            </li>
        ),
    )

    const [data, setData] = useState<VersionInfo>({buildTime: "", version: '0.0.0'});
    const dataRef = useRef(data); // 创建一个引用来存储当前的数据

    useEffect(() => {
    const fetchVersionData = async () => {
        try {
            const resp = await getVersionInfo();
            const versionInfo = resp.data
            if (JSON.stringify(versionInfo) !== JSON.stringify(dataRef.current)) {
                // 获取到版本信息后，更新 data 的状态
                setData(versionInfo);
                dataRef.current = versionInfo;
            }
        } catch (error) {
            console.error('Error while getting version data:', error);
        }
    };

    const checkUpdate = async () => {
        try {
            const remoteVersionResp = await getRemoteVersionInfo();
            const remoteVersion = remoteVersionResp.data

            if (remoteVersion.remoteVersion !== dataRef.current.version) {
                setShowButton(true);
            }
        } catch (error) {
            console.error('Error while checking update:', error);
        }
    };

    fetchVersionData().catch(error => {
        console.error('Error while fetching version data:', error);
    });

    checkUpdate().catch(error => {
        console.error('Error while checking update:', error);
    });
    }, [getRemoteVersionInfo, getVersionInfo]);

    const [isUpdateProgram, setIsUpdateProgram] = useState(false);

    async function updateButtonClick() {
        setIsUpdateProgram(true)
        const updateResult = await updateProgram() as unknown as {
            code: number,
            msg: string,
            data: null
        };
        if (200 === updateResult.code) {
            openNotificationWithButton(
                'success',
                '更新成功',
                <div dangerouslySetInnerHTML={{__html: '<div>容器将在10s后尝试重启，如果失败，请手动重启</div>'}}/>, // 使用 dangerouslySetInnerHTML 渲染 HTML 字符串
                '确认',
                () => console.log('容器更新成功通知已关闭')
            );
            setIsUpdateProgram(false)
        } else {
            openNotificationWithButton(
                'error',
                '更新失败',
                <div dangerouslySetInnerHTML={{__html: `<div>${updateResult.msg}</div>`}}/>, // 使用 dangerouslySetInnerHTML 渲染 HTML 字符串
                '确认',
                () => console.log('容器更新失败通知已关闭')
            );
            setIsUpdateProgram(false)
        }
    }

    return (
        <div className="sidebar">
            {contextHolder}
            <img src={logo} alt="logo" className="sidebar-logo" />
            <ul className="sidebar-menu">
                { navlinks }
            </ul>
            <div className="sidebar-version">
                <span className="sidebar-version-label">Docker Copilot</span>
                <span className="sidebar-version-text">{data?.version}</span>
                <ConfigProvider
                    theme={{
                        components: {
                            Button: {
                                defaultBg: '#304759', // 按钮背景颜色
                                defaultColor: '#b7c5d6', // 按钮文字颜色
                                algorithm: true, // 启用算法
                            }
                        },
                    }}
                >
                    {showButton && (
                        <Button
                            loading={isUpdateProgram}
                            className="button-green-hover button-green-active"
                            onClick={updateButtonClick}>更新程序
                        </Button>
                    )}
                </ConfigProvider>
            </div>
        </div>
    )
}
