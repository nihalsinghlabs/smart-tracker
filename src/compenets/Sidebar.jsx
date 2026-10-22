import {
  LayoutDashboard,
  PlusCircle,
  Package,
  Bell,
  Settings as SettingsIcon,
  ChevronDown,
  ScanText,
} from "lucide-react";

function Sidebar({ activePage, setActivePage, alertCount }) {
  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Add Product", icon: PlusCircle },
    { name: "Products", icon: Package },
    { name: "Receipt Scanner", icon: ScanText },
    { name: "Alerts", icon: Bell },
  ];

  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-icon">
          <Package size={21} />
        </div>

        <div className="logo-text">
          <h2>SmartTracker</h2>
          <span>Expiry Intelligence</span>
        </div>
      </div>

      <nav className="nav-menu">
        <p className="menu-title">WORKSPACE</p>

        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.name}
              className={`nav-item ${
                activePage === item.name ? "active" : ""
              }`}
              onClick={() => setActivePage(item.name)}
            >
              <Icon size={19} />

              <span>{item.name}</span>

              {item.name === "Alerts" && alertCount > 0 && (
                <b className="alert-count">{alertCount}</b>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <button
          className={`nav-item ${activePage === "Settings" ? "active" : ""}`}
          onClick={() => setActivePage("Settings")}
        >
          <SettingsIcon size={19} />
          <span>Settings</span>
        </button>

        <button
          className="user-card user-card-button"
          onClick={() => setActivePage("Settings")}
        >
          <div className="avatar">N</div>

          <div>
            <h4>Nihal Singh</h4>
            <span>Personal Inventory</span>
          </div>

          <ChevronDown size={15} />
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;