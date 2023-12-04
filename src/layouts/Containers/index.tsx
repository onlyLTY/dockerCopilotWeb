import {Card} from "@components/Card";
import {ReactNode, useEffect, useRef, useState} from "react";
import {ColumnDef, ColumnResizeMode, flexRender, getCoreRowModel, Row, useReactTable,} from "@tanstack/react-table";
import {Client, ContainerInfo} from '@lib/request';
import './style.scss'
import {Badge, Button, Checkbox, Tag} from "antd";

const defaultColumns: ColumnDef<ContainerInfo>[] = [
    {
        header: '状态',
        footer: props => props.column.id,
        accessorKey: 'status',
        cell: info => {
            const status = info.getValue();
            let statusColor = '';
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
                <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                    <Badge color={statusColor}/>
                </div>
            );
        },
        size: 50,
        minSize: 50,
        maxSize: 50,
    },
    {
        header: '容器名称',
        footer: props => props.column.id,
        accessorKey: 'name',
        cell: info => {
            const haveUpdate = info.row.original.haveUpdate;
            return (
                <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                    {info.getValue() as ReactNode}
                    {haveUpdate &&
                        <Tag color="blue">有更新</Tag>
                    }
                </div>
            );
        },
        size: 200,
        minSize: 100,
    },
    {
        header: '使用的镜像',
        footer: props => props.column.id,
        accessorKey: 'usingImage',
        cell: info => (
            <div style={{textAlign: 'center'}}>{info.getValue() as ReactNode}</div>
        ),
        size: 450,
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
    return (
        <div className="page !h-100vh">
            <Button onClick={handleButtonClick}>输出选中的复选框</Button>
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
                                    handleRowSelect(row.original.id);
                                }}
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
        </div>
    )
}
