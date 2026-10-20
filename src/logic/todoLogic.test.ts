import { getTodosByDate, groupTodosByDate } from './todoLogic';
import { Todo } from '../types/todo';

describe('日付別のタスク管理ロジックのテスト', () => {
  const sampleTodos: Todo[] = [
    { id: '1', title: 'デザイン修正', completed: false, dueDate: '2026-10-15', createdAt: '2026-10-10' },
    { id: '2', title: 'API結合テスト', completed: true, dueDate: '2026-10-15', createdAt: '2026-10-10' },
    { id: '3', title: '資料作成', completed: false, dueDate: '2026-10-20', createdAt: '2026-10-10' },
  ];

  test('指定した日付のタスクのみが正しく抽出されること', () => {
    const result = getTodosByDate(sampleTodos, '2026-10-15');
    expect(result.length).toBe(2);
    expect(result[0].title).toBe('デザイン修正');
  });

  test('タスクが日付ごとに正しくグループ化されること', () => {
    const grouped = groupTodosByDate(sampleTodos);
    expect(grouped['2026-10-15'].length).toBe(2);
    expect(grouped['2026-10-20'].length).toBe(1);
  });
});