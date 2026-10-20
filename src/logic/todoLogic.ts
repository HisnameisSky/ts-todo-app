import { Todo, AISummaryData } from '../types/todo';

// タスク追加時に期限日（dueDate）やAIデータをオプションで受け取れるようにする
export const createTodoItem = (title: string, dueDate?: string): Todo => {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
    title: title.trim(),
    completed: false,
    dueDate: dueDate || undefined,
    createdAt: new Date().toISOString(),
  };
};

// AI要約データを既存のTodoに紐付ける更新関数
export const attachAiSummaryToTodo = (todo: Todo, aiData: AISummaryData): Todo => {
  return {
    ...todo,
    aiSummary: aiData,
  };
};

//


/**
 * 指定された日付（例: "2026-10-15"）に一致するTodoを抽出する
 */
export const getTodosByDate = (todos: Todo[], targetDate: string): Todo[] => {
  return todos.filter((todo) => todo.dueDate === targetDate);
};

/**
 * カレンダー表示用に、タスクを日付（"YYYY-MM-DD"）ごとにグループ化する
 */
export const groupTodosByDate = (todos: Todo[]): Record<string, Todo[]> => {
  return todos.reduce((acc, todo) => {
    if (!todo.dueDate) return acc;
    if (!acc[todo.dueDate]) {
      acc[todo.dueDate] = [];
    }
    acc[todo.dueDate].push(todo);
    return acc;
  }, {} as Record<string, Todo[]>);
};

/**
 * 期限が切れている（かつ未完了の）タスクを抽出する
 */
export const getOverdueTodos = (todos: Todo[], currentDateString: string): Todo[] => {
  return todos.filter((todo) => {
    if (!todo.dueDate || todo.completed) return false;
    return todo.dueDate < currentDateString;
  });
};