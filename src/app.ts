import "./styles.css";

// 1. タスクデータの型定義
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

type FilterType = "all" | "active" | "completed";

// 2. LocalStorage 関連の定数・関数
const STORAGE_KEY = "ts_todo_app_data";

function saveTodos(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function loadTodos(): Todo[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];
  try {
    return JSON.parse(saved) as Todo[];
  } catch (e) {
    console.error("Failed to load todos from localStorage", e);
    return [];
  }
}

// 3. アプリの状態（ステート）管理
let todos: Todo[] = loadTodos(); // LocalStorage から読み込んで初期化
let currentFilter: FilterType = "all";

// 4. DOM要素の取得
const inputEl = document.querySelector<HTMLInputElement>("#todo-input")!;
const addBtn = document.querySelector<HTMLButtonElement>("#add-btn")!;
const todoListEl = document.querySelector<HTMLUListElement>("#todo-list")!;

// --- 5. タスク一覧の描画関数 ---
function render(): void {
  todoListEl.innerHTML = "";

  // ① フィルター処理
  const filteredTodos = todos.filter((todo) => {
    if (currentFilter === "active") return !todo.completed;
    if (currentFilter === "completed") return todo.completed;
    return true;
  });

  // ② フィルターボタンの見た目（.active クラス）を更新
  updateFilterButtons();

  // ③ 画面へ出力
  filteredTodos.forEach((todo) => {
    const li = document.createElement("li");

    // テキスト部分
    const textSpan = document.createElement("span");
    textSpan.textContent = todo.text;
    if (todo.completed) textSpan.classList.add("completed");

    // クリックで完了/未完了の切り替え
    textSpan.addEventListener("click", () => {
      todo.completed = !todo.completed;
      saveTodos(); // データ保存
      render();    // 再描画
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
        saveTodos(); // データ保存
        render();    // 再描画
      }, 250);
    });

    li.appendChild(textSpan);
    li.appendChild(deleteBtn);
    todoListEl.appendChild(li);
  });
}

// --- 6. タスク追加処理 ---
function addTodo(): void {
  const text = inputEl.value.trim();
  if (text === "") return;

  const newTodo: Todo = {
    id: Date.now(),
    text: text,
    completed: false,
  };

  todos.push(newTodo);
  saveTodos(); // データ保存
  inputEl.value = "";
  render();
}

// --- 7. フィルターボタンのハイライト用関数 ---
function updateFilterButtons(): void {
  const btnAll = document.querySelector<HTMLButtonElement>("#filter-all");
  const btnActive = document.querySelector<HTMLButtonElement>("#filter-active");
  // ★ ID指定の `#` のタイポを修正
  const btnCompleted = document.querySelector<HTMLButtonElement>("#filter-completed");

  [btnAll, btnActive, btnCompleted].forEach((btn) => btn?.classList.remove("active"));

  if (currentFilter === "all") btnAll?.classList.add("active");
  if (currentFilter === "active") btnActive?.classList.add("active");
  if (currentFilter === "completed") btnCompleted?.classList.add("active");
}

// --- 8. イベントリスナーの設定 ---
addBtn.addEventListener("click", addTodo);

// Enterキーでもタスク追加できるように追加
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


// --- 10. JSON エクスポート処理 ---
function exportTodos(): void {
  if (todos.length === 0) {
    alert("エクスポートするタスクがありません。");
    return;
  }

  // データを JSON 文字列化して Blob に変換
  const dataStr = JSON.stringify(todos, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  // 疑似アンカータグを作成してダウンロードを実行
  const link = document.createElement("a");
  link.href = url;
  link.download = `todo-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();

  // メモリ解放
  URL.revokeObjectURL(url);
}

// --- 11. JSON インポート処理 ---
function importTodos(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const content = e.target?.result as string;
      const parsedData = JSON.parse(content);

      // 簡単な型チェック（配列かつ構造が妥当か確認）
      if (Array.isArray(parsedData) && isValidTodoList(parsedData)) {
        todos = parsedData;
        saveTodos(); // LocalStorage も更新
        render();    // 画面再描画
        alert("データを正常に復元しました！");
      } else {
        alert("無効な JSON フォーマットです。");
      }
    } catch (err) {
      console.error(err);
      alert("JSON ファイルの読み込みに失敗しました。");
    } finally {
      input.value = ""; // 次回同じファイルを選べるようにリセット
    }
  };

  reader.readAsText(file);
}

// インポートデータの型検証用関数 (Type Guard)
function isValidTodoList(data: any[]): data is Todo[] {
  return data.every(
    (item) =>
      typeof item.id === "number" &&
      typeof item.text === "string" &&
      typeof item.completed === "boolean"
  );
}

// --- イベントリスナーの登録 ---
document.querySelector("#export-btn")?.addEventListener("click", exportTodos);
document.querySelector("#import-file")?.addEventListener("change", importTodos);


// --- 初回描画の実行 ---
render();
