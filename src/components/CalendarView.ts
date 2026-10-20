import { Todo } from '../types/todo';

export class CalendarView {
  private container: HTMLElement;
  private currentDate: Date = new Date();
  private onDateSelect: (dateStr: string) => void;
  private selectedDateStr: string;

  constructor(containerId: string, onDateSelect: (dateStr: string) => void) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`Container ${containerId} not found`);
    this.container = el;
    this.onDateSelect = onDateSelect;
    this.selectedDateStr = new Date().toISOString().split('T')[0];
  }

  // 現在選択中の日付を更新
  public setSelectedDate(dateStr: string) {
    this.selectedDateStr = dateStr;
    this.render();
  }

  // カレンダーの描画
  public render(todos: Todo[] = []) {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth(); // 0-11

    // 月の最初の日と最後の日を取得
    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();

    // タスクの日付ごとの件数を集計するマップ
    const taskCountMap: Record<string, number> = {};
    todos.forEach(t => {
      if (t.dueDate) {
        taskCountMap[t.dueDate] = (taskCountMap[t.dueDate] || 0) + 1;
      }
    });

    let html = `
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 backdrop-blur-md shadow-xl text-slate-100 mb-6">
        <div class="flex items-center justify-between mb-4">
          <button id="prev-month-btn" class="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 transition">◀ 前月</button>
          <span class="font-bold text-sm tracking-wide">${year}年 ${month + 1}月</span>
          <button id="next-month-btn" class="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 transition">次月 ▶</button>
        </div>
        <div class="grid grid-cols-7 gap-1 text-center text-xs text-slate-400 mb-2 font-mono">
          <span>日</span><span>月</span><span>火</span><span>水</span><span>木</span><span>金</span><span>土</span>
        </div>
        <div class="grid grid-cols-7 gap-1 text-sm">
    `;

    // 空白のセル（前月分）
    for (let i = 0; i < firstDayIndex; i++) {
      html += `<div></div>`;
    }

    // 日付のセル
    for (let day = 1; day <= lastDay; day++) {
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(day).padStart(2, '0');
      const dateStr = `${year}-${mStr}-${dStr}`;
      
      const isSelected = dateStr === this.selectedDateStr;
      const count = taskCountMap[dateStr] || 0;

      let btnClass = "h-9 rounded-xl flex flex-col items-center justify-center transition relative cursor-pointer ";
      if (isSelected) {
        btnClass += "bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30";
      } else {
        btnClass += "bg-slate-800/50 hover:bg-slate-800 text-slate-200 border border-slate-800/80";
      }

      html += `
        <button data-date="${dateStr}" class="${btnClass}">
          <span>${day}</span>
          ${count > 0 ? `<span class="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-400"></span>` : ''}
        </button>
      `;
    }

    html += `</div></div>`;
    this.container.innerHTML = html;

    // イベントリスナーのバインド
    this.container.querySelector('#prev-month-btn')?.addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      this.render(todos);
    });

    this.container.querySelector('#next-month-btn')?.addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      this.render(todos);
    });

    this.container.querySelectorAll('button[data-date]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLButtonElement;
        const d = target.getAttribute('data-date');
        if (d) {
          this.selectedDateStr = d;
          this.onDateSelect(d);
          this.render(todos);
        }
      });
    });
  }
}