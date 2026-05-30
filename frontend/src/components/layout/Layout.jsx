import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Upload, FileText, BarChart3,
  Sparkles, ChevronRight, Zap
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/upload', icon: Upload, label: 'Upload Resumes' },
  { to: '/job', icon: FileText, label: 'Job Description' },
  { to: '/results', icon: BarChart3, label: 'Results' },
]

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600
                            flex items-center justify-center shadow-md shadow-brand-200">
              <Zap size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                RecruitAI
              </h1>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Resume Screener</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group
                ${isActive
                  ? 'bg-brand-50 text-brand-700 shadow-inner-brand'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`
              }
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'} />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight size={14} className="text-brand-400" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom hint */}
        <div className="px-4 pb-5">
          <div className="bg-gradient-to-br from-brand-50 to-purple-50 rounded-2xl p-4 border border-brand-100">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-brand-600" />
              <span className="text-xs font-bold text-brand-700" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                AI Powered
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Upload resumes and a JD to get intelligent candidate rankings.
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 min-h-screen">
        <div className="page-enter">
          {children}
        </div>
      </main>
    </div>
  )
}
