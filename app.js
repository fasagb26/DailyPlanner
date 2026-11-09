const dateElement = document.querySelector("#current-date");
const taskList = document.querySelector("#task-list");
const form = document.querySelector("#task-form");
const titleInput = document.querySelector("#task-title");
const timeInput = document.querySelector("#task-time");
const emptyState = document.querySelector("#empty-state");
const progressCount = document.querySelector("#progress-count");
const progressTrack = document.querySelector("#progress-track");
const progressBar = document.querySelector("#progress-bar");
const taskTotal = document.querySelector("#task-total");
const savedStatus = document.querySelector("#saved-status");

let selectedDate = startOfDay(new Date());
let tasks = loadTasks();

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function loadTasks() {
  try {
    const stored = JSON.parse(localStorage.getItem("daylight-planner-tasks") || "{}");
    return stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {};
  } catch {
    return {};
  }
}

function saveTasks() {
  try {
    localStorage.setItem("daylight-planner-tasks", JSON.stringify(tasks));
    savedStatus.textContent = "Saved on this device";
  } catch {
    savedStatus.textContent = "Could not save on this device";
  }
}

function formatTime(value) {
  if (!value) return "";
  const [hours, minutes] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date);
}

function render() {
  const key = dateKey(selectedDate);
  const dayTasks = Array.isArray(tasks[key]) ? tasks[key] : [];
  dateElement.dateTime = key;
  dateElement.textContent = selectedDate.toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
  taskList.replaceChildren();

  dayTasks.forEach((task) => {
    const row = document.createElement("li");
    row.className = `task-row${task.completed ? " is-complete" : ""}`;

    const main = document.createElement("div");
    main.className = "task-main";
    const check = document.createElement("button");
    check.className = "task-check";
    check.type = "button";
    check.setAttribute("aria-label", `${task.completed ? "Mark incomplete" : "Complete"}: ${task.title}`);
    check.setAttribute("aria-pressed", String(Boolean(task.completed)));
    check.textContent = task.completed ? "✓" : "";
    check.addEventListener("click", () => updateTask(task.id, (item) => { item.completed = !item.completed; }));

    const copy = document.createElement("div");
    copy.className = "task-copy";
    const title = document.createElement("div");
    title.className = "task-title";
    title.textContent = task.title;
    copy.append(title);
    if (task.time) {
      const time = document.createElement("div");
      time.className = "task-time";
      time.textContent = formatTime(task.time);
      copy.append(time);
    }
    main.append(check, copy);

    const actions = document.createElement("div");
    actions.className = "task-actions";
    const remove = document.createElement("button");
    remove.className = "delete-button";
    remove.type = "button";
    remove.setAttribute("aria-label", `Delete: ${task.title}`);
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      tasks[key] = dayTasks.filter((item) => item.id !== task.id);
      saveTasks();
      render();
    });
    actions.append(remove);
    row.append(main, actions);
    taskList.append(row);
  });

  const completed = dayTasks.filter((task) => task.completed).length;
  const percent = dayTasks.length ? Math.round((completed / dayTasks.length) * 100) : 0;
  progressCount.textContent = `${completed} of ${dayTasks.length} ${dayTasks.length === 1 ? "task" : "tasks"} complete`;
  progressTrack.setAttribute("aria-valuenow", String(percent));
  progressBar.style.width = `${percent}%`;
  taskTotal.textContent = String(dayTasks.length);
  emptyState.hidden = dayTasks.length > 0;
  taskList.hidden = dayTasks.length === 0;
}

function updateTask(id, update) {
  const key = dateKey(selectedDate);
  tasks[key] = tasks[key].map((task) => {
    if (task.id === id) update(task);
    return task;
  });
  saveTasks();
  render();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = titleInput.value.trim();
  if (!title) {
    titleInput.focus();
    return;
  }
  const key = dateKey(selectedDate);
  const dayTasks = Array.isArray(tasks[key]) ? tasks[key] : [];
  dayTasks.push({ id: crypto.randomUUID(), title, time: timeInput.value, completed: false });
  tasks[key] = dayTasks;
  saveTasks();
  form.reset();
  titleInput.focus();
  render();
});

document.querySelector("#previous-day").addEventListener("click", () => {
  selectedDate.setDate(selectedDate.getDate() - 1);
  render();
});
document.querySelector("#next-day").addEventListener("click", () => {
  selectedDate.setDate(selectedDate.getDate() + 1);
  render();
});
document.querySelector("#today-button").addEventListener("click", () => {
  selectedDate = startOfDay(new Date());
  render();
});

render();
