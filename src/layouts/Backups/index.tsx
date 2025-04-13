import {Card, Header, NotificationType} from "@components";
import {ColumnDef, ColumnResizeMode, flexRender, getCoreRowModel, useReactTable,} from "@tanstack/react-table";
import {Button, ConfigProvider, Divider} from "antd";
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
    const {getBackupsList, createBackup, restoreBackup, delBackup, createComposeBackup} = useApi()

    useEffect(() => {
      const fetchData = async () => {
        try {
          const backupsListResp = await getBackupsList();
          const backupsList = backupsListResp.data ?? []; // 确保非 null

          // 深度比较优化（考虑 null/undefined/空数组）
          if (
            (dataRef.current === null && backupsList.length === 0) ||
            JSON.stringify(dataRef.current) !== JSON.stringify(backupsList)
          ) {
            setData(backupsList);
            dataRef.current = backupsList;

            // 清理无效的 selectedRows
            setSelectedRows(prev => new Set(
              Array.from(prev).filter(id => backupsList.includes(id))
            ));
          }
        } catch (error) {
          console.error('Fetch error:', error);
        }
      };

      fetchData();

      const intervalId = setInterval(fetchData, 5000);
      return () => clearInterval(intervalId);
    }, [getBackupsList,selectedRows]); // 移除 selectedRows 依赖

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
            cell: (info: { row: { original: string; }; }) => {
                const filename = info.row.original;
                const canRestore = filename.endsWith('.json');
                return (
                    <div>
                      {canRestore && (
                        <Button
                          className="text-button"
                          loading={isRestoreContainer}
                          onClick={() => handleRestore(filename)}
                        >
                          恢复
                        </Button>
                      )}
                      <Button
                        className="text-button"
                        loading={isDeleteBackup}
                        onClick={() => handleDelete(filename)}
                      >
                        删除
                      </Button>
                    </div>
                );
            },
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
                notificationType === 'success' ? '恢复成功' : '恢复失败',
                <div dangerouslySetInnerHTML={{__html: resultDesc}}/>,
                '确认',
                () => console.log(`容器${notificationType === 'success' ? '恢复任务成功' : '恢复任务失败'}通知已关闭`)
            );
        });
        setIsRestoreContainer(false);
    }

    const [isDeleteBackup, setIsDeleteBackup] = useState(false);

    function handleDelete(original: string) {
        setIsDeleteBackup(true);
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
        setIsDeleteBackup(false);
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
    const [isBackupCompose, setIsBackupCompose] = useState(false);

    function backupButtonClick() {
        setIsBackupContainer(true);
        createBackup().then(r => {
            let notificationType: NotificationType;
            let resultDesc;
            if (r.code === 200) {
                resultDesc = `容器config备份成功`;
                notificationType = 'success';
            } else {
                resultDesc = `容器config备份失败${r.msg}`;
                notificationType = 'error';
            }
            openNotificationWithButton(
                notificationType,
                notificationType === 'success' ? '备份成功' : '备份失败',
                <div dangerouslySetInnerHTML={{__html: resultDesc}}/>,
                '确认',
                () => console.log(`容器${notificationType === 'success' ? '备份任务成功' : '备份任务失败'}通知已关闭`)
            );
        });
        setIsBackupContainer(false)
    }

    function backupComposeButtonClick() {
        setIsBackupCompose(true);
        createComposeBackup().then(r => {
            let notificationType: NotificationType;
            let resultDesc;
            if (r.code === 200) {
                resultDesc = `compose备份成功`;
                notificationType = 'success';
            } else {
                resultDesc = `compose备份失败${r.msg}`;
                notificationType = 'error';
            }
            const showComposeNotice = notificationType === 'success' && !localStorage.getItem('composeReadme');
            openNotificationWithButton(
              notificationType,
              notificationType === 'success' ? '备份成功' : '备份失败',
              <>
                <div dangerouslySetInnerHTML={{__html: resultDesc}}/>
                {showComposeNotice && (
                  <div style={{marginTop: 16}}>
                    <Divider style={{margin: '8px 0'}}/>
                    <div dangerouslySetInnerHTML={{__html:
                      `目前compose备份还不完善，如性能限制等还未支持，如果遇到问题，可以github提issue给我`
                    }}/>
                  </div>
                )}
              </>,
              '确认',
              () => {
                console.log(`容器${notificationType === 'success' ? '备份任务成功' : '备份任务失败'}通知已关闭`);
                if (showComposeNotice) {
                  localStorage.setItem('composeReadme', "isNotify");
                }
              }
            );

        });
        setIsBackupCompose(false)
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
                    <Button.Group>
                        <Button
                            onClick={backupButtonClick}
                            loading={isBackupContainer}
                            className="button-blue-hover button-blue-active">config备份
                        </Button>
                        <Button
                            onClick={backupComposeButtonClick}
                            loading={isBackupCompose}
                            className="button-blue-hover button-blue-active">compose备份
                        </Button>
                    </Button.Group>
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
