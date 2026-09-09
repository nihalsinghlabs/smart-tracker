import { Inbox, PlusCircle } from "lucide-react";

function EmptyState({ setActivePage }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Inbox size={42} />
      </div>

      <h3>Your inventory is empty</h3>

      <p>
        Start by adding groceries or medicines to your inventory.
      </p>

      <button
        className="primary-btn"
        onClick={() => setActivePage("Add Product")}
      >
        <PlusCircle size={18} />
        Add Your First Product
      </button>
    </div>
  );
}

export default EmptyState;