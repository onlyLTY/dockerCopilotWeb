import {Card} from "@components/Card";
import {useEffect, useRef, useState} from "react";
import {flexRender, getCoreRowModel, Row, useReactTable,} from "@tanstack/react-table";
import {Client, ContainerInfo} from '@lib/request';
import './style.scss'
import {Button, Checkbox} from "antd";

const ContainerColumns = {
    status: '状态',
    name: 'name',
    usingImage: 'usingImage',
    createTime: 'createTime',
    runningTime: 'runningTime',
} as const


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
    type ContainerColumnsType = typeof ContainerColumns;
    const columns = (Object.keys(ContainerColumns) as Array<keyof ContainerColumnsType>).map(key => ({
        accessorKey: key,
        header: () => ContainerColumns[key],
        cell: (info: { getValue: () => any }) => info.getValue(),
    }));

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
                    <Checkbox onChange={handleSelectAll} checked={areAllRowsSelected()}>
                    </Checkbox>
                ),
                cell: ({row}: { row: Row<ContainerInfo> }) => (
                    <Checkbox
                        checked={selectedRows.has(row.original.id)}
                        onChange={() => handleRowSelect(row.original.id)}
                    />
                ),
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
        getCoreRowModel: getCoreRowModel(),
    })

    const handleButtonClick = () => {
        console.log(Array.from(selectedRows));
    };
    return (
        <div className="page !h-100vh">
            <Button onClick={handleButtonClick}>输出选中的复选框</Button>
            <Card ref={cardRef} className="containers-card relative">
                <div className="overflow-auto min-h-full min-w-full">
                    <table>
                        <thead>
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id} className="containers-header">
                                {headerGroup.headers.map(header => (
                                    <th key={header.id} className="containers-th" style={{width: '200px'}}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                        </thead>
                        <tbody>
                        {table.getRowModel().rows.map(row => (
                            <tr key={row.id} className={"cursor-default select-none"}>
                                {row.getVisibleCells().map(cell => (
                                    <td key={cell.id} className={"containers-block"}>
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
