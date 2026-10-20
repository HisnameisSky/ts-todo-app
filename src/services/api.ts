import { AISummaryData } from '../types/todo';

const API_BASE_URL = 'http://localhost:8000'; // FastAPIのローカルサーバーURL

/**
 * TODOのテキストをFastAPIに送り、AI要約・タグ・優先度を取得する
 */
export async function fetchAiEnhanceTodo(todoTitle: string): Promise<AISummaryData> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/enhance-todo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: todoTitle }),
    });

    if (!response.ok) {
      throw new Error('AIの解析処理に失敗しました。');
    }

    const data = await response.json();
    return {
      summary: data.summary,
      tags: data.tags || [],
      priority: data.priority || 'medium',
    };
  } catch (error) {
    console.error('API Error:', error);
    // エラー時のフォールバック（オフライン時やサーバー未起動時）
    return {
      summary: todoTitle.slice(0, 20) + '...',
      tags: ['一般'],
      priority: 'medium',
    };
  }
}