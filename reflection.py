import pandas as pd
import json
from pathlib import Path
from datetime import datetime, timedelta

BASE_DIR = Path(__file__).resolve().parent

def get_reflection_context(limit=5):
    """
    Analyzes past trades and provides historical indicators to help AI learn.
    """
    trade_log_path = BASE_DIR / "trade_log.csv"
    decision_log_path = BASE_DIR / "agent_decision_log.json"
    
    if not trade_log_path.exists():
        return "No trade history available."
        
    try:
        # 1. Load Data
        df = pd.read_csv(trade_log_path)
        if df.empty:
            return "Trade history is empty."
            
        decision_history = []
        if decision_log_path.exists():
            with open(decision_log_path, "r") as f:
                decision_history = json.load(f)

        # 2. Process Recent Trades
        # Note: trade_log might not have exit_time, using timestamp (first column)
        df.columns = [c.strip() for c in df.columns]
        time_col = df.columns[0]
        df[time_col] = pd.to_datetime(df[time_col])
        df = df.sort_values(time_col, ascending=False)
        
        recent = df.head(limit)
        reflection_text = "🔎 **DETAILED HISTORICAL REFLECTION (METRICS INCLUDED):**\n"
        
        wins = 0
        total_pnl = 0.0
        
        for _, row in recent.iterrows():
            symbol = row.get('symbol', 'UNKNOWN')
            pnl = float(row.get('pnl', 0))
            side = row.get('side', 'N/A')
            exit_reason = row.get('exit_reason', 'N/A')
            trade_time = row[time_col]
            
            total_pnl += pnl
            if pnl > 0: wins += 1
            
            # Find matching decision context
            context_str = ""
            for dec in decision_history:
                dec_time = pd.to_datetime(dec.get("timestamp"))
                # If decision happened within 1 hour before the trade
                if dec_time <= trade_time and (trade_time - dec_time) < timedelta(hours=1):
                    # Try to get indicators
                    inds = dec.get("market_indicators_at_time", {}).get(symbol, {})
                    if inds:
                        # Extract key metrics
                        rsi = inds.get("rsi_14") or inds.get("rsi")
                        qlib = inds.get("qlib_score") or inds.get("score")
                        funding = inds.get("funding_rate")
                        context_str = f" [Context at entry: RSI={rsi}, Qlib={qlib}, Funding={funding}]"
                    else:
                        # Fallback: check entry_reason if it mentioned symbols
                        for act in dec.get("actions", []):
                            if act.get("symbol") == symbol:
                                reason = act.get("entry_reason", {}).get("zh", "")
                                context_str = f" [Note: {reason[:100]}...]"
                    break
            
            outcome = "✅ WIN" if pnl > 0 else "❌ LOSS"
            reflection_text += f"- {symbol} ({side}): {outcome} ${pnl:.2f}. Exit: {exit_reason}.{context_str}\n"

        win_rate = (wins / len(recent)) * 100
        reflection_text += f"\n📊 **Stats (Last {len(recent)}):** Win Rate {win_rate:.0f}%, Net PnL ${total_pnl:.2f}\n"

        if total_pnl < 0:
            reflection_text += "\n⚠️ **CRITICAL INSTRUCTION:** Your recent trades with these indicators led to LOSSES. Identify the common pattern (e.g., buying high RSI or low Qlib) and adjust your aggression."
        else:
            reflection_text += "\n✅ **INSTRUCTION:** Patterns are working. Continue to verify signals but don't ignore risk levels."

        return reflection_text
        
    except Exception as e:
        return f"Reflection analysis failed: {e}"

if __name__ == "__main__":
    print(get_reflection_context())
