import os
import json
import asyncio
import logging
from openai import AsyncOpenAI
from services.finance_service import fetch_crypto_data

logger = logging.getLogger(__name__)

# Configuration to toggle between streaming and at-once responses
STREAM_AI_RESPONSE = False

# Helper to get the OpenAI client lazily
def get_openai_client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    return AsyncOpenAI(api_key=api_key)

SYSTEM_PROMPT = """You are FinChat, a helpful, mobile-first AI financial assistant. 
You provide concise, WhatsApp-style responses about cryptocurrency and stock markets.
When a user asks for the price or history of one or more cryptocurrencies, use the `get_crypto_data` tool for each one to fetch real-time and 7-day historical data.

Important: When providing the response that includes historical data, your main text should summarize the price action or trend briefly for each coin. 
DO NOT include the raw list of thousands of prices in your text. Instead, for each coin, output a JSON block in exactly this format immediately after its summary:

```json
{
  "symbol": "BTC",
  "chartData": [[timestamp, price], ...]
}
```

Make sure each JSON block contains the `historical_data_7d` returned by the tool for that specific coin. 
CRITICAL: The JSON block must be strictly formatted without extra spaces in keys or values. 
DO NOT add spaces inside the numbers or the key names.
If the user asks for multiple coins, provide multiple summaries and multiple JSON blocks.
"""

tools = [
    {
        "type": "function",
        "function": {
            "name": "get_crypto_data",
            "description": "Fetch the current price and 7-day historical market data for a cryptocurrency.",
            "parameters": {
                "type": "object",
                "properties": {
                    "symbol": {
                        "type": "string",
                        "description": "The symbol of the cryptocurrency (e.g., 'btc', 'eth', 'sol')."
                    }
                },
                "required": ["symbol"]
            }
        }
    }
]

async def get_ai_response_stream(messages: list):
    client = get_openai_client()
    if not client:
        logger.warning("OPENAI_API_KEY not set. Cannot proceed with AI request.")
        yield {"data": "Error: OPENAI_API_KEY is not set. Please add it to your .env file to enable AI responses."}
        return

    # Ensure system prompt is the first message
    if not messages or messages[0].get("role") != "system":
        messages.insert(0, {"role": "system", "content": SYSTEM_PROMPT})
    
    logger.info(f"Full Message History sent to OpenAI: {json.dumps(messages, indent=2)}")

    try:
        # Initial non-streaming call to determine if tools are needed
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            tools=tools,
            tool_choice="auto"
        )
        logger.info(f"Raw OpenAI Initial Response: {response.model_dump_json(indent=2)}")
        
        response_message = response.choices[0].message
        
        if response_message.tool_calls:
            # Append the assistant's tool call message
            messages.append({
                "role": "assistant",
                "content": response_message.content,
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": tc.type,
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments
                        }
                    } for tc in response_message.tool_calls
                ]
            })
            
            for tool_call in response_message.tool_calls:
                if tool_call.function.name == "get_crypto_data":
                    args = json.loads(tool_call.function.arguments)
                    symbol = args.get("symbol", "btc")
                    
                    try:
                        data = await fetch_crypto_data(symbol)
                        tool_response = json.dumps(data)
                    except Exception as e:
                        logger.error(f"Finance Tool Error: {str(e)}")
                        tool_response = json.dumps({"error": str(e)})
                        
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "name": "get_crypto_data",
                        "content": tool_response
                    })
            
            logger.info(f"Updated messages with tool outputs: {json.dumps(messages, indent=2)}")
                    
            # Now get the final streaming response with the tool data included
            stream = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                stream=True
            )
            
            full_assistant_reply = ""
            async for chunk in stream:
                content = chunk.choices[0].delta.content
                if content is not None:
                    # Clean content for consistent rendering
                    clean_content = content.replace("\r", "")
                    full_assistant_reply += clean_content
                    yield {"data": clean_content}
            
            logger.info(f"Final AI Streaming Reply: {full_assistant_reply}")
        else:
            # If no tool was called, we can simulate streaming the already generated content
            content = (response_message.content or "").replace("\r", "")
            logger.info(f"AI Response (No tool call): {content}")
            
            chunk_size = 12
            for i in range(0, len(content), chunk_size):
                chunk = content[i:i+chunk_size]
                yield {"data": chunk}
                # Speed up simulation if we detect we are in/near a JSON block
                if "{" not in content or i < content.find("{"):
                   await asyncio.sleep(0.01)
    except Exception as e:
        logger.error(f"OpenAI API Error: {str(e)}")
        yield {"data": f"Error from OpenAI: {str(e)}"}

async def get_ai_response_full(messages: list):
    """
    Same functionality as get_ai_response_stream, but it gets the whole 
    response from the AI and puts it all at once to the chat bubble.
    """
    client = get_openai_client()
    if not client:
        logger.warning("OPENAI_API_KEY not set. Cannot proceed with AI request.")
        yield {"data": "Error: OPENAI_API_KEY is not set. Please add it to your .env file to enable AI responses."}
        return

    # Ensure system prompt is the first message
    if not messages or messages[0].get("role") != "system":
        messages.insert(0, {"role": "system", "content": SYSTEM_PROMPT})
    
    logger.info(f"Full Message History sent to OpenAI (Full mode): {json.dumps(messages, indent=2)}")

    try:
        # Step 1: Initial call to determine if tools are needed
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            tools=tools,
            tool_choice="auto",
            stream=False
        )
        logger.info(f"Raw OpenAI Initial Response (Full mode): {response.model_dump_json(indent=2)}")
        
        response_message = response.choices[0].message
        
        if response_message.tool_calls:
            # Append the assistant's tool call message
            messages.append({
                "role": "assistant",
                "content": response_message.content,
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": tc.type,
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments
                        }
                    } for tc in response_message.tool_calls
                ]
            })
            
            for tool_call in response_message.tool_calls:
                if tool_call.function.name == "get_crypto_data":
                    args = json.loads(tool_call.function.arguments)
                    symbol = args.get("symbol", "btc")
                    
                    try:
                        data = await fetch_crypto_data(symbol)
                        tool_response = json.dumps(data)
                    except Exception as e:
                        logger.error(f"Finance Tool Error: {str(e)}")
                        tool_response = json.dumps({"error": str(e)})
                        
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "name": "get_crypto_data",
                        "content": tool_response
                    })
            
            logger.info(f"Updated messages with tool outputs (Full mode): {json.dumps(messages, indent=2)}")
                    
            # Step 2: Final non-streaming call to get the entire answer
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                stream=False
            )
            final_content = response.choices[0].message.content or ""
            logger.info(f"Final AI Reply (At-Once): {final_content}")
            
            # Yield everything at once, cleaning \r
            yield {"data": final_content.replace("\r", "")}
        else:
            # If no tool was called, yield the already generated content
            final_content = response_message.content or ""
            logger.info(f"AI Response (No tool call, Full mode): {final_content}")
            yield {"data": final_content.replace("\r", "")}
            
    except Exception as e:
        logger.error(f"OpenAI API Error (Full mode): {str(e)}")
        yield {"data": f"Error from OpenAI: {str(e)}"}
