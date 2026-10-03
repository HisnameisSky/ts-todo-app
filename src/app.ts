import "./styles.css";

// 1. 型定義
type Priority = "high" | "medium" | "low";
type FilterType = "all" | "active" | "completed";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  priority: Priority;
}

// 2. 定数 & LocalStorage 補助関数
const STORAGE_KEY = "ts_todo_app_data";

function saveTodos(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function loadTodos(): Todo[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved);
    // 既存の古いデータ（priority がないデータ）にも互換性を持たせる処理
    return parsed.map((item: any) => ({
      ...item,
      priority: item.priority || "medium",
    }));
  } catch (e) {
    console.error("Failed to load todos from localStorage", e);
    return [];
  }
}

// 3. アプリの状態管理
let todos: Todo[] = loadTodos();
let currentFilter: FilterType = "all";

// 4. DOM要素の取得（上部に一括配置）
const inputEl = document.querySelector<HTMLInputElement>("#todo-input")!;
const addBtn = document.querySelector<HTMLButtonElement>("#add-btn")!;
const todoListEl = document.querySelector<HTMLUListElement>("#todo-list")!;
const prioritySelect = document.querySelector<HTMLSelectElement>("#priority-select")!;

// 5. タスク一覧の描画関数
function render(): void {
  todoListEl.innerHTML = "";

  // フィルター処理
  const filteredTodos = todos.filter((todo) => {
    if (currentFilter === "active") return !todo.completed;
    if (currentFilter === "completed") return todo.completed;
    return true;
  });

  updateFilterButtons();

  filteredTodos.forEach((todo) => {
    const li = document.createElement("li");

    // テキスト部分
    const textSpan = document.createElement("span");
    textSpan.textContent = todo.text;
    if (todo.completed) textSpan.classList.add("completed");

    // 優先度バッジの生成
    const badge = document.createElement("span");
    badge.classList.add("priority-badge", `priority-${todo.priority}`);
    
    const priorityLabels: Record<Priority, string> = {
      high: "高",
      medium: "中",
      low: "低",
    };
    badge.textContent = priorityLabels[todo.priority];
    textSpan.appendChild(badge);

    // 完了/未完了の切り替え
    textSpan.addEventListener("click", () => {
      todo.completed = !todo.completed;
      saveTodos();
      render();
    });

    // 削除ボタン
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "削除";
    deleteBtn.classList.add("delete-btn");

    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      li.classList.add("removing");

      setTimeout(() => {
        todos = todos.filter((t) => t.id !== todo.id);
        saveTodos();
        render();
      }, 250);
    });

    li.appendChild(textSpan);
    li.appendChild(deleteBtn);
    todoListEl.appendChild(li);
  });
}

// 6. タスク追加処理
function addTodo(): void {
  const text = inputEl.value.trim();
  if (text === "") return;

  const newTodo: Todo = {
    id: Date.now(),
    text: text,
    completed: false,
    priority: (prioritySelect.value as Priority) || "medium",
  };

  todos.push(newTodo);
  saveTodos();
  inputEl.value = "";
  prioritySelect.value = "medium";
  render();
}

// 7. フィルターボタンのハイライト処理
function updateFilterButtons(): void {
  const btnAll = document.querySelector<HTMLButtonElement>("#filter-all");
  const btnActive = document.querySelector<HTMLButtonElement>("#filter-active");
  const btnCompleted = document.querySelector<HTMLButtonElement>("#filter-completed");

  [btnAll, btnActive, btnCompleted].forEach((btn) => btn?.classList.remove("active"));

  if (currentFilter === "all") btnAll?.classList.add("active");
  if (currentFilter === "active") btnActive?.classList.add("active");
  if (currentFilter === "completed") btnCompleted?.classList.add("active");
}

// 8. JSON エクスポート / インポート機能
function exportTodos(): void {
  if (todos.length === 0) {
    alert("エクスポートするタスクがありません。");
    return;
  }

  const dataStr = JSON.stringify(todos, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `todo-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();

  URL.revokeObjectURL(url);
}

function importTodos(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const content = e.target?.result as string;
      const parsedData = JSON.parse(content);

      if (Array.isArray(parsedData) && isValidTodoList(parsedData)) {
        todos = parsedData;
        saveTodos();
        render();
        alert("データを正常に復元しました！");
      } else {
        alert("無効な JSON フォーマットです。");
      }
    } catch (err) {
      console.error(err);
      alert("JSON ファイルの読み込みに失敗しました。");
    } finally {
      input.value = "";
    }
  };

  reader.readAsText(file);
}

function isValidTodoList(data: any[]): data is Todo[] {
  return data.every(
    (item) =>
      typeof item.id === "number" &&
      typeof item.text === "string" &&
      typeof item.completed === "boolean"
  );
}

// 9. イベントリスナーの設定
addBtn.addEventListener("click", addTodo);

inputEl.addEventListener("keypress", (e) => {
  if (e.key === "Enter") addTodo();
});

document.querySelector("#filter-all")?.addEventListener("click", () => {
  currentFilter = "all";
  render();
});

document.querySelector("#filter-active")?.addEventListener("click", () => {
  currentFilter = "active";
  render();
});

document.querySelector("#filter-completed")?.addEventListener("click", () => {
  currentFilter = "completed";
  render();
});

document.querySelector("#export-btn")?.addEventListener("click", exportTodos);
document.querySelector("#import-file")?.addEventListener("change", importTodos);

// 10. 初期描画
render();
