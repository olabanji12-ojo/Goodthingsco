import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  Archive,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ShoppingBag,
  Sparkles,
  Inbox,
  Truck,
  Settings,
  FileText,
} from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

export default function AdminLayout() {
  const { user, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/orders', label: 'Orders', icon: ShoppingBag, end: false },
    { to: '/admin/corporate', label: 'Corporate Requests', icon: Inbox, end: false },
    { to: '/admin/custom', label: 'Custom Requests', icon: Sparkles, end: false },
    { to: '/admin/products', label: 'Products', icon: Package, end: true },
    { to: '/admin/products/new', label: 'Add Product', icon: PlusCircle, end: true },
    { to: '/admin/products/archived', label: 'Archived Products', icon: Archive, end: true },
    { to: '/admin/settings', label: 'Settings & Delivery', icon: Settings, end: true },
    { to: '/admin/content', label: 'Website Content', icon: FileText, end: true },
  ];

  const futureItems = [
    { label: 'WhatsApp Automation', icon: Truck },
  ];

  const sidebarContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Brand Header */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              backgroundColor: '#c5a880',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0f172a',
              fontWeight: 700,
              fontSize: '16px',
              letterSpacing: '-0.02em',
            }}
          >
            G
          </div>
          <div>
            <div style={{ color: '#ffffff', fontWeight: 600, fontSize: '15px', letterSpacing: '0.02em' }}>
              Good Things Co.
            </div>
            <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Atelier Management
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div style={{ flex: 1, padding: '20px 12px', overflowY: 'auto' }}>
        <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 12px 10px 12px', fontWeight: 600 }}>
          Store Management
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileMenuOpen(false)}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  backgroundColor: isActive ? 'rgba(197, 168, 128, 0.18)' : 'transparent',
                  borderLeft: isActive ? '3px solid #c5a880' : '3px solid transparent',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '14px',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                })}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Future Modules */}
        <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '28px 12px 10px 12px', fontWeight: 600 }}>
          Future Modules
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {futureItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  color: '#475569',
                  fontSize: '13px',
                  cursor: 'not-allowed',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Icon size={16} />
                  <span>{item.label}</span>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: '#64748b',
                  }}
                >
                  Soon
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer / User Profile */}
      <div style={{ padding: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <div style={{ color: '#f8fafc', fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </div>
            <div style={{ color: '#10b981', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              Authorized Administrator
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '8px 12px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')}
        >
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Desktop Sidebar */}
      <aside
        style={{
          width: '260px',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: '100vh',
          display: 'none',
        }}
        className="admin-desktop-sidebar"
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 998,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Mobile Drawer Sidebar */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '280px',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          zIndex: 999,
          transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {sidebarContent}
      </aside>

      {/* Main Content Layout */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Navbar */}
        <header
          style={{
            height: '64px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 50,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="admin-mobile-toggle"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                color: '#334155',
              }}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div style={{ fontSize: '14px', color: '#64748b' }}>
              Good Things Co. <span style={{ margin: '0 4px' }}>/</span> <span style={{ color: '#0f172a', fontWeight: 600 }}>Admin Portal</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <a
              href="/shop"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                color: '#475569',
                textDecoration: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                transition: 'all 0.15s ease',
              }}
            >
              <span>View Storefront</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, padding: '32px 24px', maxWidth: '1400px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .admin-desktop-sidebar {
            display: block !important;
          }
          .admin-mobile-toggle {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
