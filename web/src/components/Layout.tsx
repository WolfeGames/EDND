import { NavLink, Outlet } from 'react-router-dom'
import './Layout.css'

export function Layout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <NavLink to="/" className="brand" end>
          ED&D Character Creator
        </NavLink>
        <nav className="nav" aria-label="Main">
          <NavLink
            to="/characters"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Saved
          </NavLink>
          <NavLink
            to="/create"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Create
          </NavLink>
          <NavLink
            to="/random"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Random
          </NavLink>
          <NavLink
            to="/bestiary"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Bestiary
          </NavLink>
          <NavLink
            to="/pleasure-test"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Scene builder
          </NavLink>
          <NavLink
            to="/rules"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Rules
          </NavLink>
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
