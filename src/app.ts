import { createTodoItem, getTodosByDate } from './logic/todoLogic';
import { fetchAiEnhanceTodo } from './services/api';
import { Todo } from './types/todo';
import { CalendarView } from './components/CalendarView';

// --- ローカルストレージ関連 ---
const STORAGE_KEY = 'ts_todo_app_todos_v1';

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function loadTodos(): Todo[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];
  try {
    return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load todos from localStorage', e);
    return [];
  }
}

// アプリケーションの状態
let todos: Todo[] = loadTodos();
let selectedDate: string = new Date().toISOString().split('T')[0];
let activeTaskId: string | null = null;

// ポモドーロタイマーの状態管理
let timerSeconds: number = 25 * 60;
let timerInterval: number | null = null;
let isTimerRunning: number = 0;

// カレンダーの初期化
const calendar = new CalendarView('calendar-container', (dateStr) => {
  selectedDate = dateStr;
  renderTodoList();
});

// DOM要素の取得
const todoInput = document.getElementById('todo-input') as HTMLInputElement;
const addTodoButton = document.getElementById('add-todo-btn') as HTMLButtonElement;
const prioritySelect = document.getElementById('priority-select') as HTMLSelectElement;
const todoListContainer = document.getElementById('todo-list-container') as HTMLDivElement;

const timerDisplay = document.getElementById('timer-display') as HTMLElement;
const timerStatusEl = document.getElementById('timer-status') as HTMLElement;
const timerStartBtn = document.getElementById('timer-start-btn') as HTMLButtonElement;
const timerPauseBtn = document.getElementById('timer-pause-btn') as HTMLButtonElement;
const timerResetBtn = document.getElementById('timer-reset-btn') as HTMLButtonElement;

// --- 1. ポモドーロタイマーのロジック ---
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function updateTimerDisplay(statusText: string) {
  if (timerDisplay) timerDisplay.textContent = formatTime(timerSeconds);
  
  const activeTodo = todos.find(t => t.id === activeTaskId);
  const taskLabel = activeTodo ? `🎯 集中中: ${activeTodo.title}` : '🎯 タスク未選択（フリー作業）';
  
  if (timerStatusEl) {
    timerStatusEl.innerHTML = `${statusText} <br><span class="text-indigo-400 font-medium text-xs">${taskLabel}</span>`;
  }
}

timerStartBtn?.addEventListener('click', () => {
  if (timerInterval) return;
  isTimerRunning = 1;
  timerStartBtn.disabled = true;
  timerPauseBtn.disabled = false;
  updateTimerDisplay('集中タイム中... 🔥');

  timerInterval = window.setInterval(() => {
    if (timerSeconds > 0) {
      timerSeconds--;
      updateTimerDisplay('集中タイム中... 🔥');
    } else {
      clearInterval(timerInterval!);
      timerInterval = null;
      alert('ポモドーロセッション終了！お疲れ様でした 🎉');
      timerSeconds = 25 * 60;
      timerStartBtn.disabled = false;
      timerPauseBtn.disabled = true;
      updateTimerDisplay('準備完了');
    }
  }, 1000);
});

timerPauseBtn?.addEventListener('click', () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  timerStartBtn.disabled = false;
  timerPauseBtn.disabled = true;
  updateTimerDisplay('一時停止中 ⏸️');
});

timerResetBtn?.addEventListener('click', () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  timerSeconds = 25 * 60;
  timerStartBtn.disabled = false;
  timerPauseBtn.disabled = true;
  updateTimerDisplay('準備完了');
});

// --- 2. タスク管理・描画ロジック ---
addTodoButton?.addEventListener('click', async () => {
  const title = todoInput.value;
  if (!title.trim()) return;

  const priority = prioritySelect.value as 'high' | 'medium' | 'low';
  let newTodo = createTodoItem(title, selectedDate);
  newTodo.aiSummary = {
    summary: title,
    tags: [priority === 'high' ? '重要' : '通常'],
    priority: priority
  };

  todoInput.value = '';
  todos.push(newTodo);
  renderAll();
});

// 全体再描画（自動保存を含む）
function renderAll() {
  saveTodos();
  calendar.render(todos);
  renderTodoList();
  renderHeatmap();
  updateTimerDisplay('準備完了');
}

// ヒートマップを描画する関数
function renderHeatmap() {
  const heatmapContainer = document.getElementById('heatmap-grid');
  if (!heatmapContainer) return;
  heatmapContainer.innerHTML = '';

  const daysToShow = 30;
  const today = new Date();

  for (let i = daysToShow - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    const completedCount = todos.filter(t => t.dueDate === dateStr && t.completed).length;

    let levelClass = 'level-0';
    if (completedCount === 1) levelClass = 'level-1';
    else if (completedCount === 2) levelClass = 'level-2';
    else if (completedCount >= 3) levelClass = 'level-3';

    const cell = document.createElement('div');
    cell.className = `heatmap-cell ${levelClass}`;
    cell.title = `${dateStr}: 完了タスク ${completedCount}件`;
    heatmapContainer.appendChild(cell);
  }
}

