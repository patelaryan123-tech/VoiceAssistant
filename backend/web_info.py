"""
web_info.py — Web & Information features for the Voice Assistant
Handles: Weather, Web Search, Wikipedia, Calculator, Currency, Timer, News
Uses only free APIs — no API keys required.
"""

import re
import math
import webbrowser
import threading
import asyncio
import urllib.request
import urllib.parse
import json
from datetime import datetime


# ---------------------------------------------------------------------------
# WEATHER  (Open-Meteo — completely free, no key)
# ---------------------------------------------------------------------------

WEATHER_CODES = {
    0: "Clear sky ☀️",
    1: "Mainly clear 🌤️", 2: "Partly cloudy ⛅", 3: "Overcast ☁️",
    45: "Foggy 🌫️", 48: "Icy fog 🌫️",
    51: "Light drizzle 🌦️", 53: "Drizzle 🌦️", 55: "Heavy drizzle 🌧️",
    61: "Light rain 🌧️", 63: "Rain 🌧️", 65: "Heavy rain 🌧️",
    71: "Light snow ❄️", 73: "Snow ❄️", 75: "Heavy snow ❄️",
    80: "Rain showers 🌦️", 81: "Heavy showers 🌧️", 82: "Violent showers 🌩️",
    95: "Thunderstorm ⛈️", 96: "Thunderstorm with hail ⛈️",
}

def _http_get(url: str, timeout=8) -> dict | None:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "VoiceAssistant/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        print(f"[web_info] HTTP error: {e}")
        return None


def get_weather(city: str = "auto") -> dict:
    """
    Get current weather for a city name.
    Uses Open-Meteo (free, no key) + Nominatim geocoding.
    """
    try:
        if city == "auto" or not city:
            # Use a default fallback
            lat, lon, city_name = 28.6139, 77.2090, "New Delhi"
        else:
            # Geocode the city via Nominatim
            geo_url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(city)}&format=json&limit=1"
            geo_data = _http_get(geo_url)
            if not geo_data:
                return {"success": False, "text": f"Could not find location: {city}"}
            lat = float(geo_data[0]["lat"])
            lon = float(geo_data[0]["lon"])
            city_name = geo_data[0].get("display_name", city).split(",")[0]

        # Fetch weather
        wx_url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={lat}&longitude={lon}"
            f"&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code"
            f"&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto"
        )
        wx = _http_get(wx_url)
        if not wx:
            return {"success": False, "text": "Could not fetch weather data. Check your connection."}

        c = wx["current"]
        temp = c["temperature_2m"]
        humidity = c["relative_humidity_2m"]
        wind = c["wind_speed_10m"]
        code = c["weather_code"]
        condition = WEATHER_CODES.get(code, "Unknown")

        text = f"Weather in {city_name}: {condition}, {temp}°C, Humidity {humidity}%, Wind {wind} km/h"
        return {
            "success": True,
            "text": text,
            "data": {
                "city": city_name,
                "temp": temp,
                "humidity": humidity,
                "wind": wind,
                "condition": condition,
            }
        }
    except Exception as e:
        return {"success": False, "text": f"Weather error: {str(e)}"}


# ---------------------------------------------------------------------------
# WEB SEARCH
# ---------------------------------------------------------------------------

def web_search(query: str) -> dict:
    """Opens default browser with a Google search."""
    url = f"https://www.google.com/search?q={urllib.parse.quote(query)}"
    webbrowser.open(url)
    return {"success": True, "text": f"Searching Google for: {query}"}


# ---------------------------------------------------------------------------
# WIKIPEDIA
# ---------------------------------------------------------------------------

def wikipedia_lookup(query: str) -> dict:
    """Fetches a short Wikipedia summary using the Wikipedia REST API."""
    try:
        encoded = urllib.parse.quote(query.replace(" ", "_"))
        url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{encoded}"
        data = _http_get(url)
        if not data or "extract" not in data:
            return {"success": False, "text": f"No Wikipedia article found for: {query}"}

        title = data.get("title", query)
        extract = data["extract"]
        # Trim to ~3 sentences
        sentences = extract.split(". ")
        summary = ". ".join(sentences[:3]) + ("." if len(sentences) > 3 else "")
        return {"success": True, "text": f"{title}: {summary}"}
    except Exception as e:
        return {"success": False, "text": f"Wikipedia error: {str(e)}"}


