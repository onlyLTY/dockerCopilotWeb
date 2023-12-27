import {Card, Header} from "@components";
import {ColumnDef, ColumnResizeMode, flexRender, getCoreRowModel, useReactTable,} from "@tanstack/react-table";
import {Button, ConfigProvider, Progress} from "antd";
import {Client, ProgressInfo} from "@lib/request.ts";
import {ReactNode, useEffect, useRef, useState} from "react";
import './style.scss';

const defaultColumns: ColumnDef<ProgressInfo>[] = [
    {
        header: '任务名称',
        footer: props => props.column.id,
        accessorKey: 'name',
        cell: info => (
            <div>{info.getValue() as ReactNode}</div>
        ),
        size: 200,
        minSize: 100,
    },
    {
        header: '信息',
        footer: props => props.column.id,
        accessorKey: 'message',
        cell: info => (
            <div>{info.getValue() as ReactNode}</div>
        ),
        size: 200,
        minSize: 100,
    },
    {
        header: '进度',
        footer: props => props.column.id,
        accessorKey: 'percentage',
        cell: (info) => {
            const isDone = info.row.original.isDone;
            const percentage = info.getValue() as number;
            let status: "success" | "exception" | "active" | "normal" | undefined;
            if (isDone) {
                status = percentage === 100 ? 'success' : 'exception';
            } else {
                status = 'active';
            }
            return <Progress percent={percentage} size="small" status={status} showInfo={false}/>
        },
        size: 600,
    }
]

export default function ProgressQuery() {
    const cardRef = useRef<HTMLDivElement>(null)
    const [tasks, setTasks] = useState<ProgressInfo[]>([]);

    useEffect(() => {
        // 从 localStorage 获取 taskIDs
        const taskIDsString = localStorage.getItem('taskIDs');
        const taskIDs = taskIDsString ? JSON.parse(taskIDsString) : [];
        if (taskIDs.length === 0) {
            setTasks([]);
        }
        // 为每个 taskID 调用 API 获取进度信息
        const client = new Client('http://localhost:12712');
        const fetchTaskProgress = async () => {
            const taskProgressData = await Promise.all(
                taskIDs.slice().reverse().map(async (taskID: string) => {
                    const response = await client.queryProgress(taskID);
                    if (response.code === 200) {
                        return {
                            ...response.data,
                            taskID,
                        };
                    } else {
                        return {
                            containerName: '未知',
                            message: '请点击全部清除',
                            percentage: 0,
                            taskID,
                        };
                    }
                })
            );
            setTasks(taskProgressData);
        };

        // 立即执行一次，然后每5秒执行一次
        fetchTaskProgress();
        const intervalId = setInterval(fetchTaskProgress, 1000);

        // 清理函数
        return () => {
            clearInterval(intervalId);
        };
    }, [localStorage.getItem('taskIDs')]);

    // Define columns for the table
    const [columns] = useState<typeof defaultColumns>(() => [
        ...defaultColumns,
    ])
    const [columnResizeMode] =
        useState<ColumnResizeMode>('onChange')

    // Create a table instance
    const table = useReactTable({
        data: tasks,
        columns: columns,
        columnResizeMode,
        getCoreRowModel: getCoreRowModel(),
        debugTable: true,
        debugHeaders: true,
        debugColumns: true,
    })

    function clearTaskIDButtonClick() {
        localStorage.setItem('taskIDs', JSON.stringify([]));
        setTasks([]);
    }

    return (
        <div className="page !h-100vh">
            <Header title={'进度'}>
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
                        onClick={clearTaskIDButtonClick}
                        // loading={isDeletingImage}
                        className="button-orange-hover button-orange-active">全部清除
                    </Button>
                </ConfigProvider>
            </Header>
            <Card ref={cardRef} className="progress-card relative">
                <div className="overflow-auto min-h-full min-w-full">
                    <table className="full-width unselectable">
                        <thead>
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id} className={"progress-header"}>
                                {headerGroup.headers.map(header => (
                                    <th
                                        {...{
                                            key: header.id,
                                            colSpan: header.colSpan,
                                            style: {
                                                width: header.getSize(),
                                            },
                                            className: "progress-th"
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
                                                className: `progress-resizer ${
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
                                    // todo 点击行后显示详细进度
                                    //handleRowSelect(row.original.id);
                                    console.log(row.original);
                                }}
                                className={"progress-body"}
                            >
                                {row.getVisibleCells().map(cell => (
                                    <td
                                        {...{
                                            key: cell.id,
                                            style: {
                                                width: cell.column.getSize(),
                                            },
                                            className: "progress-block",
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
