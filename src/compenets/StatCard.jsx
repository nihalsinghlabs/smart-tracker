import useTilt from "../utils/useTilt";

function StatCard({ icon, label, value, description, type }) {
  const tilt = useTilt(8);

  return (
    <div
      ref={tilt.ref}
      className={`stat-card ${type}`}
      onPointerMove={tilt.onPointerMove}
      onPointerLeave={tilt.onPointerLeave}
    >
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
