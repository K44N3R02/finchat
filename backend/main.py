import logging
from fastapi import FastAPI, HTTPException

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse
from dotenv import load_dotenv

from models import ChatRequest
from services.ai_service import get_ai_response_stream, get_ai_response_full, STREAM_AI_RESPONSE

load_dotenv()

app = FastAPI(title="FinChat API")

# CORS configuration to allow local and frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "ok"}

class EchoRequest(BaseModel):
    message: str

import asyncio

@app.post("/api/echo")
async def echo_endpoint(request: EchoRequest):
    """
    Test endpoint that echoes back the user's message after a 2-second delay.
    """
    await asyncio.sleep(2)
    return {"echo": request.message}

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    """
    Main chat endpoint. Receives conversation history and streams back the AI response.
    Can be configured to stream or send the full response at once.
    """
    try:
        # Convert Pydantic models to dicts for the AI service
        messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        
        # Decide which response mode to use based on configuration
        response_generator = get_ai_response_stream(messages) if STREAM_AI_RESPONSE else get_ai_response_full(messages)
        
        return EventSourceResponse(response_generator)
    except Exception as e:
        logger.error(f"Endpoint Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
