from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import json
import google.generativeai as genai

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gemini APIキーの設定（環境変数または直接設定）
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "YOUR_API_KEY")
if GEMINI_API_KEY != "YOUR_API_KEY":
    genai.configure(api_key=GEMINI_API_KEY)

class TodoRequest(BaseModel):
    text: str

@app.get("/")
async def root():
    return {"message": "Todo AI Backend is running smoothly! 🚀"}

@app.post("/api/enhance-todo")
async def enhance_todo(req: TodoRequest):
    try:
        # APIキーが未設定の場合は安全にスマートモックを返す
        if GEMINI_API_KEY == "YOUR_API_KEY":
            return {
                "summary": f"【AI解析】 {req.text} のタスク整理",
                "tags": ["自動要約", "ワークスペース"],
                "priority": "high"
            }

        # Geminiモデルによる高度なテキスト解析
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"""
        以下のTODOタスク内容を分析し、必ずJSON形式のみで出力してください（マークダウンのバッククォート ```json などは一切含めないこと）。
        - summary: 20文字程度の一言要約
        - tags: 1〜3個の関連タグ（日本語の配列）
        - priority: 'high', 'medium', 'low' のいずれか

        タスク内容: {req.text}
        """
        
        response = model.generate_content(prompt)
        res_text = response.text.strip()
        
        # バッククォートが含まれている場合のクレンジング
        if res_text.startswith("```json"):
            res_text = res_text[7:-3].strip()
        elif res_text.startswith("```"):
            res_text = res_text[3:-3].strip()
            
        ai_data = json.loads(res_text)
        return ai_data
        
    except Exception as e:
        print(f"AI Error: {e}")
        return {
            "summary": f"要約: {req.text}",
            "tags": ["タスク"],
            "priority": "medium"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)