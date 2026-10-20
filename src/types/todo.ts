// AIによる要約・タグ付け・優先度の型定義
export interface AISummaryData {
  summary: string;             // AIによる一言要約
  tags: string[];              // 自動付与されたタグの配列（例: ["仕事", "急ぎ", "フロントエンド"]）
  priority: 'high' | 'medium' | 'low'; // 優先度
}

// 拡張されたTodoアイテムのインターフェース
export interface Todo {
  id: string;                  // 一意の識別子
  title: string;               // タスクのタイトル・内容
  completed: boolean;          // 完了フラグ
  dueDate?: string;            // カレンダー連携用の期限日（例: "2026-10-15"）
  aiSummary?: AISummaryData;   // AI機能による拡張データ（未生成の場合はundefined）
  createdAt: string;           // 作成日時
}