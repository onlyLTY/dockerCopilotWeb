import {Card, Drawer, Icon, NotificationType} from "@components";
import {ReactNode, useEffect, useRef, useState} from "react";
import {ColumnDef, ColumnResizeMode, flexRender, getCoreRowModel, Row, useReactTable,} from "@tanstack/react-table";
import {Client, ContainerInfo} from '@lib/request';
import {Badge, Button, Checkbox, ConfigProvider, Input, Space} from "antd";
import {Header} from "@components/Header";
import update from '@assets/update.png';
import check from '@assets/check.svg';
import {useObject} from "@lib/hook.ts";
import './style.scss'
import useCustomNotification from "@components/Message";
import classnames from "classnames";
import {BaseComponentProps} from "@models/BaseProps.ts";

const defaultColumns: ColumnDef<ContainerInfo>[] = [
    {
        header: '容器名称',
        footer: props => props.column.id,
        accessorKey: 'name',
        cell: info => {
            const status = info.row.original.status; // 获取status的值
            let statusColor: string;
            switch (status) {
                case 'running':
                    statusColor = 'green';
                    break;
                case 'exited':
                    statusColor = 'red';
                    break;
                case 'dead':
                    statusColor = 'red';
                    break;
                case 'removing':
                    statusColor = 'red';
                    break;
                case 'restarting':
                    statusColor = 'yellow';
                    break;
                case 'paused':
                    statusColor = 'yellow';
                    break;
                case 'created':
                    statusColor = 'blue';
                    break;
                default:
                    statusColor = 'purple';
                    break;
            }
            return (
                <Badge
                    color={statusColor}
                    text={<span className="primary-darken-color">{info.getValue() as ReactNode}</span>}
                    title={status}
                />
            );
        },
        size: 150,
        minSize: 100,
    },
    {
        header: '版本',
        footer: props => props.column.id,
        accessorKey: 'version',
        cell: info => {
            const haveUpdate = info.row.original.haveUpdate;
            if (haveUpdate) {
                return (
                    <div style={{display: 'flex', alignItems: 'center'}}>
                        <img src={update} alt={"有更新"} style={{width: 15}}/>
                        <span style={{marginLeft: 5}}>有更新</span>
                    </div>
                );
            } else {
                return (
                    <div style={{display: 'flex', alignItems: 'center'}}>
                        <img src={check} alt={"已是最新"} style={{width: 15}}/>
                        <span style={{marginLeft: 5}}>已是最新</span>
                    </div>
                );
            }
        },
        size: 100,
    },
    {
        header: '使用的镜像',
        footer: props => props.column.id,
        accessorKey: 'usingImage',
        cell: info => (
            <div>{info.getValue() as ReactNode}</div>
        ),
        size: 350,
        minSize: 100,
    },
    {
        header: '创建时间',
        footer: props => props.column.id,
        accessorKey: 'createTime',
        cell: info => info.getValue(),
        size: 200,
    },
    {
        header: '运行时长',
        footer: props => props.column.id,
        accessorKey: 'runningTime',
        cell: info => info.getValue(),
        size: 200,
    },
]

