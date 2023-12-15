import { Route, Navigate, Routes, useLocation, Outlet } from 'react-router-dom'
import classnames from 'classnames'
import SideBar from '@layouts/Sidebar'
import Containers from "@layouts/Containers";
import Images from "@layouts/Images";
import ProgressQuery from "@layouts/ProgressQuery";
import '@styles/common.scss'
import '@styles/iconfont.scss'

export default function App() {
    const location = useLocation()

    const routes = [
        { path: '/containers', name: '容器', element: <Containers />, noMobile: false },
        { path: '/images', name: '镜像', element: <Images />, noMobile: false },
        { path: '/progress', name: '进度', element: <ProgressQuery />, noMobile: false },
    ]

    const layout = (
        <div className={classnames('app')}>
            <SideBar routes={routes}/>
            <div className="page-container">
                <Outlet />
            </div>
        </div>
    )

    return (
        <Routes>
            <Route path="/" element={layout}>
                <Route path="/" element={<Navigate to={{ pathname: '/containers', search: location.search }} replace />} />
                {
                    routes.map(
                        route => <Route path={route.path} key={route.path} element={route.element} />,
                    )
                }
            </Route>
        </Routes>
    )
}
