
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import apiRequest from "../../api/api";
import "./farm-planner.scss";

const categories = [
    "Irrigation",
    "Fertilizer",
    "Pest Control",
    "Crop Inspection",
    "Harvesting",
    "Other"
];

const statuses = ["Pending", "In Progress", "Completed"];
const priorities = ["Low", "Medium", "High"];

const initialForm = {
    title: "",
    description: "",
    crop: "",
    category: "Other",
    dueDate: "",
    priority: "Medium",
    notes: ""
};

function FarmPlanner() {
    const { getToken } = useAuth();

    const [tasks, setTasks] = useState([]);
    const [form, setForm] = useState(initialForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [filter, setFilter] = useState("All");

    const loadTasks = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const data = await apiRequest("/api/tasks", getToken);
            setTasks(data.tasks || []);
        } catch (err) {
            setError(err.message || "Unable to load farm activities.");
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handleCreateTask = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");
        setMessage("");

        try {
            const data = await apiRequest("/api/tasks", getToken, {
                method: "POST",
                body: JSON.stringify(form)
            });

            if (data.task) {
                setTasks((previous) =>
                    [...previous, data.task].sort(
                        (a, b) =>
                            new Date(a.dueDate) - new Date(b.dueDate)
                    )
                );
            } else {
                await loadTasks();
            }

            setForm({ ...initialForm });
            setMessage("Farm activity added successfully.");
        } catch (err) {
            setError(err.message || "Unable to create the activity.");
        } finally {
            setSaving(false);
        }
    };

    const handleStatusChange = async (taskId, status) => {
        setError("");
        setMessage("");

        try {
            const data = await apiRequest(`/api/tasks/${taskId}`, getToken, {
                method: "PATCH",
                body: JSON.stringify({ status })
            });

            if (data.task) {
                setTasks((previous) =>
                    previous.map((task) =>
                        task._id === taskId ? data.task : task
                    )
                );
            } else {
                await loadTasks();
            }

            setMessage("Activity status updated.");
        } catch (err) {
            setError(err.message || "Unable to update activity status.");
        }
    };

    const handleDeleteTask = async (taskId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this farm activity?"
        );

        if (!confirmed) return;

        setError("");
        setMessage("");

        try {
            await apiRequest(`/api/tasks/${taskId}`, getToken, {
                method: "DELETE"
            });

            setTasks((previous) =>
                previous.filter((task) => task._id !== taskId)
            );

            setMessage("Farm activity deleted successfully.");
        } catch (err) {
            setError(err.message || "Unable to delete the activity.");
        }
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const visibleTasks = tasks.filter((task) =>
        filter === "All" ? true : task.status === filter
    );

    const completedCount = tasks.filter(
        (task) => task.status === "Completed"
    ).length;

    const pendingCount = tasks.filter(
        (task) => task.status === "Pending"
    ).length;

    const overdueCount = tasks.filter((task) => {
        const due = new Date(task.dueDate);
        due.setHours(0, 0, 0, 0);

        return due < today && task.status !== "Completed";
    }).length;

    const formatDate = (date) =>
        new Date(date).toLocaleDateString(undefined, {
            day: "numeric",
            month: "short",
            year: "numeric"
        });

    return (
        <main className="farm-planner page-container">
            <header className="planner-header">
                <div className="planner-heading-content">
                    <span className="planner-eyebrow">
                        FARM MANAGEMENT
                    </span>

                    <h1>Farmer Activity Planner</h1>

                    <p>
                        Plan your farm work, track deadlines, and manage
                        daily agricultural activities.
                    </p>
                </div>

                <div className="planner-header-icon" aria-hidden="true">
                    🌱
                </div>
            </header>

            <section className="planner-stats">
                <article className="planner-stat">
                    <span>Total Activities</span>
                    <strong>{tasks.length}</strong>
                </article>

                <article className="planner-stat">
                    <span>Pending</span>
                    <strong>{pendingCount}</strong>
                </article>

                <article className="planner-stat">
                    <span>Completed</span>
                    <strong>{completedCount}</strong>
                </article>

                <article className="planner-stat overdue-stat">
                    <span>Overdue</span>
                    <strong>{overdueCount}</strong>
                </article>
            </section>

            <section className="planner-layout">
                <form
                    className="planner-form planner-panel"
                    onSubmit={handleCreateTask}
                >
                    <h2>Add Farm Activity</h2>

                    <p className="planner-subtitle">
                        Enter the details of your next farm task.
                    </p>

                    <label htmlFor="task-title">Activity title *</label>
                    <input
                        id="task-title"
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        placeholder="e.g. Irrigate rice field"
                        maxLength={120}
                        required
                    />

                    <label htmlFor="task-description">Description</label>
                    <textarea
                        id="task-description"
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        placeholder="Describe the work to be done"
                        rows={3}
                        maxLength={1000}
                    />

                    <label htmlFor="task-crop">Crop</label>
                    <input
                        id="task-crop"
                        name="crop"
                        value={form.crop}
                        onChange={handleChange}
                        placeholder="e.g. Rice, Cotton"
                        maxLength={80}
                    />

                    <div className="planner-form-row">
                        <div>
                            <label htmlFor="task-category">Category</label>
                            <select
                                id="task-category"
                                name="category"
                                value={form.category}
                                onChange={handleChange}
                            >
                                {categories.map((category) => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="task-priority">Priority</label>
                            <select
                                id="task-priority"
                                name="priority"
                                value={form.priority}
                                onChange={handleChange}
                            >
                                {priorities.map((priority) => (
                                    <option key={priority} value={priority}>
                                        {priority}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <label htmlFor="task-date">Due date *</label>
                    <input
                        id="task-date"
                        name="dueDate"
                        type="date"
                        value={form.dueDate}
                        onChange={handleChange}
                        required
                    />

                    <label htmlFor="task-notes">Notes</label>
                    <textarea
                        id="task-notes"
                        name="notes"
                        value={form.notes}
                        onChange={handleChange}
                        placeholder="Optional notes or reminders"
                        rows={2}
                        maxLength={1000}
                    />

                    <button
                        className="planner-submit"
                        type="submit"
                        disabled={saving}
                    >
                        {saving ? "Adding Activity..." : "+ Add Activity"}
                    </button>
                </form>

                <section className="planner-panel task-list-panel">
                    <div className="task-list-heading">
                        <div>
                            <h2>Your Activities</h2>
                            <p className="planner-subtitle">
                                Keep track of your farm work.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="planner-refresh"
                            onClick={loadTasks}
                            disabled={loading}
                        >
                            {loading ? "Loading..." : "Refresh"}
                        </button>
                    </div>

                    <div className="planner-filters">
                        {["All", ...statuses].map((status) => (
                            <button
                                type="button"
                                key={status}
                                className={filter === status ? "active" : ""}
                                aria-pressed={filter === status}
                                onClick={() => setFilter(status)}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    {error && (
                        <p
                            className="planner-message error-message"
                            role="alert"
                        >
                            {error}
                        </p>
                    )}

                    {message && (
                        <p
                            className="planner-message success-message"
                            role="status"
                        >
                            {message}
                        </p>
                    )}

                    {loading ? (
                        <div className="planner-empty">
                            Loading activities...
                        </div>
                    ) : visibleTasks.length === 0 ? (
                        <div className="planner-empty">
                            <span>🌾</span>
                            <h3>No activities found</h3>
                            <p>
                                Add a farm activity or choose another filter.
                            </p>
                        </div>
                    ) : (
                        <div className="planner-task-list">
                            {visibleTasks.map((task) => {
                                const due = new Date(task.dueDate);
                                due.setHours(0, 0, 0, 0);

                                const isOverdue =
                                    due < today &&
                                    task.status !== "Completed";

                                return (
                                    <article
                                        className="planner-task"
                                        key={task._id}
                                    >
                                        <div className="task-card-top">
                                            <div className="task-card-title">
                                                <span className="task-category">
                                                    {task.category}
                                                </span>
                                                <h3>{task.title}</h3>
                                            </div>

                                            <span
                                                className={`task-priority priority-${(
                                                    task.priority || "Medium"
                                                ).toLowerCase()}`}
                                            >
                                                {task.priority || "Medium"}
                                            </span>
                                        </div>

                                        {task.description && (
                                            <p className="task-description">
                                                {task.description}
                                            </p>
                                        )}

                                        {task.crop && (
                                            <p className="task-crop">
                                                🌾 Crop: {task.crop}
                                            </p>
                                        )}

                                        {task.notes && (
                                            <p className="task-notes">
                                                📝 {task.notes}
                                            </p>
                                        )}

                                        <div className="task-due-date">
                                            <span>
                                                📅 Due: {formatDate(task.dueDate)}
                                            </span>

                                            {isOverdue && (
                                                <span className="task-overdue">
                                                    Overdue
                                                </span>
                                            )}
                                        </div>

                                        <div className="task-card-bottom">
                                            <select
                                                aria-label={`Status for ${task.title}`}
                                                value={task.status}
                                                onChange={(event) =>
                                                    handleStatusChange(
                                                        task._id,
                                                        event.target.value
                                                    )
                                                }
                                            >
                                                {statuses.map((status) => (
                                                    <option
                                                        key={status}
                                                        value={status}
                                                    >
                                                        {status}
                                                    </option>
                                                ))}
                                            </select>

                                            <button
                                                type="button"
                                                className="task-delete"
                                                onClick={() =>
                                                    handleDeleteTask(task._id)
                                                }
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>
            </section>
        </main>
    );
}

export default FarmPlanner;
