function StatCard({ icon, label, value, description, type }) {
  return (
    <div className={`stat-card ${type}`}>
      <div className="stat-header">
        <div className="stat-icon">
          {icon}
        </div>

        <span className="stat-label">
          {label}
        </span>
      </div>

      <h2>{value}</h2>

      <p>{description}</p>
    </div>
  );
}

export default StatCard;