# ---------------------------------------------------------------------------
# CALCULATOR
# ---------------------------------------------------------------------------

_SAFE_NAMES = {k: v for k, v in math.__dict__.items() if not k.startswith("_")}
_SAFE_NAMES["abs"] = abs
_SAFE_NAMES["round"] = round

def calculate(expression: str) -> dict:
    """Safely evaluates a math expression."""
    try:
        # Normalize natural language
        expr = expression.lower()
        expr = expr.replace("x", "*").replace("×", "*").replace("÷", "/")
        expr = expr.replace("plus", "+").replace("minus", "-")
        expr = expr.replace("times", "*").replace("divided by", "/")
        expr = expr.replace("^", "**")
        # Remove unsafe chars
        expr = re.sub(r"[^0-9+\-*/().% ]", "", expr)
        result = eval(expr, {"__builtins__": {}}, _SAFE_NAMES)  # noqa: S307
        return {"success": True, "text": f"Result: {expression} = {result}"}
    except Exception:
        return {"success": False, "text": f"Could not calculate: {expression}"}


# ---------------------------------------------------------------------------
# CURRENCY CONVERSION  (exchangerate.host — free, no key)
# ---------------------------------------------------------------------------

def convert_currency(amount: float, from_cur: str, to_cur: str) -> dict:
    """Converts currency using the free exchangerate.host API."""
    try:
        from_cur = from_cur.upper()
        to_cur = to_cur.upper()
        url = f"https://api.exchangerate.host/convert?from={from_cur}&to={to_cur}&amount={amount}"
        data = _http_get(url)
        if not data or not data.get("success"):
            # Fallback: try frankfurter.app
            url2 = f"https://api.frankfurter.app/latest?amount={amount}&from={from_cur}&to={to_cur}"
            data2 = _http_get(url2)
            if data2 and "rates" in data2:
                result = data2["rates"].get(to_cur)
                if result:
                    return {"success": True, "text": f"{amount} {from_cur} = {result:.2f} {to_cur}"}
            return {"success": False, "text": f"Could not convert {from_cur} to {to_cur}. Check currency codes."}

        result = data.get("result")
        return {"success": True, "text": f"{amount} {from_cur} = {result:.2f} {to_cur}"}
    except Exception as e:
        return {"success": False, "text": f"Currency error: {str(e)}"}


# ---------------------------------------------------------------------------
# TIMER
# ---------------------------------------------------------------------------

_active_timers: dict[str, threading.Timer] = {}

def set_timer(seconds: int, label: str, callback) -> dict:
    """
    Sets a non-blocking timer. When it fires, `callback(label)` is called.
    The callback should be an asyncio coroutine launcher.
    """
    timer_id = f"timer_{label}_{seconds}"
    # Cancel existing timer with same id
    if timer_id in _active_timers:
        _active_timers[timer_id].cancel()

    def _fire():
        callback(label, seconds)
        _active_timers.pop(timer_id, None)

    t = threading.Timer(seconds, _fire)
    t.daemon = True
    t.start()
    _active_timers[timer_id] = t

    mins, secs = divmod(seconds, 60)
    if mins > 0:
        time_str = f"{mins} minute{'s' if mins > 1 else ''}" + (f" {secs} seconds" if secs else "")
    else:
        time_str = f"{secs} second{'s' if secs > 1 else ''}"

    return {"success": True, "text": f"Timer set for {time_str}! I'll notify you when done. ⏱️"}


def parse_timer_duration(text: str) -> int | None:
    """Parses '5 minutes', '30 seconds', '1 hour 30 minutes', etc. into seconds."""
    total = 0
    matches = re.findall(r"(\d+)\s*(hour|minute|min|second|sec)s?", text.lower())
    if not matches:
        return None
    for val, unit in matches:
        val = int(val)
        if "hour" in unit:
            total += val * 3600
        elif "min" in unit:
            total += val * 60
        else:
            total += val
    return total if total > 0 else None


# ---------------------------------------------------------------------------
# NEWS  (Google News RSS — no key)
# ---------------------------------------------------------------------------

