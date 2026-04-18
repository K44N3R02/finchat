import httpx
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

COINGECKO_API_URL = "https://api.coingecko.com/api/v3"

def get_coingecko_id(symbol: str) -> str:
    """
    Maps common cryptocurrency symbols to CoinGecko IDs.
    """
    symbol_map = {
        "btc": "bitcoin",
        "eth": "ethereum",
        "sol": "solana",
        "usdt": "tether",
        "bnb": "binancecoin",
        "xrp": "ripple",
        "usdc": "usd-coin",
        "ada": "cardano",
        "avax": "avalanche-2",
        "doge": "dogecoin",
        "dot": "polkadot",
        "matic": "matic-network",
        "link": "chainlink"
    }
    return symbol_map.get(symbol.lower(), symbol.lower())

async def fetch_crypto_data(symbol: str) -> Dict[str, Any]:
    """
    Fetches the current price and 7-day historical market chart for a given cryptocurrency.
    """
    coin_id = get_coingecko_id(symbol)
    
    async with httpx.AsyncClient() as client:
        # Fetch current price
        price_url = f"{COINGECKO_API_URL}/simple/price?ids={coin_id}&vs_currencies=usd"
        price_response = await client.get(price_url)
        price_data = price_response.json()
        logger.info(f"Raw CoinGecko Price Response for '{symbol}': {price_data}")
        
        # Fetch 7-day market chart (prices, market caps, total volumes)
        chart_url = f"{COINGECKO_API_URL}/coins/{coin_id}/market_chart?vs_currency=usd&days=7"
        chart_response = await client.get(chart_url)
        chart_data = chart_response.json()
        logger.info(f"Raw CoinGecko Chart Response for '{symbol}': {chart_data}")
        
        # Format the historical data to just [timestamp, price] pairs
        historical_prices = chart_data.get("prices", [])
        
        return {
            "symbol": symbol.upper(),
            "name": coin_id.capitalize(),
            "current_price_usd": price_data.get(coin_id, {}).get("usd"),
            "historical_data_7d": historical_prices
        }
