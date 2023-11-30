import classnames from 'classnames'
import logo from '../../assets/DockerCopilotlogo.png'
import { NavLink, useLocation } from 'react-router-dom'
import './style.scss'

interface SidebarProps {
    routes: Array<{
        path: string
        name: string
        noMobile?: boolean
    }>
}

export default function Sidebar (props: SidebarProps) {
    const { routes } = props
    const location = useLocation()

    const navlinks = routes.map(
        ({ path, name, noMobile }) => (
            <li className={classnames('item', { 'no-mobile': noMobile })} key={name}>
                <NavLink to={{ pathname: path, search: location.search }} className={({ isActive }) => classnames({ active: isActive })}>
                    { name }
                </NavLink>
            </li>
        ),
    )

    return (
        <div className="sidebar">
            <img src={logo} alt="logo" className="sidebar-logo" />
            <ul className="sidebar-menu">
                { navlinks }
            </ul>
            <div className="sidebar-version">
                <span className="sidebar-version-label">Docker Copilot</span>
                <span className="sidebar-version-text">version </span>
                {<span className="sidebar-version-label">Meta</span> }
            </div>
        </div>
    )
}