def get_news(topic: str = "") -> dict:
    """Fetches top headlines from Google News RSS (no key required)."""
    try:
        import xml.etree.ElementTree as ET
        if topic:
            url = f"https://news.google.com/rss/search?q={urllib.parse.quote(topic)}&hl=en-IN&gl=IN&ceid=IN:en"
        else:
            url = "https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en"

        req = urllib.request.Request(url, headers={"User-Agent": "VoiceAssistant/1.0"})
        with urllib.request.urlopen(req, timeout=8) as resp:
            content = resp.read()

        root = ET.fromstring(content)
        items = root.findall(".//item")[:5]

        headlines = []
        for item in items:
            title = item.findtext("title", "").split(" - ")[0].strip()
            headlines.append(title)

        if not headlines:
            return {"success": False, "text": "No news found."}

        text = "Top headlines:\n" + "\n".join(f"{i+1}. {h}" for i, h in enumerate(headlines))
        return {"success": True, "text": text, "data": headlines}
    except Exception as e:
        return {"success": False, "text": f"News error: {str(e)}"}


# ---------------------------------------------------------------------------
# STOCK & CRYPTO TRACKER  (Yahoo Finance v8 — free, no key)
# ---------------------------------------------------------------------------

# Map common names/symbols to Yahoo Finance tickers
_TICKER_MAP = {
    "bitcoin": "BTC-USD", "btc": "BTC-USD",
    "ethereum": "ETH-USD", "eth": "ETH-USD",
    "dogecoin": "DOGE-USD", "doge": "DOGE-USD",
    "ripple": "XRP-USD", "xrp": "XRP-USD",
    "solana": "SOL-USD", "sol": "SOL-USD",
    "apple": "AAPL", "aapl": "AAPL",
    "google": "GOOGL", "alphabet": "GOOGL", "googl": "GOOGL",
    "microsoft": "MSFT", "msft": "MSFT",
    "tesla": "TSLA", "tsla": "TSLA",
    "amazon": "AMZN", "amzn": "AMZN",
    "meta": "META", "facebook": "META",
    "nvidia": "NVDA", "nvda": "NVDA",
    "netflix": "NFLX", "nflx": "NFLX",
    "tata": "TCS.NS", "tcs": "TCS.NS",
    "infosys": "INFY", "infy": "INFY",
    "reliance": "RELIANCE.NS",
    "sensex": "^BSESN", "nifty": "^NSEI",
    "gold": "GC=F", "silver": "SI=F", "oil": "CL=F",
}


def get_stock(query: str) -> dict:
    """Fetches live price for stocks and cryptocurrencies via Yahoo Finance."""
    try:
        q = query.lower().strip()
        ticker = _TICKER_MAP.get(q, q.upper())

        url = (
            f"https://query1.finance.yahoo.com/v8/finance/chart/{urllib.parse.quote(ticker)}"
            f"?interval=1m&range=1d"
        )
        data = _http_get(url)
        if not data:
            return {"success": False, "text": f"Could not fetch data for '{query}'. Check the name/ticker."}

        result = data.get("chart", {}).get("result", [])
        if not result:
            error = data.get("chart", {}).get("error", {})
            return {"success": False, "text": f"No data for '{ticker}': {error.get('description', 'Unknown error')}"}

        meta = result[0].get("meta", {})
        price = meta.get("regularMarketPrice", 0)
        prev_close = meta.get("chartPreviousClose", meta.get("previousClose", price))
        currency = meta.get("currency", "USD")
        name = meta.get("shortName", meta.get("longName", ticker))
        exchange = meta.get("exchangeName", "")

        change = price - prev_close
        change_pct = (change / prev_close * 100) if prev_close else 0
        arrow = "↗" if change >= 0 else "↘"
        sign = "+" if change >= 0 else ""

        # Format price nicely
        if price < 0.01:
            price_str = f"{price:.6f}"
        elif price < 1:
            price_str = f"{price:.4f}"
        elif price > 10000:
            price_str = f"{price:,.0f}"
        else:
            price_str = f"{price:,.2f}"

        text = (
            f"{arrow} {name}: {currency} {price_str} "
            f"({sign}{change_pct:.2f}% today)"
        )

        return {
            "success": True,
            "text": text,
            "data": {
                "ticker": ticker,
                "name": name,
                "price": price,
                "price_str": price_str,
                "currency": currency,
                "change": round(change, 4),
                "change_pct": round(change_pct, 2),
                "arrow": arrow,
                "exchange": exchange,
            },
        }
    except Exception as e:
        return {"success": False, "text": f"Stock error: {str(e)}"}


