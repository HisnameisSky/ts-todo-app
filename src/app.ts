import "./styles.css";

// 1. 型定義
type Priority = "high" | "medium" | "low";
type FilterType = "all" | "active" | "completed";

// --- ポモドーロタイマーの状態管理 ---
type TimerMode = "work" | "break";
let timerInterval: number | null = null;
let timeLeft = 25 * 60; // 初期値: 25分（秒単位）
let isRunning = false;
let currentMode: TimerMode = "work";
let activeTodoId: number | null = null; // 現在実行中のタスクID

// DOM要素
const timerDisplay = document.querySelector<HTMLDivElement>("#timer-display")!;
const timerStatus = document.querySelector<HTMLDivElement>("#timer-status")!;
const startBtn = document.querySelector<HTMLButtonElement>("#timer-start-btn")!;
const pauseBtn = document.querySelector<HTMLButtonElement>("#timer-pause-btn")!;
const resetBtn = document.querySelector<HTMLButtonElement>("#timer-reset-btn")!;


interface Todo {
  id: number;
  text: string;
  completed: boolean;
  priority: Priority;
}


// 表示の更新関数
function updateTimerDisplay(): void {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  timerDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// タイマー開始
function startTimer(): void {
  if (isRunning) return;
  isRunning = true;
  startBtn.disabled = true;
  pauseBtn.disabled = false;

  const activeTodo = todos.find((t) => t.id === activeTodoId);
  const taskName = activeTodo ? `「${activeTodo.text}」を実行中` : "作業中";
  timerStatus.textContent = currentMode === "work" ? taskName : "☕ 休憩中";

  timerInterval = window.setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
      updateTimerDisplay();
    } else {
      // タイムアップ時の処理
      clearInterval(timerInterval!);
      isRunning = false;
      startBtn.disabled = false;
      pauseBtn.disabled = true;

      if (currentMode === "work") {
        alert("25分の作業が終了しました！5分間の休憩に入りましょう。");
        currentMode = "break";
        timeLeft = 5 * 60; // 5分休憩
      } else {
        alert("休憩が終了しました！次の作業を始めましょう。");
        currentMode = "work";
        timeLeft = 25 * 60; // 25分作業
      }
      updateTimerDisplay();
      timerStatus.textContent = "準備完了";
    }
  }, 1000);
}

// 一時停止
function pauseTimer(): void {
  if (!isRunning) return;
  clearInterval(timerInterval!);
  isRunning = false;
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  timerStatus.textContent = "一時停止中";
}

// リセット
function resetTimer(): void {
  clearInterval(timerInterval!);
  isRunning = false;
  currentMode = "work";
  timeLeft = 25 * 60;
  activeTodoId = null;
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  timerStatus.textContent = "準備完了";
  updateTimerDisplay();
  render(); // タスク一覧側の強調を解除するために再描画
}

// イベントリスナー
startBtn.addEventListener("click", startTimer);
pauseBtn.addEventListener("click", pauseTimer);
resetBtn.addEventListener("click", resetTimer);

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

// --- 優先度の重み付け（ソート用） ---
const priorityOrder: Record<Priority, number> = {
  high: 1,
  medium: 2,
  low: 3,
};

// --- 5. タスク一覧の描画関数 ---
function render(): void {
  todoListEl.innerHTML = "";

  // ① フィルター処理
  let filteredTodos = todos.filter((todo) => {
    if (currentFilter === "active") return !todo.completed;
    if (currentFilter === "completed") return todo.completed;
    return true;
  });

  // ② 優先度順（高 ➔ 中 ➔ 低）にソート
  filteredTodos.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  updateFilterButtons();

  filteredTodos.forEach((todo) => {
    const li = document.createElement("li");

    // テキスト表示エリア
    const textSpan = document.createElement("span");
    textSpan.textContent = todo.text;
    if (todo.completed) textSpan.classList.add("completed");

    // 優先度バッジ
    const badge = document.createElement("span");
    badge.classList.add("priority-badge", `priority-${todo.priority}`);
    const priorityLabels: Record<Priority, string> = {
      high: "高",
      medium: "中",
      low: "低",
    };
    badge.textContent = priorityLabels[todo.priority];
    textSpan.appendChild(badge);

    // ★ 1. クリックで完了/未完了の切り替え
    textSpan.addEventListener("click", () => {
      todo.completed = !todo.completed;
      saveTodos();
      render();
    });

    // ★ 2. ダブルクリックでインライン編集
    textSpan.addEventListener("dblclick", (e) => {
      e.stopPropagation(); // 完了切り替えイベントの連動を防止

      const editInput = document.createElement("input");
      editInput.type = "text";
      editInput.value = todo.text;
      editInput.classList.add("edit-input");

      // 確定処理（blur時またはEnter押下時）
      const finishEdit = () => {
        const newText = editInput.value.trim();
        if (newText !== "") {
          todo.text = newText;
          saveTodos();
        }
        render();
      };

      editInput.addEventListener("blur", finishEdit);
      editInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") finishEdit();
      });

      // span を input に置き換えてフォーカスを当てる
      li.replaceChild(editInput, textSpan);
      editInput.focus();
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

    const timerStartForTaskBtn = document.createElement("button");
    timerStartForTaskBtn.textContent = "⏱️";
    timerStartForTaskBtn.classList.add("task-timer-btn");

    // 現在選択されているタスクを強調
    if (todo.id === activeTodoId) {
      li.classList.add("active-task");
    }

    timerStartForTaskBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      activeTodoId = todo.id;
      currentMode = "work";
      timeLeft = 25 * 60;
      updateTimerDisplay();
      startTimer();
      render();
    });

    li.appendChild(timerStartForTaskBtn);
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
