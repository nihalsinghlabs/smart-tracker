import { Search, Bell, User, Sun, Moon } from "lucide-react";

function Topbar({
  search,
  setSearch,
  setActivePage,
  alertCount,
  theme,
  toggleTheme,
}) {
  const isDark = theme === "dark";

  return (
    <header className="topbar">
      <div className="search-box">
        <Search size={18} />

        <input
          type="text"
          placeholder="Search your inventory..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);

            if (e.target.value !== "") {
              setActivePage("Products");
            }
          }}
        />
      </div>

      <div className="topbar-right">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isDark ? "Light mode" : "Dark mode"}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          className="notification-btn"
          onClick={() => setActivePage("Alerts")}
          aria-label="Alerts"
        >
          <Bell size={20} />

          {alertCount > 0 && (
            <span className="notification-dot"></span>
          )}
        </button>

        <button
          className="profile-avatar"
          onClick={() => setActivePage("Settings")}
          aria-label="Account settings"
        >
          <User size={19} />
        </button>
      </div>
    </header>
  );
}

export default Topbar;