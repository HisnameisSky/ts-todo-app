import { describe, it, expect } from "vitest";
import {
  createTodo,
  filterTodos,
  sortTodosByPriority,
  isValidTodoList,
  Todo,
} from "./todoLogic";

describe("ToDo アプリ - コアロジックのテスト", () => {
  // --- 1. タスク生成のテスト ---
  describe("createTodo", () => {
    it("正常な入力で Todo オブジェクトが正しく生成されること", () => {
      const todo = createTodo("TypeScriptの学習", "high");
      expect(todo.text).toBe("TypeScriptの学習");
      expect(todo.priority).toBe("high");
      expect(todo.completed).toBe(false);
      expect(todo.id).toBeTypeOf("number");
    });

    it("空文字や空白のみの場合はエラーをスローすること", () => {
      expect(() => createTodo("   ")).toThrow("タスク名は空にできません");
    });
  });

  // --- 2. フィルター処理のテスト ---
  describe("filterTodos", () => {
    const mockTodos: Todo[] = [
      { id: 1, text: "タスク1", completed: false, priority: "medium" },
      { id: 2, text: "タスク2", completed: true, priority: "high" },
      { id: 3, text: "タスク3", completed: false, priority: "low" },
    ];

    it("'all' フィルターですべてのタスクが返されること", () => {
      const result = filterTodos(mockTodos, "all");
      expect(result).toHaveLength(3);
    });

    it("'active' フィルターで未完了タスクのみ取得できること", () => {
      const result = filterTodos(mockTodos, "active");
      expect(result).toHaveLength(2);
      expect(result.every((t) => !t.completed)).toBe(true);
    });

    it("'completed' フィルターで完了済みタスクのみ取得できること", () => {
      const result = filterTodos(mockTodos, "completed");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });
  });

  // --- 3. 優先度ソートのテスト ---
  describe("sortTodosByPriority", () => {
    it("高➔中➔低 の順序で正しく整列されること", () => {
      const mockTodos: Todo[] = [
        { id: 1, text: "低タスク", completed: false, priority: "low" },
        { id: 2, text: "高タスク", completed: false, priority: "high" },
        { id: 3, text: "中タスク", completed: false, priority: "medium" },
      ];

      const sorted = sortTodosByPriority(mockTodos);
      expect(sorted.map((t) => t.priority)).toEqual(["high", "medium", "low"]);
    });
  });

  // --- 4. バリデーション機能のテスト ---
  describe("isValidTodoList", () => {
    it("正しい構造の JSON 配列を true と判定すること", () => {
      const validData = [
        { id: 101, text: "Valid Task", completed: false, priority: "high" },
      ];
      expect(isValidTodoList(validData)).toBe(true);
    });

    it("不正なデータ構造（フィールド欠損など）を false と判定すること", () => {
      const invalidData = [
        { id: "not-a-number", text: "Invalid", completed: false },
      ];
      expect(isValidTodoList(invalidData)).toBe(false);
    });
  });
});