# ---------------------------------------------------------------------------
# REAL-TIME TRANSLATION  (MyMemory API — completely free, no key required)
# ---------------------------------------------------------------------------

LANGUAGE_CODES = {
    "hindi": "hi", "english": "en", "french": "fr", "spanish": "es",
    "german": "de", "italian": "it", "portuguese": "pt", "arabic": "ar",
    "chinese": "zh", "japanese": "ja", "korean": "ko", "russian": "ru",
    "dutch": "nl", "swedish": "sv", "turkish": "tr", "polish": "pl",
    "bengali": "bn", "tamil": "ta", "telugu": "te", "marathi": "mr",
    "gujarati": "gu", "punjabi": "pa", "urdu": "ur",
}


def translate_text(text: str, target_lang: str, source_lang: str = "auto") -> dict:
    """
    Translates text using MyMemory free API (no key, up to 5000 chars/day).
    Falls back to a simple approach using Google Translate URL.
    """
    try:
        # Resolve language name to code
        lang_code = LANGUAGE_CODES.get(target_lang.lower(), target_lang.lower()[:2])
        langpair = f"en|{lang_code}" if source_lang == "auto" else f"{source_lang}|{lang_code}"

        encoded_text = urllib.parse.quote(text[:500])  # MyMemory limit
        url = f"https://api.mymemory.translated.net/get?q={encoded_text}&langpair={langpair}"

        data = _http_get(url)
        if not data or data.get("responseStatus") != 200:
            return {"success": False, "text": "Translation failed. Check language name or try again."}

        translated = data["responseData"]["translatedText"]
        quality = data["responseData"].get("match", 0)

        return {
            "success": True,
            "text": f"🌐 Translation to {target_lang.title()}: {translated}",
            "data": {
                "original": text,
                "translated": translated,
                "target_lang": target_lang.title(),
                "lang_code": lang_code,
                "quality": quality,
            },
        }
    except Exception as e:
        return {"success": False, "text": f"Translation error: {str(e)}"}


# ---------------------------------------------------------------------------
# MORNING BRIEFING  (Compiles weather + news + reminders + battery + time)
# ---------------------------------------------------------------------------

def get_morning_briefing(city: str = "New Delhi") -> dict:
    """
    Generates a JARVIS-style morning briefing combining:
    time, weather, top 3 news headlines, and active reminders.
    """
    import system_ops
    import reminder_store

    sections = []
    cards = {}

    # 1. Greeting + Time
    now = datetime.now()
    hour = now.hour
    if hour < 12:
        greeting = "Good morning"
    elif hour < 17:
        greeting = "Good afternoon"
    else:
        greeting = "Good evening"

    time_str = now.strftime("%I:%M %p")
    date_str = now.strftime("%A, %B %d, %Y")
    sections.append(f"{greeting}! It's {time_str} on {date_str}.")

    # 2. Battery
    battery = system_ops.get_battery()
    if battery["success"]:
        sections.append(battery["text"])

    # 3. Weather
    weather = get_weather(city)
    if weather["success"]:
        sections.append(weather["text"])
        cards["weather"] = weather.get("data")

    # 4. Top 3 news
    news = get_news()
    if news["success"] and news.get("data"):
        headlines = news["data"][:3]
        sections.append("Top headlines: " + ". ".join(f"{i+1}. {h}" for i, h in enumerate(headlines)))
        cards["news"] = headlines

    # 5. Active reminders
    reminders = reminder_store.list_reminders()
    if reminders["success"] and reminders.get("data"):
        r_list = reminders["data"]
        r_text = "You have " + ", ".join(f"{r['label']} at {r['due']}" for r in r_list[:3])
        sections.append(r_text)
        cards["reminders"] = r_list

    full_text = " ".join(sections)
    cards["greeting"] = greeting
    cards["time"] = time_str
    cards["date"] = date_str
    cards["city"] = city

    return {
        "success": True,
        "text": full_text,
        "data": cards,
    }
