import { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

const emptyTaskForm = {
  title: "",
  description: "",
  status: "pending"
};

const emptyTaskData = {
  tasks: [],
  page: 1,
  totalPages: 1,
  totalTasks: 0,
  summary: {
    all: 0,
    pending: 0,
    completed: 0
  }
};

function getErrorMessage(error, fallbackMessage) {
  return error.response?.data?.message || fallbackMessage;
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [taskForm, setTaskForm] = useState(emptyTaskForm);
  const [editingTaskId, setEditingTaskId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [taskData, setTaskData] = useState(emptyTaskData);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [formState, setFormState] = useState({
    isSaving: false,
    error: "",
    success: ""
  });
  const [activeTaskId, setActiveTaskId] = useState("");
  const hasActiveFilters = Boolean(search.trim()) || statusFilter !== "all";

  const loadTasks = async (targetPage = page) => {
    setIsLoading(true);
    setFetchError("");

    try {
      const { data } = await api.get("/tasks", {
        params: {
          page: targetPage,
          status: statusFilter,
          search: search.trim()
        }
      });

      setTaskData(data);
    } catch (error) {
      setFetchError(getErrorMessage(error, "Unable to load tasks."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks(page);
  }, [page, search, statusFilter]);

  const resetTaskForm = () => {
    setTaskForm(emptyTaskForm);
    setEditingTaskId("");
  };

  const handleTaskFormChange = (event) => {
    const { name, value } = event.target;
    setTaskForm((currentTaskForm) => ({
      ...currentTaskForm,
      [name]: value
    }));
    setFormState((currentState) => ({
      ...currentState,
      error: "",
      success: ""
    }));
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    if (page !== 1) {
      setPage(1);
    }
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    if (page !== 1) {
      setPage(1);
    }
  };

  const handleSubmitTask = async (event) => {
    event.preventDefault();

    if (!taskForm.title.trim()) {
      setFormState((currentState) => ({
        ...currentState,
        error: "Task title is required.",
        success: ""
      }));
      return;
    }

    setFormState({
      isSaving: true,
      error: "",
      success: ""
    });

    try {
      if (editingTaskId) {
        await api.put(`/tasks/${editingTaskId}`, taskForm);
      } else {
        await api.post("/tasks", taskForm);
      }

      const successMessage = editingTaskId
        ? "Task updated successfully."
        : "Task created successfully.";

      resetTaskForm();
      setFormState({
        isSaving: false,
        error: "",
        success: successMessage
      });

      if (page === 1) {
        await loadTasks(1);
      } else {
        setPage(1);
      }
    } catch (error) {
      setFormState({
        isSaving: false,
        error: getErrorMessage(error, "Unable to save task."),
        success: ""
      });
    }
  };

  const handleEditTask = (task) => {
    setEditingTaskId(task._id);
    setTaskForm({
      title: task.title,
      description: task.description || "",
      status: task.status
    });
    setFormState({
      isSaving: false,
      error: "",
      success: ""
    });
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const handleToggleTaskStatus = async (task) => {
    const nextStatus = task.status === "completed" ? "pending" : "completed";
    setActiveTaskId(task._id);

    try {
      await api.patch(`/tasks/${task._id}/status`, {
        status: nextStatus
      });
      await loadTasks(page);
    } catch (error) {
      setFetchError(getErrorMessage(error, "Unable to update task status."));
    } finally {
      setActiveTaskId("");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Delete this task?")) {
      return;
    }

    setActiveTaskId(taskId);

    try {
      await api.delete(`/tasks/${taskId}`);

      if (taskData.tasks.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        await loadTasks(page);
      }
    } catch (error) {
      setFetchError(getErrorMessage(error, "Unable to delete task."));
    } finally {
      setActiveTaskId("");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    if (page !== 1) {
      setPage(1);
    }
  };

  return (
    <main className="dashboard-shell">
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>{user?.name?.split(" ")[0] || "Task manager"}, stay in motion.</h1>
          <p className="hero-text">
            Review progress, keep pending work visible, and update tasks without
            leaving the page.
          </p>
        </div>

        <div className="hero-actions">
          <div className="profile-pill">
            <span>{user?.name}</span>
            <small>{user?.email}</small>
          </div>
          <button className="secondary-button" type="button" onClick={logout}>
            Logout
          </button>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <span>Total tasks</span>
          <strong>{taskData.summary.all}</strong>
        </article>
        <article className="stat-card">
          <span>Pending</span>
          <strong>{taskData.summary.pending}</strong>
        </article>
        <article className="stat-card">
          <span>Completed</span>
          <strong>{taskData.summary.completed}</strong>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel-card form-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Task editor</p>
              <h2>{editingTaskId ? "Update task" : "Create a new task"}</h2>
            </div>
            {editingTaskId ? (
              <button className="ghost-button" type="button" onClick={resetTaskForm}>
                Cancel edit
              </button>
            ) : null}
          </div>

          <form className="task-form" onSubmit={handleSubmitTask}>
            <label>
              Title
              <input
                type="text"
                name="title"
                placeholder="Ship dashboard polish"
                value={taskForm.title}
                onChange={handleTaskFormChange}
                maxLength="80"
                required
              />
            </label>

            <label>
              Description
              <textarea
                name="description"
                placeholder="Add any notes, context, or next steps"
                value={taskForm.description}
                onChange={handleTaskFormChange}
                rows="5"
              />
            </label>

            <label>
              Status
              <select
                name="status"
                value={taskForm.status}
                onChange={handleTaskFormChange}
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </label>

            {formState.error ? <p className="form-error">{formState.error}</p> : null}
            {formState.success ? <p className="form-success">{formState.success}</p> : null}

            <button className="primary-button" type="submit" disabled={formState.isSaving}>
              {formState.isSaving
                ? "Saving..."
                : editingTaskId
                  ? "Update task"
                  : "Create task"}
            </button>
          </form>
        </article>

        <article className="panel-card list-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Task list</p>
              <h2>Track every task</h2>
            </div>
            <div className="task-count-stack">
              <span className="task-count">{taskData.totalTasks} matching tasks</span>
              {hasActiveFilters ? (
                <button className="ghost-button compact-button" type="button" onClick={clearFilters}>
                  Clear filters
                </button>
              ) : null}
            </div>
          </div>

          <div className="toolbar">
            <label className="toolbar-field">
              Search
              <input
                type="search"
                placeholder="Search title or description"
                value={search}
                onChange={handleSearchChange}
              />
            </label>

            <label className="toolbar-field">
              Status
              <select value={statusFilter} onChange={handleStatusFilterChange}>
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </label>
          </div>

          {fetchError ? <p className="form-error">{fetchError}</p> : null}

          {isLoading ? (
            <div className="empty-state">
              <h3>Loading tasks...</h3>
              <p>The latest tasks are on their way.</p>
            </div>
          ) : taskData.tasks.length ? (
            <>
              <div className="task-list">
                {taskData.tasks.map((task) => (
                  <article key={task._id} className="task-card">
                    <div className="task-card-top">
                      <span
                        className={`status-badge ${
                          task.status === "completed" ? "done" : "open"
                        }`}
                      >
                        {task.status}
                      </span>
                      <small>{new Date(task.updatedAt).toLocaleString()}</small>
                    </div>

                    <div className="task-content">
                      <h3>{task.title}</h3>
                      <p>{task.description || "No description added yet."}</p>
                    </div>

                    <div className="task-actions">
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => handleToggleTaskStatus(task)}
                        disabled={activeTaskId === task._id}
                      >
                        {activeTaskId === task._id
                          ? "Updating..."
                          : task.status === "completed"
                            ? "Mark pending"
                            : "Mark complete"}
                      </button>
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={() => handleEditTask(task)}
                      >
                        Edit
                      </button>
                      <button
                        className="danger-button"
                        type="button"
                        onClick={() => handleDeleteTask(task._id)}
                        disabled={activeTaskId === task._id}
                      >
                        {activeTaskId === task._id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="pagination">
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <span>
                  Page {taskData.page} of {taskData.totalPages}
                </span>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() =>
                    setPage((currentPage) => Math.min(currentPage + 1, taskData.totalPages))
                  }
                  disabled={page === taskData.totalPages}
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h3>No tasks found</h3>
              <p>Try another filter or create a fresh task to get started.</p>
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
