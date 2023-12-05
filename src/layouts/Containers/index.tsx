import {Card, Drawer} from "@components";
import {ReactNode, useEffect, useRef, useState} from "react";
import {ColumnDef, ColumnResizeMode, flexRender, getCoreRowModel, Row, useReactTable,} from "@tanstack/react-table";
import {Client, ContainerInfo} from '@lib/request';
import {Badge, Button, Checkbox, ConfigProvider} from "antd";
import {Header} from "@components/Header";
import update from '@assets/update.png';
import check from '@assets/check.svg';
import './style.scss'
import {useObject} from "@lib/hook.ts";

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
                    statusColor = 'blue';
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

        // 创建一个新的函数来获取数据
        const fetchData = async () => {
            try {
                const newData = await client.getContainersList();

                // 使用 JSON.stringify 来比较新旧数据
                if (JSON.stringify(newData) !== JSON.stringify(dataRef.current)) {
                    setData(newData);
                    dataRef.current = newData; // 更新当前的数据
                }
            } catch (error) {
                console.error('Error while getting containers list:', error);
            }
        };

        fetchData(); // 首次渲染时获取数据

        const intervalId = setInterval(fetchData, 5000); // 每隔5秒获取一次数据

        return () => clearInterval(intervalId); // 清除定时器
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

    const handleButtonClick = () => {
        console.log(Array.from(selectedRows));
    };

    // click item
    const [drawerState, setDrawerState] = useObject({
        visible: false,
        selectedID: '',
        connection: {} as Partial<ContainerInfo>,
    })
    return (
        <div className="page !h-100vh">

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
                            className="button-green-hover button-green-active"
                            onClick={handleButtonClick}>启动
                        </Button>
                        <Button
                            className="button-red-hover button-red-active"
                            onClick={handleButtonClick}>停止
                        </Button>
                        <Button
                            className="button-orange-hover button-orange-active"
                            onClick={handleButtonClick}>重启
                        </Button>
                        <Button
                            className="button-blue-hover button-blue-active"
                            onClick={handleButtonClick}>更新
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
                                    showDrawer();
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
            <Drawer containerRef={cardRef} bodyClassName="flex flex-col bg-[#15222a] text-[#b7c5d6]" visible={drawerState.visible} width={450}>
                <span>1</span>
            </Drawer>
        </div>
    )
}