export default function Containers () {
    const cardRef = useRef<HTMLDivElement>(null)
    // Static data for the table
    const [data, setData] = useState<ContainerInfo[]>([]);
    const dataRef = useRef(data); // 创建一个引用来存储当前的数据
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

    useEffect(() => {
        const client = new Client('http://localhost:12712');

        const fetchData = async () => {
            try {
                const newData = await client.getContainersList();
                if (JSON.stringify(newData) !== JSON.stringify(dataRef.current)) {
                    setData(newData);
                    dataRef.current = newData;

                    // 更新 selectedRows，仅保留存在于新数据中的 ID
                    const updatedSelectedRows = new Set(
                        Array.from(selectedRows).filter(id => newData.some(row => row.id === id))
                    );
                    setSelectedRows(updatedSelectedRows);
                }
            } catch (error) {
                console.error('Error while getting containers list:', error);
            }
        };


        fetchData().catch(error => {
            console.error('Error while fetching data:', error);
        });

        const intervalId = setInterval(() => {
            fetchData().catch(error => {
                console.error('Error while fetching data:', error);
            });
        }, 5000);

        return () => clearInterval(intervalId);
    }, []);

    const handleRowSelect = (rowId: string) => {
        setSelectedRows((prev) => {
            const newSelectedRows = new Set(prev);
            if (newSelectedRows.has(rowId)) {
                newSelectedRows.delete(rowId);
            } else {
                newSelectedRows.add(rowId);
            }
            return newSelectedRows;
        });
    };

    // Define columns for the table
    const [columns] = useState<typeof defaultColumns>(() => [
        ...defaultColumns,
    ])
    const [columnResizeMode] =
        useState<ColumnResizeMode>('onChange')

    const areAllRowsSelected = () => {
        return data.every(row => selectedRows.has(row.id));
    };

    const handleSelectAll = () => {
        if (areAllRowsSelected()) {
            // 如果所有的行都被选中，那么取消选择所有的行
            setSelectedRows(new Set());
        } else {
            // 否则，选择所有的行
            setSelectedRows(new Set(data.map(row => row.id)));
        }
    };

    const columnsWithCheckbox = [
            // 复选框列
            {
                id: 'selection',
                header: () => (
                    <div className="checkbox-center">
                        <Checkbox onChange={handleSelectAll} checked={areAllRowsSelected()}/>
                    </div>
                ),
                cell: ({row}: { row: Row<ContainerInfo> }) => (
                    <div className="checkbox-center">
                        <Checkbox
                            checked={selectedRows.has(row.original.id)}
                            onChange={(e) => {
                                e.stopPropagation(); // 阻止事件冒泡
                                handleRowSelect(row.original.id);
                            }}
                        />
                    </div>
                ),
                size: 40,
                minSize: 40,
                maxSize: 40,
            },
            // 其余列
            ...
                columns,
        ]
    ;

    // Create a table instance
    const table = useReactTable({
        data,
        columns: columnsWithCheckbox,
        columnResizeMode,
        getCoreRowModel: getCoreRowModel(),
        debugTable: true,
        debugHeaders: true,
        debugColumns: true,
    })

    const [isStarting, setIsStarting] = useState(false);
    const [isStopping, setIsStopping] = useState(false);
    const [isRestarting, setIsRestarting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const {contextHolder, openNotificationWithButton} = useCustomNotification();

    const startButtonClick = () => {
        setIsStarting(true);
        const promises: any[] = [];
        if (selectedRows.size === 0) {
            openNotificationWithButton(
                'warning',
                '未选择容器',
                <div dangerouslySetInnerHTML={{__html: '请选择要启动的容器'}}/>, // 使用 dangerouslySetInnerHTML 渲染 HTML 字符串
                '确认',
                () => console.log('未选择容器通知已关闭')
            );
            setIsStarting(false)
            return;
        }
        selectedRows.forEach(id => {
            let client = new Client('http://localhost:12712');
            const promise = client.startContainer(id).then(r => ({
                id,
                result: r
            }));
            promises.push(promise);
        });

        Promise.all(promises).then(results => {
            let success = results.filter(r => 200 === r.result.code);
            let failed = results.filter(r => 200 !== r.result.code);
            if (success.length > 0) {
                let successDesc = success.map(r => {
                    let containerName = data.find(row => row.id === r.id)?.name;
                    return `${containerName} 启动成功`; // 构造字符串
                }).join('<br>'); // 使用 HTML 的 <br> 标签进行换行
                openNotificationWithButton(
                    'success',
                    '启动成功',
                    <div dangerouslySetInnerHTML={{__html: successDesc}}/>, // 使用 dangerouslySetInnerHTML 渲染 HTML 字符串
                    '确认',
                    () => console.log('容器启动成功通知已关闭')
                );

            }
            if (failed.length > 0) {
                let failedDesc = failed.map(r => {
                    let containerName = data.find(row => row.id === r.id)?.name;
                    return `${containerName} 启动失败${r.result.msg}`; // 构造字符串
                }).join('<br>'); // 使用 HTML 的 <br> 标签进行换行
                openNotificationWithButton(
                    'error',
                    '启动失败',
                    <div dangerouslySetInnerHTML={{__html: failedDesc}}/>, // 使用 dangerouslySetInnerHTML 渲染 HTML 字符串
                    '确认',
                    () => console.log('容器启动失败通知已关闭')
                );
            }
            setIsStarting(false);
        });
    };

    const stopButtonClick = () => {
        setIsStopping(true);
        const promises: any[] = [];
        if (selectedRows.size === 0) {
            openNotificationWithButton(
                'warning',
                '未选择容器',
                <div dangerouslySetInnerHTML={{__html: '请选择要停止的容器'}}/>, // 使用 dangerouslySetInnerHTML 渲染 HTML 字符串
                '确认',
                () => console.log('未选择容器通知已关闭')
            );
            setIsStopping(false)
            return;
        }
        selectedRows.forEach(id => {
            let client = new Client('http://localhost:12712');
            const promise = client.stopContainer(id).then(r => ({
                id,
                result: r
            }));
            promises.push(promise);
        });

        Promise.all(promises).then(results => {
            let success = results.filter(r => 200 === r.result.code);
            let failed = results.filter(r => 200 !== r.result.code);
            if (success.length > 0) {
                let successDesc = success.map(r => {
                    let containerName = data.find(row => row.id === r.id)?.name;
                    return `${containerName} 停止成功`; // 构造字符串
                }).join('<br>'); // 使用 HTML 的 <br> 标签进行换行
                openNotificationWithButton(
                    'success',
                    '停止成功',
                    <div dangerouslySetInnerHTML={{__html: successDesc}}/>, // 使用 dangerouslySetInnerHTML 渲染 HTML 字符串
                    '确认',
                    () => console.log('容器停止成功通知已关闭')
                );

            }
            if (failed.length > 0) {
                let failedDesc = failed.map(r => {
                    let containerName = data.find(row => row.id === r.id)?.name;
                    return `${containerName} 停止失败${r.result.msg}`; // 构造字符串
                }).join('<br>'); // 使用 HTML 的 <br> 标签进行换行
                openNotificationWithButton(
                    'error',
                    '停止失败',
                    <div dangerouslySetInnerHTML={{__html: failedDesc}}/>, // 使用 dangerouslySetInnerHTML 渲染 HTML 字符串
                    '确认',
                    () => console.log('容器停止失败通知已关闭')
                );
            }
            setIsStopping(false);
        });
    };

    const restartButtonClick = () => {
        setIsRestarting(true);
        const promises: any[] = [];
        if (selectedRows.size === 0) {
            openNotificationWithButton(
                'warning',
                '未选择容器',
                <div dangerouslySetInnerHTML={{__html: '请选择要重启的容器'}}/>, // 使用 dangerouslySetInnerHTML 渲染 HTML 字符串
                '确认',
                () => console.log('未选择容器通知已关闭')
            );
            setIsRestarting(false)
            return;
        }
        selectedRows.forEach(id => {
            let client = new Client('http://localhost:12712');
            const promise = client.restartContainer(id).then(r => ({
                id,
                result: r
            }));
            promises.push(promise);
        });

        Promise.all(promises).then(results => {
            let success = results.filter(r => 200 === r.result.code);
            let failed = results.filter(r => 200 !== r.result.code);
            if (success.length > 0) {
                let successDesc = success.map(r => {
                    let containerName = data.find(row => row.id === r.id)?.name;
                    return `${containerName} 重启成功`; // 构造字符串
                }).join('<br>'); // 使用 HTML 的 <br> 标签进行换行
                openNotificationWithButton(
                    'success',
                    '重启成功',
                    <div dangerouslySetInnerHTML={{__html: successDesc}}/>, // 使用 dangerouslySetInnerHTML 渲染 HTML 字符串
                    '确认',
                    () => console.log('容器重启成功通知已关闭')
                );

            }
            if (failed.length > 0) {
                let failedDesc = failed.map(r => {
                    let containerName = data.find(row => row.id === r.id)?.name;
                    return `${containerName} 重启失败${r.result.msg}`; // 构造字符串
                }).join('<br>'); // 使用 HTML 的 <br> 标签进行换行
                openNotificationWithButton(
                    'error',
                    '重启失败',
                    <div dangerouslySetInnerHTML={{__html: failedDesc}}/>, // 使用 dangerouslySetInnerHTML 渲染 HTML 字符串
                    '确认',
                    () => console.log('容器重启失败通知已关闭')
                );
            }
            setIsRestarting(false);
        });
    };

    const updateButtonClick = () => {
        setIsUpdating(true);
        const promises: any[] = [];
        if (selectedRows.size === 0) {
            openNotificationWithButton(
                'warning',
                '未选择容器',
                <div dangerouslySetInnerHTML={{__html: '请选择要更新的容器'}}/>, // 使用 dangerouslySetInnerHTML 渲染 HTML 字符串
                '确认',
                () => console.log('未选择容器通知已关闭')
            );
            setIsUpdating(false)
            return;
        }
        selectedRows.forEach(id => {
            let client = new Client('http://localhost:12712');
            const containerName = data.find(row => row.id === id)?.name;
            const imageNameAndTag = data.find(row => row.id === id)?.usingImage;
            const regex = /^[\w\-.]+:[\w\-.]+$/;
            if (!imageNameAndTag || !regex.test(imageNameAndTag)) {
                openNotificationWithButton(
                    'error',
                    '更新失败',
                    <div dangerouslySetInnerHTML={{__html: "<span>镜像名称异常</span>"}}/>, // 使用 dangerouslySetInnerHTML 渲染 HTML 字符串
                    '确认',
                    () => console.log('容器更新失败通知已关闭')
                );
                return;
            } else if (!containerName) {
                openNotificationWithButton(
                    'error',
                    '更新失败',
                    <div dangerouslySetInnerHTML={{__html: "<span>容器名称异常</span>"}}/>, // 使用 dangerouslySetInnerHTML 渲染 HTML 字符串
                    '确认',
                    () => console.log('容器更新失败通知已关闭')
                );
                return;
            } else {
                const promise = client.updateContainer(id, containerName, imageNameAndTag, true).then(r => {
                    // 将新的task id添加到localStorage中的数组
                    if (r.code === 200) {
                        console.log(r.data.taskID);
                        let taskIds = JSON.parse(localStorage.getItem('taskIDs') || '[]');
                        taskIds.push(r.data.taskID);
                        localStorage.setItem('taskIDs', JSON.stringify(taskIds));
                    }
                    return {
                        id,
                        result: r
                    };
                });
                promises.push(promise);
            }
        });

        Promise.all(promises).then(results => {
            let success = results.filter(r => 200 === r.result.code);
            let failed = results.filter(r => 200 !== r.result.code);
            if (success.length > 0) {
                let successDesc = success.map(r => {
                    let containerName = data.find(row => row.id === r.id)?.name;
                    return `${containerName} 更新任务创建成功`; // 构造字符串
                }).join('<br>'); // 使用 HTML 的 <br> 标签进行换行
                openNotificationWithButton(
                    'success',
                    '更新成功',
                    <div dangerouslySetInnerHTML={{__html: successDesc}}/>, // 使用 dangerouslySetInnerHTML 渲染 HTML 字符串
                    '确认',
                    () => console.log('容器更新任务成功通知已关闭')
                );
            }
            if (failed.length > 0) {
                let failedDesc = failed.map(r => {
                    let containerName = data.find(row => row.id === r.id)?.name;
                    return `${containerName} 更新失败${r.result.msg}`; // 构造字符串
                }).join('<br>'); // 使用 HTML 的 <br> 标签进行换行
                openNotificationWithButton(
                    'error',
                    '更新任务创建失败',
                    <div dangerouslySetInnerHTML={{__html: failedDesc}}/>, // 使用 dangerouslySetInnerHTML 渲染 HTML 字符串
                    '确认',
                    () => console.log('容器更新任务创建失败通知已关闭')
                );
            }
            setIsUpdating(false);
        });
    };

    const [isStartingSingle, setIsStartingSingle] = useState(false);
    const [isStoppingSingle, setIsStoppingSingle] = useState(false);
    const [isRestartingSingle, setIsRestartingSingle] = useState(false);

    const startSingleButtonClick = (id: string) => {
        setIsStartingSingle(true)
        let client = new Client('http://localhost:12712');

        client.startContainer(id).then(r => {
            let resultDesc;
            let notificationType: NotificationType;
            setIsStartingSingle(false)
            setDrawerState('visible', false)
            if (r.code === 200) {
                const containerName = data.find(row => row.id === id)?.name;
                resultDesc = `${containerName} 启动成功`;
                notificationType = 'success';
            } else {
                const containerName = data.find(row => row.id === id)?.name;
                resultDesc = `${containerName} 启动失败${r.msg}`;
                notificationType = 'error';
            }

            openNotificationWithButton(
                notificationType,
                notificationType === 'success' ? '启动成功' : '启动失败',
                <div dangerouslySetInnerHTML={{__html: resultDesc}}/>,
                '确认',
                () => console.log(`容器${notificationType === 'success' ? '启动成功' : '启动失败'}通知已关闭`)
            );
        });
    };

    const stopSingleButtonClick = (id: string) => {
        setIsStoppingSingle(true)
        let client = new Client('http://localhost:12712');

        client.stopContainer(id).then(r => {
            let resultDesc;
            let notificationType: NotificationType;
            if (r.code === 200) {
                const containerName = data.find(row => row.id === id)?.name;
                resultDesc = `${containerName} 停止成功`;
                notificationType = 'success';
            } else {
                const containerName = data.find(row => row.id === id)?.name;
                resultDesc = `${containerName} 停止失败${r.msg}`;
                notificationType = 'error';
            }
            setIsStoppingSingle(false)
            setDrawerState('visible', false)
            openNotificationWithButton(
                notificationType,
                notificationType === 'success' ? '停止成功' : '停止失败',
                <div dangerouslySetInnerHTML={{__html: resultDesc}}/>,
                '确认',
                () => console.log(`容器${notificationType === 'success' ? '停止成功' : '停止失败'}通知已关闭`)
            );
        });
    };

    const restartSingleButtonClick = (id: string) => {
        setIsRestartingSingle(true)
        let client = new Client('http://localhost:12712');

        client.restartContainer(id).then(r => {
            let resultDesc;
            let notificationType: NotificationType;
            if (r.code === 200) {
                const containerName = data.find(row => row.id === id)?.name;
                resultDesc = `${containerName} 重启成功`;
                notificationType = 'success';
            } else {
                const containerName = data.find(row => row.id === id)?.name;
                resultDesc = `${containerName} 重启失败${r.msg}`;
                notificationType = 'error';
            }
            setIsRestartingSingle(false)
            setDrawerState('visible', false)
            openNotificationWithButton(
                notificationType,
                notificationType === 'success' ? '重启成功' : '重启失败',
                <div dangerouslySetInnerHTML={{__html: resultDesc}}/>,
                '确认',
                () => console.log(`容器${notificationType === 'success' ? '重启成功' : '重启失败'}通知已关闭`)
            );
        });
    };

    // click item
    const [drawerState, setDrawerState] = useObject({
        visible: false,
        selectedID: '',
        container: {} as Partial<ContainerInfo>,
    })

    interface ContainerInfoProps extends BaseComponentProps {
        container: Partial<ContainerInfo>
    }

    function ContainerInfo(props: ContainerInfoProps) {
        let imageName = props.container.usingImage?.split(':')[0]
        let imageTag = props.container.usingImage?.split(':')[1]
        const [newName, setNewName] = useState('');
        const [isRenameSingle, setIsRenameSingle] = useState(false);
        const renameSingleButtonClick = (id: string) => {
            if (newName === '') {
                openNotificationWithButton(
                    'warning',
                    '重命名失败',
                    <div dangerouslySetInnerHTML={{__html: '请填写新名称'}}/>,
                    '确认',
                    () => console.log(`容器重命名失败通知已关闭`)
                );
                setDrawerState('visible', false)
                return;
            }
            setIsRenameSingle(true)
            let client = new Client('http://localhost:12712');

            client.renameContainer(id, newName).then(r => {
                let resultDesc;
                let notificationType: NotificationType;
                if (r.code === 200) {
                    const containerName = data.find(row => row.id === id)?.name;
                    resultDesc = `${containerName} 重命名成功`;
                    notificationType = 'success';
                } else {
                    const containerName = data.find(row => row.id === id)?.name;
                    resultDesc = `${containerName} 重命名失败${r.msg}`;
                    notificationType = 'error';
                }
                setIsRenameSingle(false)
                setDrawerState('visible', false)
                openNotificationWithButton(
                    notificationType,
                    notificationType === 'success' ? '重命名成功' : '重命名失败',
                    <div dangerouslySetInnerHTML={{__html: resultDesc}}/>,
                    '确认',
                    () => console.log(`容器${notificationType === 'success' ? '重命名成功' : '重命名失败'}通知已关闭`)
                );
            });
        };


        const [inputImageName, setInputImageName] = useState('');
        const [inputImageTag, setInputImageTag] = useState('');
        const [isUpdateSingle, setIsUpdateSingle] = useState(false);

        const updateSingleContainer = (id: string, inputImageName: string, inputImageTag: string) => {
            setIsUpdateSingle(true);

            let client = new Client('http://localhost:12712');
            const container = data.find(row => row.id === id);

            if (!container) {
                openNotificationWithButton(
                    'error',
                    '更新失败',
                    <div dangerouslySetInnerHTML={{__html: "<span>获取容器信息出错。请刷新页面</span>"}}/>,
                    '确认',
                    () => console.log('获取容器信息出错通知已关闭')
                );
                setIsUpdateSingle(false);
                setDrawerState('visible', false)
                return;
            }

            const {name: containerName} = container;
            const imageName = inputImageName || container.usingImage?.split(':')[0];
            const imageTag = inputImageTag || container.usingImage?.split(':')[1];
            const imageNameAndTag = `${imageName}:${imageTag}`;
            const regex = /^[\w\-.]+:[\w\-.]+$/;

            if (!imageNameAndTag || !imageTag || !imageName || !regex.test(imageNameAndTag)) {
                openNotificationWithButton(
                    'error',
                    '更新失败',
                    <div dangerouslySetInnerHTML={{__html: "<span>镜像名称或版本异常</span>"}}/>,
                    '确认',
                    () => console.log('容器更新失败通知已关闭')
                );
                setIsUpdateSingle(false);
                setDrawerState('visible', false)
                return;
            }

            client.updateContainer(id, containerName, imageNameAndTag, true).then(r => {
                let notificationType: NotificationType;
                let resultDesc;

                if (r.code === 200) {
                    console.log(r.data.taskID);
                    let taskIds = JSON.parse(localStorage.getItem('taskIDs') || '[]');
                    taskIds.push(r.data.taskID);
                    localStorage.setItem('taskIDs', JSON.stringify(taskIds));

                    resultDesc = `${containerName} 更新任务创建成功`;
                    notificationType = 'success';
                } else {
                    resultDesc = `${containerName} 更新失败${r.msg}`;
                    notificationType = 'error';
                }

                openNotificationWithButton(
                    notificationType,
                    notificationType === 'success' ? '更新成功' : '更新失败',
                    <div dangerouslySetInnerHTML={{__html: resultDesc}}/>,
                    '确认',
                    () => console.log(`容器${notificationType === 'success' ? '更新任务成功' : '更新任务失败'}通知已关闭`)
                );
                setDrawerState('visible', false)
                setIsUpdateSingle(false);
            });
        };


        return (
            <div className={classnames(props.className, 'text-xs flex flex-col overflow-y-auto')}>
                <div className="flex my-3">
                    <span className="font-bold w-20">{'容器名称'}</span>
                    <Space.Compact style={{width: '100%'}}>
                        <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder={props.container.name}
                            className="placeholderColor"
                            style={{backgroundColor: 'white'}}/>
                        <Button
                            loading={isRenameSingle}
                            type="primary"
                            onClick={() => renameSingleButtonClick(props.container.id as string)}
                        >重命名</Button>
                    </Space.Compact>
                </div>
                <div className="flex my-3">
                    <span className="font-bold w-20">{'当前镜像'}</span>
                    <span className="font-mono">{props.container.usingImage}</span>
                </div>
                <div className="flex my-3">
                    <span className="font-bold w-20">{'目标镜像'}</span>
                    <Input
                        placeholder={imageName}
                        className="placeholderColor"
                        style={{backgroundColor: 'white'}}
                        value={inputImageName}
                        onChange={(e) => setInputImageName(e.target.value)}
                    />
                </div>
                <div className="flex my-3">
                    <span className="font-bold w-20">{'目标版本'}</span>
                    <Space.Compact style={{width: '100%'}}>
                        <Input
                            placeholder={imageTag}
                            className="placeholderColor"
                            style={{backgroundColor: 'white'}}
                            value={inputImageTag}
                            onChange={(e) => setInputImageTag(e.target.value)}
                        />
                        <Button type="primary"
                                loading={isUpdateSingle}
                                onClick={() => updateSingleContainer(props.container.id as string, inputImageName, inputImageTag)}>更新</Button>
                    </Space.Compact>
                </div>
            </div>
        )
    }

    return (
        <div className="page !h-100vh">
            {contextHolder}
            <Header title={'容器'}>
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
                    <Button.Group>
                        <Button
                            loading={isStarting}
                            className="button-green-hover button-green-active"
                            onClick={startButtonClick}>启动
                        </Button>
                        <Button
                            loading={isStopping}
                            className="button-red-hover button-red-active"
                            onClick={stopButtonClick}>停止
                        </Button>
                        <Button
                            loading={isRestarting}
                            className="button-orange-hover button-orange-active"
                            onClick={restartButtonClick}>重启
                        </Button>
                        <Button
                            loading={isUpdating}
                            className="button-blue-hover button-blue-active"
                            onClick={updateButtonClick}>更新
                        </Button>
                    </Button.Group>
                </ConfigProvider>
            </Header>

            <Card ref={cardRef} className="containers-card relative">
                <div className="overflow-auto min-h-full min-w-full">
                    <table className="full-width unselectable">
                        <thead>
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id} className={"containers-header"}>
                                {headerGroup.headers.map(header => (
                                    <th
                                        {...{
                                            key: header.id,
                                            colSpan: header.colSpan,
                                            style: {
                                                width: header.getSize(),
                                            },
                                            className: "containers-th"
                                        }}
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                        <div
                                            {...{
                                                onMouseDown: header.getResizeHandler(),
                                                onTouchStart: header.getResizeHandler(),
                                                className: `containers-resizer ${
                                                    header.column.getIsResizing() ? 'isResizing' : ''
                                                }`,
                                                style: {
                                                    transform:
                                                        columnResizeMode === 'onEnd' &&
                                                        header.column.getIsResizing()
                                                            ? `translateX(${
                                                                table.getState().columnSizingInfo.deltaOffset
                                                            }px)`
                                                            : '',
                                                },
                                            }}
                                        />
                                    </th>
                                ))}
                            </tr>
                        ))}
                        </thead>
                        <tbody>
                        {table.getRowModel().rows.map(row => (
                            <tr
                                key={row.id}
                                onClick={(e) => {
                                    if ((e.target as Element).closest('.checkbox-center')) {
                                        // 如果点击的是复选框，则不触发行的点击事件
                                        return;
                                    }
                                    console.log(row.original);
                                    setDrawerState({
                                        visible: true,
                                        selectedID: row.original?.id,
                                        container: row.original
                                    })
                                }}
                                className={"containers-body"}
                            >
                                {row.getVisibleCells().map(cell => (
                                    <td
                                        {...{
                                            key: cell.id,
                                            style: {
                                                width: cell.column.getSize(),
                                            },
                                            className: "containers-block",
                                        }}
                                    >
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </Card>
            <Drawer containerRef={cardRef} bodyClassName="flex flex-col bg-[#15222a] text-[#b7c5d6]"
                    visible={drawerState.visible} width={450}>
                <div className="flex h-8 justify-between items-center">
                    <span className="font-bold pl-3">{'容器管理'}</span>
                    <Icon type="close" style={{marginLeft: "auto"}} size={16} className="cursor-pointer"
                          onClick={() => setDrawerState('visible', false)}/>
                </div>
                <ContainerInfo className="mt-3 px-5" container={drawerState.container}/>
                <div className="flex mt-3 pr-3 justify-end">
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
                        <Button.Group>
                            <Button
                                loading={isStartingSingle}
                                className="button-green-hover button-green-active"
                                onClick={() => startSingleButtonClick(drawerState.container.id as string)}>启动
                            </Button>
                            <Button
                                loading={isStoppingSingle}
                                className="button-red-hover button-red-active"
                                onClick={() => stopSingleButtonClick(drawerState.container.id as string)}>停止
                            </Button>
                            <Button
                                loading={isRestartingSingle}
                                className="button-orange-hover button-orange-active"
                                onClick={() => restartSingleButtonClick(drawerState.container.id as string)}>重启
                            </Button>
                        </Button.Group>
                    </ConfigProvider>
                </div>
            </Drawer>
        </div>
    )
}
