import {Card, Header, NotificationType} from "@components";
import {ColumnDef, ColumnResizeMode, flexRender, getCoreRowModel, useReactTable,} from "@tanstack/react-table";
import {Button, ConfigProvider} from "antd";
import {useEffect, useRef, useState} from "react";
import useCustomNotification from "@components/Message";
import './style.scss';
import {useApi} from "@lib/request/apiReq.ts";


const defaultColumns: ColumnDef<string>[] = [
    {
        header: '备份文件名',
        footer: props => props.column.id,
        accessorKey: '',
        cell: info => (
            <div>{info.row.original}</div>
        ),
        size: 200,
        minSize: 100,
    },
]

export default function Backups() {
    const cardRef = useRef<HTMLDivElement>(null)
    const [data, setData] = useState<string[]>([]);
    const dataRef = useRef(data); // 创建一个引用来存储当前的数据
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const {contextHolder, openNotificationWithButton} = useCustomNotification();
    const {getBackupsList, createBackup, restoreBackup, delBackup} = useApi()

    useEffect(() => {
        const fetchData = async () => {
            try {
                const backupsListResp = await getBackupsList();
                const backupsList = backupsListResp.data;
                if (backupsList === null || JSON.stringify(backupsList) !== JSON.stringify(dataRef.current)) {
                    setData(backupsList || []);
                    dataRef.current = backupsList || [];

                    // 更新 selectedRows，仅保留存在于新数据中的 ID
                    const updatedSelectedRows = new Set(
                        Array.from(selectedRows).filter(id => backupsList && backupsList.some((row: string) => row === id))
                    );
                    setSelectedRows(updatedSelectedRows);
                }
            } catch (error) {
                console.error('Error while getting backups list:', error);
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
    }, [getBackupsList, selectedRows]);

    // Define columns for the table
    const [columns] = useState<typeof defaultColumns>(() => [
        ...defaultColumns,
    ])
    const [columnResizeMode] =
        useState<ColumnResizeMode>('onChange')

    const columnsWithButton = [
        // 其余列
        ...columns,
        // 按钮列
        {
            header: '操作',
            accessorKey: '',
            cell: (info: { row: { original: string; }; }) => (
                <div>
                        <Button className={'text-button'} loading={isRestoreContainer}
                                onClick={() => handleRestore(info.row.original)}>恢复</Button>
                        <Button className={'text-button'} loading={isDelteBackup}
                                onClick={() => handleDelete(info.row.original)}>删除</Button>
                </div>
            ),
            size: 200,
            minSize: 100,
        },
    ];

    const [isRestoreContainer, setIsRestoreContainer] = useState(false);

    function handleRestore(original: string) {
        setIsRestoreContainer(true);
        restoreBackup(original).then(r => {
            let notificationType: NotificationType;
            let resultDesc;
            if (r.code === 200) {
                const taskIds = JSON.parse(localStorage.getItem('taskIDs') || '[]');
                taskIds.push(r.data.taskID);
                localStorage.setItem('taskIDs', JSON.stringify(taskIds));

                resultDesc = `容器恢复任务创建成功`;
                notificationType = 'success';
            } else {
                resultDesc = `容器恢复任务创建失败${r.msg}`;
                notificationType = 'error';
            }
            openNotificationWithButton(
                notificationType,
                notificationType === 'success' ? '更新成功' : '更新失败',
                <div dangerouslySetInnerHTML={{__html: resultDesc}}/>,
                '确认',
                () => console.log(`容器${notificationType === 'success' ? '更新任务成功' : '更新任务失败'}通知已关闭`)
            );
        });
        setIsRestoreContainer(false);
    }

    const [isDelteBackup, setIsDelteBackup] = useState(false);

    function handleDelete(original: string) {
        setIsDelteBackup(true);
        delBackup(original).then(r => {
            let notificationType: NotificationType;
            let resultDesc;
            if (r.code === 200) {
                resultDesc = `${original}备份删除成功`;
                notificationType = 'success';
            } else {
                resultDesc = `${original}备份删除失败${r.msg}`;
                notificationType = 'error';
            }
            openNotificationWithButton(
                notificationType,
                notificationType === 'success' ? '更新成功' : '更新失败',
                <div dangerouslySetInnerHTML={{__html: resultDesc}}/>,
                '确认',
                () => console.log(`容器${notificationType === 'success' ? '更新任务成功' : '更新任务失败'}通知已关闭`)
            );
        });
        setIsDelteBackup(false);
    }

    // Create a table instance
    const table = useReactTable({
        data,
        columns: columnsWithButton,
        columnResizeMode,
        getCoreRowModel: getCoreRowModel(),
        debugTable: true,
        debugHeaders: true,
        debugColumns: true,
    })

    const [isBackupContainer, setIsBackupContainer] = useState(false);

    function backupButtonClick() {
        setIsBackupContainer(true);
        createBackup().then(r => {
            let notificationType: NotificationType;
            let resultDesc;
            if (r.code === 200) {
                resultDesc = `容器备份成功`;
                notificationType = 'success';
            } else {
                resultDesc = `容器备份失败${r.msg}`;
                notificationType = 'error';
            }
            openNotificationWithButton(
                notificationType,
                notificationType === 'success' ? '更新成功' : '更新失败',
                <div dangerouslySetInnerHTML={{__html: resultDesc}}/>,
                '确认',
                () => console.log(`容器${notificationType === 'success' ? '更新任务成功' : '更新任务失败'}通知已关闭`)
            );
        });
        setIsBackupContainer(false)
    }

    return (
        <div className="page !h-100vh">
            {contextHolder}
            <Header title={'备份'}>
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
                    <Button
                        onClick={backupButtonClick}
                        loading={isBackupContainer}
                        className="button-blue-hover button-blue-active">新建备份
                    </Button>
                </ConfigProvider>
            </Header>
            <Card ref={cardRef} className="backups-card relative">
                <div className="overflow-auto min-h-full min-w-full">
                    <table className="full-width unselectable">
                        <thead>
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id} className={"backups-header"}>
                                {headerGroup.headers.map(header => (
                                    <th
                                        {...{
                                            key: header.id,
                                            colSpan: header.colSpan,
                                            style: {
                                                width: header.getSize(),
                                            },
                                            className: "backups-th"
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
                                                className: `backups-resizer ${
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
                                }}
                                className={"backups-body"}
                            >
                                {row.getVisibleCells().map(cell => (
                                    <td
                                        {...{
                                            key: cell.id,
                                            style: {
                                                width: cell.column.getSize(),
                                            },
                                            className: "backups-block",
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
        </div>
    )
}
