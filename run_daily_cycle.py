"""
Daily Trading Cycle Orchestrator
Runs the full pipeline: Data -> Signals -> Qlib -> News -> Agent -> Decision
"""
import os
import sys
import time
import subprocess
from datetime import datetime
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent
LOG_FILE = BASE_DIR / "trading_cycle.log"

def log(message):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    msg = f"[{timestamp}] {message}"
    print(msg)
    with open(LOG_FILE, "a") as f:
        f.write(msg + "\n")

def run_script(script_name, description):
    log(f"🚀 Starting: {description} ({script_name})...")
    start_time = time.time()
    
    try:
        # Run script as a subprocess to ensure clean state
        result = subprocess.run(
            [sys.executable, script_name],
            cwd=BASE_DIR,
            capture_output=True,
            text=True
        )
        
        duration = time.time() - start_time
        
        if result.returncode == 0:
            log(f"✅ Completed: {description} in {duration:.2f}s")
            # Optional: Log stdout if needed, or just keep it clean
            # log(f"Output:\n{result.stdout}")
            return True
        else:
            log(f"❌ Failed: {description}")
            log(f"Error Output:\n{result.stderr}")
            return False
            
    except Exception as e:
        log(f"❌ Exception running {script_name}: {e}")
        return False

def check_data_freshness():
    """Verify that CSV data is fresh (within 12 hours)"""
    log("🔍 Verifying data freshness...")
    csv_dir = BASE_DIR / "csv_data"
    fresh_count = 0
    stale_count = 0
    
    # Check key coins
    key_coins = ["BTC_4h.csv", "ETH_4h.csv", "DOGE_4h.csv"]
    
    for filename in key_coins:
        path = csv_dir / filename
        if not path.exists():
            log(f"❌ Missing data file: {filename}")
            stale_count += 1
            continue
            
        try:
            # Read last few lines to get date
            import pandas as pd
            df = pd.read_csv(path)
            if 'date' not in df.columns:
                log(f"❌ No date column in {filename}")
                stale_count += 1
                continue
                
            last_date_str = df['date'].max()
            # Handle timezone if present
            last_date = pd.to_datetime(last_date_str)
            if last_date.tzinfo is None:
                last_date = last_date.tz_localize('UTC')
            
            now = datetime.now(last_date.tzinfo)
            age = now - last_date
            
            if age.total_seconds() > 12 * 3600:
                log(f"❌ Stale data in {filename}: Last {last_date}, Age {age}")
                stale_count += 1
            else:
                log(f"✅ Fresh data in {filename}: Last {last_date}")
                fresh_count += 1
                
        except Exception as e:
            log(f"❌ Error checking {filename}: {e}")
            stale_count += 1
            
    if stale_count > 0:
        log(f"⛔ Data freshness check failed! {stale_count} stale/missing files.")
        return False
        
    log("✅ All key data files are fresh.")
    return True


def main():
    log("="*50)
    log("🤖 Starting New Trading Cycle")
    log("="*50)
    
    # 1. Fetch Market Data (OKX OHLCV + Sentiment)
    if not run_script("fetch_okx_data.py", "Fetch Market Data"):
        log("⛔ Stopping cycle due to data fetch failure.")
        sys.exit(1)

    # 1.5 Verify Data Freshness (Strict Check)
    if not check_data_freshness():
        log("⛔ Stopping cycle due to stale data.")
        sys.exit(1)

    # 2. Generate Technical Signals
    if not run_script("generate_multi_coin_signals.py", "Generate Signals"):
        log("⛔ Stopping cycle due to signal generation failure.")
        sys.exit(1)

    # 3. Prepare Data for Qlib (Format & Clean)
    if not run_script("prepare_multi_coin_qlib.py", "Prepare Qlib Data"):
        log("⛔ Stopping cycle due to Qlib preparation failure.")
        sys.exit(1)

    # 4. Run Qlib Inference (Predict Scores)
    # 3.5 Update Qlib BIN Data
    log("🔄 Updating Qlib BIN Data...")
    
    dump_bin_script = BASE_DIR / "dump_bin.py"
    
    if not dump_bin_script.exists():
        log(f"❌ dump_bin.py not found at {dump_bin_script}")
        sys.exit(1)

    bin_cmd = [
        sys.executable, str(dump_bin_script),
        "--csv_path", str(BASE_DIR / "qlib_data/multi_coin_features.csv"),
        "--qlib_dir", str(BASE_DIR / "qlib_data/bin_multi_coin"),
        "--symbol_field_name", "instrument",
        "--date_field_name", "datetime",
        "--include_fields", "open,high,low,close,volume,funding_rate,oi_change,funding_rate_zscore,oi_rsi,rsi_14,macd_hist,atr_14,bb_width_20,momentum_12,ret,future_4h_ret,future_24h_ret,rel_volume_20,price_position_20,natr_14,buy_stars,sell_stars,btc_corr_24h"
    ]
    
    try:
        subprocess.run(bin_cmd, check=True, capture_output=True)
        log("✅ Qlib BIN Data Updated")
    except subprocess.CalledProcessError as e:
        log(f"❌ Failed to update Qlib BIN: {e}")
        sys.exit(1)

    if not run_script("inference_qlib_model.py", "Qlib Inference"):
        log("⛔ Stopping cycle due to inference failure.")
        sys.exit(1)

    # 5. Fetch News & On-Chain Data
    if not run_script("fetch_onchain_and_news.py", "Fetch News & On-Chain"):
        log("⛔ Stopping cycle due to news fetch failure (Strict Mode).")
        sys.exit(1)

    # 6. Run Agent Decision
    if not run_script("DeepSeek_Agent.py", "Agent Decision"):
        log("❌ Agent failed to generate decision.")
        sys.exit(1)

    # 7. Execute Trades (Mock)
    if not run_script("mock_trade_executor.py", "Execute Trades (Mock)"):
        log("❌ Trade execution failed.")
        sys.exit(1)

    # 8. Sync Data to Frontend
    sync_frontend_data()

    log("="*50)
    log("🎉 Trading Cycle Completed Successfully")
    log("="*50)

def sync_frontend_data():
    """Copy latest data files to frontend public directory"""
    import shutil
    
    log("🔄 Syncing data to frontend...")
    
    frontend_data_dir = BASE_DIR / "frontpages/public/data"
    frontend_data_dir.mkdir(parents=True, exist_ok=True)
    
    files_to_sync = [
        "portfolio_state.json",
        "trade_log.csv",
        "nav_history.csv",
        "agent_decision_log.json"
    ]
    
    for filename in files_to_sync:
        src = BASE_DIR / filename
        dst = frontend_data_dir / filename
        
        if src.exists():
            try:
                shutil.copy2(src, dst)
                log(f"  ✅ Copied {filename}")
            except Exception as e:
                log(f"  ❌ Failed to copy {filename}: {e}")
        else:
            log(f"  ⚠️ Source file not found: {filename}")

if __name__ == "__main__":
    main()
