import "./styles.css";

// 1. 型定義
type Priority = "high" | "medium" | "low";
type FilterType = "all" | "active" | "completed";
type TimerMode = "work" | "break";

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
    return parsed.map((item: any) => ({
      ...item,
      priority: item.priority || "medium",
    }));
  } catch (e) {
    console.error("Failed to load todos from localStorage", e);
    return [];
  }
}

// 3. アプリの状態管理（変数定義を関数より前に一括配置）
let todos: Todo[] = loadTodos();
let currentFilter: FilterType = "all";

// ポモドーロタイマーの状態管理
let timerInterval: number | null = null;
let timeLeft = 25 * 60; // 25分
let isRunning = false;
let currentMode: TimerMode = "work";
let activeTodoId: number | null = null;

// 4. DOM要素の取得
const inputEl = document.querySelector<HTMLInputElement>("#todo-input")!;
const addBtn = document.querySelector<HTMLButtonElement>("#add-btn")!;
const todoListEl = document.querySelector<HTMLUListElement>("#todo-list")!;
const prioritySelect = document.querySelector<HTMLSelectElement>("#priority-select")!;

const timerDisplay = document.querySelector<HTMLDivElement>("#timer-display")!;
const timerStatus = document.querySelector<HTMLDivElement>("#timer-status")!;
const startBtn = document.querySelector<HTMLButtonElement>("#timer-start-btn")!;
const pauseBtn = document.querySelector<HTMLButtonElement>("#timer-pause-btn")!;
const resetBtn = document.querySelector<HTMLButtonElement>("#timer-reset-btn")!;

// --- 優先度の重み付け（ソート用） ---
const priorityOrder: Record<Priority, number> = {
  high: 1,
  medium: 2,
  low: 3,
};

// 5. タイマー関連の関数
function updateTimerDisplay(): void {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  timerDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

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
      clearInterval(timerInterval!);
      isRunning = false;
      startBtn.disabled = false;
      pauseBtn.disabled = true;

// ★ タイマー終了時にアラーム音を再生
      playAlarmSound();
      
      if (currentMode === "work") {
        alert("25分の作業が終了しました！5分間の休憩に入りましょう。");
        currentMode = "break";
        timeLeft = 5 * 60;
      } else {
        alert("休憩が終了しました！次の作業を始めましょう。");
        currentMode = "work";
        timeLeft = 25 * 60;
      }
      updateTimerDisplay();
      timerStatus.textContent = "準備完了";
    }
  }, 1000);
}

function pauseTimer(): void {
  if (!isRunning) return;
  clearInterval(timerInterval!);
  isRunning = false;
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  timerStatus.textContent = "一時停止中";
}

function resetTimer(): void {
  if (timerInterval) clearInterval(timerInterval);
  isRunning = false;
  currentMode = "work";
  timeLeft = 25 * 60;
  activeTodoId = null;
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  timerStatus.textContent = "準備完了";
  updateTimerDisplay();
  render();
}

// 6. タスク一覧の描画関数
function render(): void {
  todoListEl.innerHTML = "";

  let filteredTodos = todos.filter((todo) => {
    if (currentFilter === "active") return !todo.completed;
    if (currentFilter === "completed") return todo.completed;
    return true;
  });

  filteredTodos.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  updateFilterButtons();

  filteredTodos.forEach((todo) => {
    const li = document.createElement("li");

    // タイマー開始ボタン (⏱️)
    const timerStartForTaskBtn = document.createElement("button");
    timerStartForTaskBtn.textContent = "⏱️";
    timerStartForTaskBtn.classList.add("task-timer-btn");

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

    // クリックで完了切り替え
    textSpan.addEventListener("click", () => {
      todo.completed = !todo.completed;
      saveTodos();
      render();
    });

    // ダブルクリックでインライン編集
    textSpan.addEventListener("dblclick", (e) => {
      e.stopPropagation();

      const editInput = document.createElement("input");
      editInput.type = "text";
      editInput.value = todo.text;
      editInput.classList.add("edit-input");

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
        if (activeTodoId === todo.id) activeTodoId = null;
        saveTodos();
        render();
      }, 250);
    });

    li.appendChild(timerStartForTaskBtn);
    li.appendChild(textSpan);
    li.appendChild(deleteBtn);
    todoListEl.appendChild(li);
  });
}

// 7. タスク追加処理
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

// 8. フィルターボタンの更新
function updateFilterButtons(): void {
  const btnAll = document.querySelector<HTMLButtonElement>("#filter-all");
  const btnActive = document.querySelector<HTMLButtonElement>("#filter-active");
  const btnCompleted = document.querySelector<HTMLButtonElement>("#filter-completed");

  [btnAll, btnActive, btnCompleted].forEach((btn) => btn?.classList.remove("active"));

  if (currentFilter === "all") btnAll?.classList.add("active");
  if (currentFilter === "active") btnActive?.classList.add("active");
  if (currentFilter === "completed") btnCompleted?.classList.add("active");
}

// 9. JSON エクスポート / インポート機能
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

// Web Audio API を使ったビープ音再生関数
function playAlarmSound(): void {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;

  const ctx = new AudioContext();

  // ピピッという2音の電子音を生成
  const playBeep = (freq: number, startTime: number, duration: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = freq;

    // 音量のエンベロープ（ぽつんと切れるノイズを防止）
    gain.gain.setValueAtTime(0.15, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  };

  const now = ctx.currentTime;
  playBeep(880, now, 0.15);       // 1音目 (ラ / A5)
  playBeep(1760, now + 0.2, 0.3); // 2音目 (高いラ / A6)
}

// 10. イベントリスナー設定
startBtn.addEventListener("click", startTimer);
pauseBtn.addEventListener("click", pauseTimer);
resetBtn.addEventListener("click", resetTimer);

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

// 11. 初期描画
render();
