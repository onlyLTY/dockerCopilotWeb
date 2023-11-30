import './style.scss'
import {Card} from "@components/Card";

const ContainerColumns = {
    Status: 'status',
    Name: 'name',
    UsingImage: 'usingImage',
    CreateTime: 'createTime',
    RunningTime: 'runningTime',
    HaveUpdate: 'haveUpdate',
} as const

export default function Containers () {
    return (
        <div className="page !h-100vh">
            <div className="page-title">容器</div>
            <Card ref={cardRef} className="containers-card relative">
                <div className="overflow-auto min-h-full min-w-full">
                    <table {...instance.getTableProps()}>
                        <thead>
                            <tr {...headerGroup.getHeaderGroupProps()} className="connections-header">
                                { headers }
                            </tr>
                        </thead>

                        <tbody {...instance.getTableBodyProps()}>
                            { content }
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    )
}
