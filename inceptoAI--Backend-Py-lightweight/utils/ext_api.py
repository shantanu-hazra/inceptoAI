from decouple import config
from groq import Groq


class Ext_Api():
    
    def __init__(self):
        api_key=config("API_KEY")
        self.client = Groq(api_key=api_key)
        self.model = config("MODEL_NAME")
            
    async def groq_api(self,prompt,json_mode=False):
        messages = [{"role": "user", "content": prompt}]
        
        params = {
            "model": "llama-3.3-70b-versatile",
            "messages": messages,
            "temperature": 0.3,
            "max_tokens": 2000
        }
        
        # Enable JSON mode to force valid JSON output
        if json_mode:
            params["response_format"] = {"type": "json_object"}
        
        response = self.client.chat.completions.create(**params)
        return response.choices[0].message.content
        
    async def gemini_api(self,prompt):
        from langchain_google_genai import ChatGoogleGenerativeAI
        import asyncio

        self.llm = ChatGoogleGenerativeAI(model=self.model, google_api_key=api_key)
        
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, lambda: self.llm.invoke(prompt))
        question = response.content
        
        # Cache the generated question
        
        return question        