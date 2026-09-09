import { Search, Bell, User } from "lucide-react";

function Topbar({
  search,
  setSearch,
  setActivePage,
  alertCount,
}) {
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
          className="notification-btn"
          onClick={() => setActivePage("Alerts")}
        >
          <Bell size={20} />

          {alertCount > 0 && (
            <span className="notification-dot"></span>
          )}
        </button>

        <div className="profile-avatar">
          <User size={19} />
        </div>
      </div>
    </header>
  );
}

export default Topbar;