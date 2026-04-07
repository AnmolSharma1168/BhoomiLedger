'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const NAV = [
  { href: '/dashboard',              icon: '◈', label: 'Overview' },
  { href: '/dashboard/registry',    icon: '◉', label: 'Land Registry' },
  { href: '/dashboard/transfer',    icon: '⇄', label: 'Transfer' },
  { href: '/dashboard/loans',       icon: '◎', label: 'DeFi Loans' },
  { href: '/dashboard/inheritance', icon: '⟡', label: 'Inheritance' },
  { href: '/dashboard/reports',     icon: '◌', label: 'Reports' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<{ name: string; role: string } | null>(null)
  const [time, setTime] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('bl_token')
    const userData = localStorage.getItem('bl_user')
    if (!token) { router.push('/login'); return }
    if (userData) setUser(JSON.parse(userData))
    const tick = () => setTime(new Date().toLocaleTimeString('en-IN', { hour12: false }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [router])

  function logout() {
    localStorage.removeItem('bl_token')
    localStorage.removeItem('bl_user')
    router.push('/login')
  }

  return (
    <div className="dash-root">
      {/* Sidebar */}
      <aside className="dash-sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <svg width="18" height="18" viewBox="0 0 36 36" fill="none">
              <path d="M18 2L34 10V26L18 34L2 26V10L18 2Z" stroke="#c9a84c" strokeWidth="1.5" fill="none" opacity="0.7"/>
              <circle cx="18" cy="18" r="5" fill="#c9a84c" opacity="0.9"/>
            </svg>
          </div>
          <div>
            <div className="sidebar-logo-title">BHOOMI<span>LEDGER</span></div>
            <div className="sidebar-logo-sub">LAND REGISTRY PROTOCOL</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <div className="sidebar-nav-label">NAVIGATION</div>
          {NAV.map(item => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          
            return (
              <Link key={item.href} href={item.href} className={`sidebar-link ${active ? 'active' : ''}`}>
                <span className="sidebar-link-icon">{item.icon}</span>
                <span>{item.label.toUpperCase()}</span>
                {active && <span className="sidebar-link-dot" />}
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="sidebar-bottom">
          <div className="sidebar-network">
            <div className="network-dot" />
            <span>POLYGON AMOY</span>
            <span className="network-live">LIVE</span>
          </div>
          {user && (
            <div className="sidebar-user">
              <div className="sidebar-avatar">{user.name.charAt(0).toUpperCase()}</div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{user.name}</div>
                <div className="sidebar-user-role">{user.role.toUpperCase()}</div>
              </div>
              <button onClick={logout} className="sidebar-logout" title="Sign Out">⏻</button>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="dash-main">
        {/* Topbar */}
        <div className="dash-topbar">
          <div className="dash-topbar-left">
            <div className="dash-breadcrumb">
               <span>{NAV.find(n => n.href === pathname || (n.href !== '/dashboard' && pathname.startsWith(n.href)))?.label || 'Overview'}</span>
               
              {pathname !== '/dashboard' && (
                <>
                  <span className="breadcrumb-sep">›</span>
                  <span className="breadcrumb-active">
                    {NAV.find(n => n.href === pathname)?.label || 'Page'}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="dash-topbar-right">
            <div className="topbar-date">
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
            <div className="topbar-divider" />
            <div className="topbar-time">{time}</div>
          </div>
        </div>

        {/* Page content */}
        <div className="dash-content">
          {children}
        </div>
      </main>
    </div>
  )
}