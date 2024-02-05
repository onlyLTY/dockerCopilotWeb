import {Card, Header} from "@components";
import {ColumnDef, ColumnResizeMode, flexRender, getCoreRowModel, Row, useReactTable,} from "@tanstack/react-table";
import {Button, Checkbox, ConfigProvider, Modal, Radio, RadioChangeEvent, Tag} from "antd";
import {ReactNode, useEffect, useRef, useState} from "react";
import useCustomNotification from "@components/Message";
import {ImageInfo} from "@lib/request/type.ts";
import {useApi} from "@lib/request/apiReq.ts";

const defaultColumns: ColumnDef<ImageInfo>[] = [
    {
        header: '镜像名称',
        footer: props => props.column.id,
        accessorKey: 'name',
        cell: info => (
            <div>{info.getValue() as ReactNode}</div>
        ),
        size: 200,
        minSize: 100,
    },
    {
        header: '状态',
        footer: props => props.column.id,
        accessorKey: 'inUsed',
        cell: info => {
            const inUsed = info.getValue() as boolean;
            if (inUsed) {
                return <Tag bordered={false} color="success">使用中</Tag>;
            } else {
                return <Tag bordered={false} color="warning">未使用</Tag>;
            }
        },
        size: 100,
    },
    {
        header: 'TAG',
        footer: props => props.column.id,
        accessorKey: 'tag',
        cell: info => (
            <div>{info.getValue() as ReactNode}</div>
        ),
        size: 100,
        minSize: 100,
    },
    {
        header: '大小',
        footer: props => props.column.id,
        accessorKey: 'size',
        cell: info => info.getValue(),
        size: 100,
    },
    {
        header: '创建时间',
        footer: props => props.column.id,
        accessorKey: 'createTime',
        cell: info => info.getValue(),
        size: 200,
    },
    {
        header: '镜像ID',
        footer: props => props.column.id,
        accessorKey: 'id',
        cell: info => info.getValue(),
        size: 350,
    },
]

