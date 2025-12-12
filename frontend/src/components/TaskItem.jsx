function TaskItem({ task, isActive, onSelect, onToggleComplete, onDelete }) {
  return (
    <div className={`task-item ${isActive ? 'active' : ''} ${task.completed ? 'completed' : ''}`}>
      {/* Checkbox for completion */}
      <input
        type="checkbox"
        checked={task.completed}
        onChange={onToggleComplete}
        className="task-checkbox"
      />

      {/* Delete button */}
      <button
        onClick={onDelete}
        className="delete-button"
        aria-label="Delete task"
      >
        🗑️
      </button>
    </div>
  );
}

export default TaskItem;
