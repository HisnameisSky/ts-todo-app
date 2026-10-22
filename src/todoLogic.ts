export type Priority = "high" | "medium" | "low";
export type FilterType = "all" | "active" | "completed";

export interface Todo {
  id: number;
  text: string;
  completed: boolean;
  priority: Priority;
}

export const priorityOrder: Record<Priority, number> = {
  high: 1,
  medium: 2,
  low: 3,
};

// 1. タスクの追加ロジック
export function createTodo(text: string, priority: Priority = "medium"): Todo {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("タスク名は空にできません");
  }
  return {
    id: Date.now(),
    text: trimmed,
    completed: false,
    priority,
  };
}

// 2. フィルタリング処理
export function filterTodos(todos: Todo[], filter: FilterType): Todo[] {
  return todos.filter((todo) => {
    if (filter === "active") return !todo.completed;
    if (filter === "completed") return todo.completed;
    return true;
  });
}

// 3. 優先度ソート（破壊的変更を避けるためスプレッド演算子でコピー）
export function sortTodosByPriority(todos: Todo[]): Todo[] {
  return [...todos].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

// 4. JSONインポートデータのバリデーション
export function isValidTodoList(data: any): data is Todo[] {
  if (!Array.isArray(data)) return false;
  return data.every(
    (item) =>
      typeof item?.id === "number" &&
      typeof item?.text === "string" &&
      typeof item?.completed === "boolean" &&
      ["high", "medium", "low"].includes(item?.priority)
  );
}

// フィルター状態（'all' | 'active' | 'completed'）に応じたフィルタリング
export function getFilteredTodos(todos: Todo[], date: string, filter: string) {
  const dateTodos = getTodosByDate(todos, date);
  if (filter === 'active') return dateTodos.filter(t => !t.completed);
  if (filter === 'completed') return dateTodos.filter(t => t.completed);
  return dateTodos; // 'all'
}