// リスト描画
function renderTodoList() {
  if (!todoListContainer) return;
  todoListContainer.innerHTML = '';

  const targetTodos = getTodosByDate(todos, selectedDate);

  if (targetTodos.length === 0) {
    todoListContainer.innerHTML = `<p class="text-center text-xs text-slate-500 py-4">この日のタスクはありません</p>`;
    return;
  }

  targetTodos.forEach((todo) => {
    const isActive = todo.id === activeTaskId;
    
    const itemEl = document.createElement('div');
    itemEl.className = `p-4 mb-3 border rounded-xl flex flex-col gap-2 shadow-md transition ${
      isActive ? 'border-indigo-500 bg-indigo-950/25 active-task' : 'border-slate-800 bg-slate-900/80'
    }`;

    itemEl.innerHTML = `
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <input type="checkbox" ${todo.completed ? 'checked' : ''} class="todo-checkbox w-4 h-4 accent-indigo-500 rounded cursor-pointer" />
          <span class="todo-title ${todo.completed ? 'line-through text-slate-500' : 'text-slate-100'} font-medium text-sm cursor-pointer truncate">
            ${todo.title}
          </span>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          ${!todo.aiSummary || todo.aiSummary.summary === todo.title ? `
            <button class="ai-enhance-btn text-xs px-2.5 py-1 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-900 transition cursor-pointer">
              🤖 AI解析
            </button>
          ` : ''}
          <button class="task-timer-btn text-xs px-2.5 py-1 rounded-lg border cursor-pointer ${
            isActive ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }">
            ${isActive ? '⏱️ 集中中' : '⏱️ 選択'}
          </button>
          <button class="delete-btn text-xs px-2 py-1 rounded-lg bg-rose-950/40 text-rose-400 border border-rose-500/30 hover:bg-rose-900/60 transition cursor-pointer">
            🗑️
          </button>
          <span class="text-[10px] font-mono text-indigo-400 bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-500/30">
            ${todo.dueDate || '期限なし'}
          </span>
        </div>
      </div>
    `;

    // 1. 完了トグル（チェックボックス ＆ タイトルクリック）
    const toggleComplete = () => {
      todo.completed = !todo.completed;
      renderAll();
    };

    itemEl.querySelector('.todo-checkbox')?.addEventListener('change', toggleComplete);
    itemEl.querySelector('.todo-title')?.addEventListener('click', toggleComplete);

    // 2. タイマー対象選択
    itemEl.querySelector('.task-timer-btn')?.addEventListener('click', () => {
      activeTaskId = isActive ? null : todo.id;
      renderAll();
    });

    // 3. 任意のAI解析ボタン
    itemEl.querySelector('.ai-enhance-btn')?.addEventListener('click', async (e) => {
      const btn = e.currentTarget as HTMLButtonElement;
      btn.textContent = '解析中...';
      btn.disabled = true;

      try {
        const aiData = await fetchAiEnhanceTodo(todo.title);
        todo.aiSummary = aiData;
        renderAll();
      } catch (err) {
        console.error('AI enhancement failed', err);
        btn.textContent = 'エラー';
      }
    });

    // 4. 削除ボタン
    itemEl.querySelector('.delete-btn')?.addEventListener('click', () => {
      if (activeTaskId === todo.id) {
        activeTaskId = null;
      }
      todos = todos.filter(t => t.id !== todo.id);
      renderAll();
    });

    // AI要約バッジ
    if (todo.aiSummary && todo.aiSummary.summary !== todo.title) {
      const aiBadgeEl = document.createElement('div');
      aiBadgeEl.className = "text-xs bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex flex-col gap-1 text-slate-300 mt-2";
      aiBadgeEl.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="text-indigo-400 font-semibold">🤖 AI要約:</span>
          <span>${todo.aiSummary.summary}</span>
        </div>
        <div class="flex gap-1 mt-1 items-center">
          ${todo.aiSummary.tags.map(tag => `<span class="bg-indigo-900/40 text-indigo-300 px-1.5 py-0.5 rounded text-[10px]">#\${tag}</span>`).join('')}
          <span class="ml-auto text-[10px] uppercase font-mono text-amber-400">優先度: ${todo.aiSummary.priority}</span>
        </div>
      `;
      itemEl.appendChild(aiBadgeEl);
    }

    todoListContainer.appendChild(itemEl);
  });
}

// 初期描画の実行
renderAll();