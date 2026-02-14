import os
import requests
import json
import logging

logger = logging.getLogger(__name__)

def send_telegram_message(message):
    """
    Send a message to the configured Telegram chat.
    """
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    chat_id = os.getenv("TELEGRAM_CHAT_ID")

    if not bot_token or not chat_id:
        logger.warning("⚠️ Telegram credentials not found in env. Skipping Telegram notification.")
        return

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "Markdown"
    }

    try:
        response = requests.post(url, json=payload, timeout=10)
        if response.status_code == 200:
            logger.info("✅ Telegram message sent successfully.")
        else:
            logger.error(f"❌ Failed to send Telegram message: {response.text}")
    except Exception as e:
        logger.error(f"❌ Exception sending Telegram message: {e}")


def send_discord_message(message):
    """
    Send a message to the configured Discord webhook.
    """
    webhook_url = os.getenv("DISCORD_WEBHOOK_URL")

    if not webhook_url:
        logger.warning("⚠️ Discord webhook URL not found in env. Skipping Discord notification.")
        return

    payload = {
        "content": message
    }

    try:
        response = requests.post(webhook_url, json=payload, timeout=10)
        if 200 <= response.status_code < 300:
            logger.info("✅ Discord message sent successfully.")
        else:
            logger.error(f"❌ Failed to send Discord message: {response.text}")
    except Exception as e:
        logger.error(f"❌ Exception sending Discord message: {e}")


def send_notifications(decision_data):
    """
    Format decision data and send to both Telegram and Discord.
    """
    if not decision_data:
        return

    timestamp = decision_data.get("timestamp", "N/A")
    summary = decision_data.get("analysis_summary", {})
    summary_cn = summary.get("zh", "无中文摘要")
    actions = decision_data.get("actions", [])

    # Format the message
    lines = [
        f"🤖 **Dolores AI Trading Update**",
        f"🕒 Time: `{timestamp}`",
        f"",
        f"📋 **Market Analysis**:",
        f"{summary_cn}",
        f"",
        f"⚡ **Actions ({len(actions)})**:"
    ]

    if not actions:
        lines.append("_No actions taken this cycle._")
    else:
        for act in actions:
            symbol = act.get("symbol")
            action = act.get("action")
            reason = act.get("reason", "No reason provided")
            
            # Try to get Chinese reason if available (nested structure)
            if isinstance(reason, dict):
                reason = reason.get("zh", reason.get("en", "No reason provided"))
            
            icon = "HOLD"
            if "buy" in action.lower() or "long" in action.lower(): icon = "🟢 BUY/LONG"
            elif "sell" in action.lower() or "short" in action.lower(): icon = "🔴 SELL/SHORT"
            elif "close" in action.lower(): icon = "🚫 CLOSE"
            
            lines.append(f"- {icon} **{symbol}**: {action}")
            lines.append(f"  _Reason: {reason}_")

    message = "\n".join(lines)

    # Send to platforms
    send_telegram_message(message)
    send_discord_message(message)

if __name__ == "__main__":
    # Test
    from dotenv import load_dotenv
    load_dotenv()
    test_data = {
        "timestamp": "2026-02-14 12:00:00",
        "analysis_summary": {"zh": "Test message. 市场情绪稳定。"},
        "actions": [{"symbol": "BTC", "action": "hold", "reason": "Testing notifier"}]
    }
    send_notifications(test_data)
