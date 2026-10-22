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
let currentFilter: 'all' | 'active' | 'completed' = 'all';

// ポモドーロタイマーの状態管理
let timerSeconds: number = 25 * 60;
let timerInterval: number | null = null;

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

// フィルターボタン
const filterAllBtn = document.getElementById('filter-all');
const filterActiveBtn = document.getElementById('filter-active');
const filterCompletedBtn = document.getElementById('filter-completed');

// --- フィルターイベントの紐付け ---
[filterAllBtn, filterActiveBtn, filterCompletedBtn].forEach(btn => {
  btn?.addEventListener('click', (e) => {
    document.querySelectorAll('.filter-group button').forEach(b => b.classList.remove('active'));
    const target = e.currentTarget as HTMLButtonElement;
    target.classList.add('active');

    if (target.id === 'filter-active') currentFilter = 'active';
    else if (target.id === 'filter-completed') currentFilter = 'completed';
    else currentFilter = 'all';

    renderTodoList();
  });
});

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
    timerStatusEl.innerHTML = `${statusText} <br><span style="color: #818cf8; font-weight: 500; font-size: 12px;">${taskLabel}</span>`;
  }
}

timerStartBtn?.addEventListener('click', () => {
  if (timerInterval) return;
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

// --- 2. タスク追加 ---
addTodoButton?.addEventListener('click', async () => {
  const title = todoInput.value;
  if (!title.trim()) return;

  const priority = (prioritySelect?.value || 'medium') as 'high' | 'medium' | 'low';
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

// 全体再描画
function renderAll() {
  saveTodos();
  calendar.render(todos);
  renderTodoList();
  renderHeatmap();
  updateTimerDisplay('準備完了');
}

// ヒートマップ描画
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

// リスト描画（崩れ防止・フィルター完全対応）
function renderTodoList() {
  if (!todoListContainer) return;
  todoListContainer.innerHTML = '';

  let targetTodos = getTodosByDate(todos, selectedDate);

  // フィルター処理の適用
  if (currentFilter === 'active') {
    targetTodos = targetTodos.filter(t => !t.completed);
  } else if (currentFilter === 'completed') {
    targetTodos = targetTodos.filter(t => t.completed);
  }

  if (targetTodos.length === 0) {
    todoListContainer.innerHTML = `<p style="text-align: center; font-size: 12px; color: var(--text-muted); padding: 16px 0;">該当するタスクはありません</p>`;
    return;
  }

  targetTodos.forEach((todo) => {
    const isActive = todo.id === activeTaskId;
    
    const itemEl = document.createElement('div');
    itemEl.className = `task-item ${isActive ? 'active-task' : ''}`;

    const statusBadge = todo.completed 
      ? `<span class="badge-completed">完了</span>` 
      : '';

    itemEl.innerHTML = `
      <div class="task-item-header">
        <div class="task-left">
          <input type="checkbox" ${todo.completed ? 'checked' : ''} class="todo-checkbox" style="cursor: pointer; width: 16px; height: 16px;" />
          <span class="task-title-text ${todo.completed ? 'completed' : ''}">
            ${todo.title}
          </span>
          ${statusBadge}
        </div>

        <div class="task-right">
          ${!todo.aiSummary || todo.aiSummary.summary === todo.title ? `
            <button class="btn-mini btn-ai ai-enhance-btn">🤖 AI解析</button>
          ` : ''}
          <button class="btn-mini btn-timer task-timer-btn ${isActive ? 'active' : ''}">
            ${isActive ? '⏱️ 集中中' : '⏱️ 選択'}
          </button>
          <button class="btn-mini btn-delete delete-btn">🗑️</button>
          <span class="badge-dueDate">${todo.dueDate || '期限なし'}</span>
        </div>
      </div>
    `;

    // イベント登録
    const toggleComplete = () => {
      todo.completed = !todo.completed;
      renderAll();
    };

    itemEl.querySelector('.todo-checkbox')?.addEventListener('change', toggleComplete);
    itemEl.querySelector('.task-title-text')?.addEventListener('click', toggleComplete);

    itemEl.querySelector('.task-timer-btn')?.addEventListener('click', () => {
      activeTaskId = isActive ? null : todo.id;
      renderAll();
    });

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

    itemEl.querySelector('.delete-btn')?.addEventListener('click', () => {
      if (activeTaskId === todo.id) activeTaskId = null;
      todos = todos.filter(t => t.id !== todo.id);
      renderAll();
    });

    // AI要約表示
    if (todo.aiSummary && todo.aiSummary.summary !== todo.title) {
      const aiBadgeEl = document.createElement('div');
      aiBadgeEl.style.cssText = "font-size: 12px; background: rgba(2, 6, 23, 0.8); padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); color: var(--text-muted); margin-top: 4px;";
      aiBadgeEl.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="color: #818cf8; font-weight: 600;">🤖 AI要約:</span>
          <span>${todo.aiSummary.summary}</span>
        </div>
        <div style="display: flex; gap: 6px; margin-top: 6px; align-items: center;">
          ${todo.aiSummary.tags.map(tag => `<span style="background: rgba(99, 102, 241, 0.2); color: #c7d2fe; padding: 2px 6px; border-radius: 4px; font-size: 10px;">#${tag}</span>`).join('')}
          <span style="margin-left: auto; font-size: 10px; color: #fbbf24; font-family: monospace;">優先度: ${todo.aiSummary.priority}</span>
        </div>
      `;
      itemEl.appendChild(aiBadgeEl);
    }

    todoListContainer.appendChild(itemEl);
  });
}

// 初期描画の実行
renderAll();