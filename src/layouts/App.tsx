import { Route, Navigate, Routes, useLocation, Outlet } from 'react-router-dom'
import classnames from 'classnames'
import SideBar from '@layouts/Sidebar'
import Containers from "@layouts/Containers";
import '../styles/common.scss'
import '../styles/iconfont.scss'
const ExternalControllerModal = () => <div>External Controller Modal</div>

export default function App() {
    const location = useLocation()

    const routes = [
        { path: '/containers', name: '容器', element: <Containers />, noMobile: false },
    ]

    const layout = (
        <div className={classnames('app')}>
            <SideBar routes={routes}/>
            <div className="page-container">
                <Outlet />
            </div>
            <ExternalControllerModal />
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