export default function Images() {
    const cardRef = useRef<HTMLDivElement>(null)
    const [data, setData] = useState<ImageInfo[]>([]);
    const dataRef = useRef(data); // 创建一个引用来存储当前的数据
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const {contextHolder, openNotificationWithButton} = useCustomNotification();
    const {getImagesList, delImage} = useApi();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const resp = await getImagesList();
                const imageData = resp.data;
                if (JSON.stringify(imageData) !== JSON.stringify(dataRef.current)) {
                    setData(imageData);
                    dataRef.current = imageData;

                    // 更新 selectedRows，仅保留存在于新数据中的 ID
                    const updatedSelectedRows = new Set(
                        Array.from(selectedRows).filter(id => imageData.some((row: ImageInfo) => row.id === id))
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
    }, [getImagesList, selectedRows]);

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
        if (selectedRows.size > 0) {
            return data.every(row => selectedRows.has(row.id));
        }
        return false;
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
                cell: ({row}: { row: Row<ImageInfo> }) => (
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

    const [open, setOpen] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [modalText, setModalText] = useState<ReactNode>('Content of the modal');
    const [value, setValue] = useState(1);

    const cleanImageList = (condition: string) => {
        return data
            .filter((image) => {
                if (condition === '1' && image.tag === 'None') {
                    return true;
                } else if (condition === '2' && !image.inUsed) {
                    return true;
                }
                return false;
            })
            .map((image) => image);
    }

    const cleanImageListText = (condition: string) => {
        return cleanImageList(condition).map(image => {
            return <p>{image.name}:{image.tag}</p>
        })
    }

    const onChange = (e: RadioChangeEvent) => {
        console.log('radio checked', e.target.value);
        setValue(e.target.value);
        setModalText(cleanImageListText(e.target.value.toString()));
    };
    const showModal = () => {
        setOpen(true);
        setModalText(cleanImageListText(value.toString()));
    };

    const handleOk = () => {
        setModalText(<div>正在清理中</div>);
        setConfirmLoading(true);
        cleanImageList(value.toString()).forEach(async (image) => {
            await deleteImage(image.id, false);
        },);
        setOpen(false);
        setConfirmLoading(false);
    };

    const handleCancel = () => {
        console.log('Clicked cancel button');
        setOpen(false);
    };

    const deleteImage = async (imageId: string, force: boolean) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const promises: any[] = [];
        const promise = await delImage(imageId, force).then(r => ({
            imageId,
            result: r
        }));
        promises.push(promise);
        Promise.all(promises).then(results => {
            const success = results.filter(r => 200 === r.result.code);
            const failed = results.filter(r => 200 !== r.result.code);
            if (success.length > 0) {
                const successDesc = success.map(r => {
                    const imageName = data.find(row => row.id === r.imageId)?.name;
                    return `${imageName} 删除成功`; // 构造字符串
                }).join('<br>'); // 使用 HTML 的 <br> 标签进行换行
                openNotificationWithButton(
                    'success',
                    '删除成功',
                    <div dangerouslySetInnerHTML={{__html: successDesc}}/>, // 使用 dangerouslySetInnerHTML 渲染 HTML 字符串
                    '确认',
                    () => console.log('容器删除成功通知已关闭')
                );

            }
            if (failed.length > 0) {
                const failedDesc = failed.map(r => {
                    const imageName = data.find(row => row.id === r.imageId)?.name;
                    return `${imageName} 删除失败${r.result.msg}`; // 构造字符串
                }).join('<br>'); // 使用 HTML 的 <br> 标签进行换行
                openNotificationWithButton(
                    'error',
                    '删除失败',
                    <div dangerouslySetInnerHTML={{__html: failedDesc}}/>, // 使用 dangerouslySetInnerHTML 渲染 HTML 字符串
                    '确认',
                    () => console.log('容器删除失败通知已关闭')
                );
            }
        });
    }

    const [isDeletingImage, setIsDeletingImage] = useState(false);
    const [isForceDeletingImage, setIsForceDeletingImage] = useState(false);

    function deleteImageButtonClick() {
        setIsDeletingImage(true);
        if (selectedRows.size === 0) {
            openNotificationWithButton(
                'warning',
                '未选择容器',
                <div dangerouslySetInnerHTML={{__html: '请选择要删除的容器'}}/>, // 使用 dangerouslySetInnerHTML 渲染 HTML 字符串
                '确认',
                () => console.log('未选择容器通知已关闭')
            );
            setIsDeletingImage(false)
            return;
        }
        selectedRows.forEach(async (imageId) => {
            await deleteImage(imageId, false);
        },);
        setIsDeletingImage(false);
    }

    function forceDeleteImageButtonClick() {
        setIsForceDeletingImage(true);
        if (selectedRows.size === 0) {
            openNotificationWithButton(
                'warning',
                '未选择容器',
                <div dangerouslySetInnerHTML={{__html: '请选择要强制删除的容器'}}/>, // 使用 dangerouslySetInnerHTML 渲染 HTML 字符串
                '确认',
                () => console.log('未选择容器通知已关闭')
            );
            setIsForceDeletingImage(false)
            return;
        }
        selectedRows.forEach(async (imageId) => {
            await deleteImage(imageId, true);
        },);
        setIsForceDeletingImage(false);
    }

    return (
        <div className="page !h-100vh">
            {contextHolder}
            <Header title={'镜像'}>
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
                            onClick= {deleteImageButtonClick}
                            loading={isDeletingImage}
                            className="button-orange-hover button-orange-active">删除
                        </Button>
                        <Button
                            onClick={showModal}
                            className="button-red-hover button-red-active">清理镜像
                        </Button>
                        <Button
                            onClick={forceDeleteImageButtonClick}
                            loading={isForceDeletingImage}
                            className="button-red-hover button-red-active">强制删除
                        </Button>
                    </Button.Group>
                </ConfigProvider>
            </Header>
            <Modal
                title="清理镜像"
                open={open}
                onOk={handleOk}
                confirmLoading={confirmLoading}
                onCancel={handleCancel}
                okText="确认"
                cancelText="取消"
            >
                <Radio.Group onChange={onChange} value={value}>
                    <Radio value={1}>无TAG镜像</Radio>
                    <Radio value={2}>未使用镜像</Radio>
                </Radio.Group>
                {modalText}
            </Modal>
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
                                    console.log(row.original);
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
        </div>
    )
}
