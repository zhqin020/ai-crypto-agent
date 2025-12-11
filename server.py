
from flask import Flask, jsonify, request
import json
import csv
import os
from pathlib import Path
from datetime import datetime

app = Flask(__name__)

BASE_DIR = Path(__file__).parent
PORTFOLIO_PATH = BASE_DIR / "portfolio_state.json"
TRADE_LOG_PATH = BASE_DIR / "trade_log.csv"
AGENT_LOG_PATH = BASE_DIR / "agent_decision_log.json"
NAV_HISTORY_PATH = BASE_DIR / "nav_history.csv"

# Map symbols to names (optional)
COIN_NAMES = {
    "BTC": "Bitcoin",
    "ETH": "Ethereum",
    "SOL": "Solana",
    "BNB": "BNB",
    "DOGE": "Dogecoin"
}

@app.route('/api/agent-decision', methods=['GET'])
def get_agent_decision():
    if not AGENT_LOG_PATH.exists():
        return jsonify({"analysis_summary": "暂无决策记录", "actions": []})
        
    try:
        with open(AGENT_LOG_PATH, 'r') as f:
            data = json.load(f)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
    return response

@app.after_request
def after_request(response):
    return add_cors_headers(response)

@app.route('/api/positions', methods=['GET'])
def get_positions():
    if not PORTFOLIO_PATH.exists():
        return jsonify([])

    try:
        with open(PORTFOLIO_PATH, 'r') as f:
            state = json.load(f)
        
        positions = []
        for pos in state.get("positions", []):
            symbol = pos["symbol"]
            entry_price = pos["entry_price"]
            current_price = pos["current_price"]
            quantity = pos["quantity"]
            
            # Calculate PnL
            if pos["side"] == "long":
                pnl = (current_price - entry_price) * quantity
                pnl_percent = ((current_price - entry_price) / entry_price) * 100
            else:
                pnl = (entry_price - current_price) * quantity
                pnl_percent = ((entry_price - current_price) / entry_price) * 100

            positions.append({
                "symbol": symbol,
                "name": COIN_NAMES.get(symbol, symbol),
                "entryPrice": entry_price,
                "currentPrice": current_price,
                "stopLoss": pos["exit_plan"]["stop_loss"],
                "takeProfit": pos["exit_plan"]["take_profit"],
                "amount": round(quantity, 4),
                "pnl": round(pnl, 2),
                "pnlPercent": round(pnl_percent, 2),
                "type": pos["side"],
                "leverage": pos.get("leverage", 1)
            })
            
        return jsonify(positions)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/history', methods=['GET'])
def get_history():
    if not TRADE_LOG_PATH.exists():
        return jsonify([])

    try:
        history = []
        open_positions = {} # Key: symbol, Value: {entry_time, entry_price, qty, margin, notional, leverage}

        with open(TRADE_LOG_PATH, 'r') as f:
            reader = csv.DictReader(f)
            # Sort by time just in case, though usually appended in order
            rows = list(reader)
            
            for row in rows:
                action = row.get('action')
                symbol = row.get('symbol')
                time = row.get('time')
                price = float(row.get('price', 0))
                qty = float(row.get('qty', 0))
                notional = float(row.get('notional', 0) or 0)
                margin = float(row.get('margin', 0) or 0)
                leverage_val = row.get('leverage')
                
                if action in ['open_long', 'open_short']:
                    # Calculate leverage if not present
                    if not leverage_val and margin > 0:
                        calc_leverage = notional / margin
                    else:
                        calc_leverage = float(leverage_val) if leverage_val else 1.0

                    open_positions[symbol] = {
                        'entry_time': time,
                        'entry_price': price,
                        'qty': qty,
                        'margin': margin,
                        'notional': notional,
                        'leverage': calc_leverage
                    }
                
                elif action == 'close_position':
                    # Parse realized PnL and fee
                    realized_pnl = float(row.get('realized_pnl', 0))
                    fee = float(row.get('fee', 0))
                    # Raw PnL usually includes fee in some logs, but let's stick to simple logic matching frontend
                    # Frontend logic: rawPnl = realized_pnl + fee (if fee is negative impact? usually fee is positive cost)
                    # Let's just use realized_pnl as the net profit for display
                    
                    open_info = open_positions.pop(symbol, None)
                    
                    entry_price = 0
                    entry_time = 'Unknown'
                    leverage = 1.0
                    
                    if open_info:
                        entry_price = open_info['entry_price']
                        entry_time = open_info['entry_time']
                        leverage = open_info['leverage']
                    else:
                        # Estimate entry from PnL if open record missing
                        # This is an approximation
                        pass

                    pnl_percent = 0
                    if margin > 0:
                        pnl_percent = (realized_pnl / margin) * 100
                    elif open_info and open_info['margin'] > 0:
                         pnl_percent = (realized_pnl / open_info['margin']) * 100
                    
                    history.append({
                        "id": f"{time}-{symbol}",
                        "symbol": symbol,
                        "type": row.get('side', 'long'),
                        "entryPrice": entry_price,
                        "exitPrice": price,
                        "amount": qty,
                        "pnl": realized_pnl,
                        "pnlPercent": pnl_percent,
                        "entryTime": entry_time,
                        "exitTime": time,
                        "leverage": leverage,
                        "notional": notional
                    })

        # Return history sorted by exit time descending (newest first)
        history.sort(key=lambda x: x['exitTime'], reverse=True)
        return jsonify(history)
    except Exception as e:
        print(f"Error parsing history: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/portfolio', methods=['GET'])
def get_portfolio():
    if not PORTFOLIO_PATH.exists():
        return jsonify({"nav": 0, "cash": 0})
        
    try:
        with open(PORTFOLIO_PATH, 'r') as f:
            state = json.load(f)
        return jsonify({
            "total_value": state.get("nav", 0),
            "cash": state.get("cash", 0)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/summary', methods=['GET'])
def get_summary():
    # Return total NAV and PnL
    if not PORTFOLIO_PATH.exists():
        return jsonify({"nav": 10000, "pnl": 0, "startTime": "2024-11-15 00:00:00"})
        
    with open(PORTFOLIO_PATH, 'r') as f:
        state = json.load(f)
        
    nav = state.get("nav", 10000)
    initial_nav = 10000 # Hardcoded for now
    total_pnl = nav - initial_nav
    
    # Get start time from nav_history.csv
    start_time_str = "2024-11-15 00:00:00"
    if NAV_HISTORY_PATH.exists():
        try:
            with open(NAV_HISTORY_PATH, 'r') as f:
                # Skip header
                header = next(f, None)
                if header:
                    first_line = next(f, None)
                    if first_line:
                        # Format: timestamp,nav
                        start_time_str = first_line.strip().split(',')[0]
        except Exception as e:
            print(f"Error reading start time: {e}")
    
    return jsonify({
        "nav": round(nav, 2),
        "totalPnl": round(total_pnl, 2),
        "pnlPercent": round((total_pnl / initial_nav) * 100, 2),
        "startTime": start_time_str
    })

@app.route('/api/nav-history', methods=['GET'])
def get_nav_history():
    NAV_HISTORY_PATH = BASE_DIR / "nav_history.csv"
    if not NAV_HISTORY_PATH.exists():
        return jsonify([])

    try:
        history = []
        with open(NAV_HISTORY_PATH, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                history.append({
                    "timestamp": row["timestamp"],
                    "nav": float(row["nav"])
                })
        return jsonify(history)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting CryptoQuant API Server on port 5001...")
    app.run(host='0.0.0.0', port=5001, debug=True)
