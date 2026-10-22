import { Sun, Moon, Package } from "lucide-react";

function Settings({ theme, toggleTheme, products }) {
  const isDark = theme === "dark";

  return (
    <div className="page-content">
      <section className="dashboard-header">
        <div>
          <span className="dashboard-eyebrow">PREFERENCES</span>
          <h1 className="page-title">Settings</h1>
          <p>Customize how SmartTracker looks and see your account details.</p>
        </div>
      </section>

      <div className="form-card settings-card">
        <h3>Appearance</h3>
        <p className="settings-hint">Choose how SmartTracker looks.</p>

        <div className="settings-options">
          <button
            className={`settings-option ${!isDark ? "selected" : ""}`}
            onClick={() => { if (isDark) toggleTheme(); }}
          >
            <Sun size={18} />
            <span>Light</span>
          </button>

          <button
            className={`settings-option ${isDark ? "selected" : ""}`}
            onClick={() => { if (!isDark) toggleTheme(); }}
          >
            <Moon size={18} />
            <span>Dark</span>
          </button>
        </div>
      </div>

      <div className="form-card settings-card">
        <h3>Account</h3>

        <div className="settings-row">
          <span>Name</span>
          <strong>Nihal Singh</strong>
        </div>

        <div className="settings-row">
          <span>Inventory type</span>
          <strong>Personal Inventory</strong>
        </div>

        <div className="settings-row">
          <span>Products stored</span>
          <strong>
            <Package size={14} /> {products.length}
          </strong>
        </div>
      </div>
    </div>
  );
}

export default Settings;