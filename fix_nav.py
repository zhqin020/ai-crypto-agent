
import pandas as pd
import sys

print("Starting fix_nav.py...")

try:
    # 1. Load Trade Log
    print("Loading trade_log.csv...")
    trades = pd.read_csv("trade_log.csv") # infer header
    print(f"Loaded {len(trades)} trades.")
    
    # Ensure time column is datetime
    # Use errors='coerce' to turn 'time' header repeats or garbage into NaT
    trades['time'] = pd.to_datetime(trades['time'], errors='coerce')
    trades = trades.dropna(subset=['time'])
    print(f"Valid trades: {len(trades)}")
    
    # 2. Extract Gap Events
    events = trades[trades['realized_pnl'] != 0].copy()
    mask = (events['time'] >= "2025-12-12") & (events['time'] < "2025-12-24")
    filtered_events = events[mask]
    
    print(f"Found {len(filtered_events)} relevant PnL events (Dec 12-24):")
    for _, row in filtered_events.iterrows():
        print(f"  {row['time']}: {row['realized_pnl']}")
        
    if len(filtered_events) == 0:
        print("Warning: No events found! Check dates in trade_log.csv.")
        
    # 3. Load NAV History
    print("Loading nav_history.csv...")
    # Read as strings first to manually handle header
    raw_nav = pd.read_csv("nav_history.csv", header=None, names=["time", "nav"], dtype=str)
    
    # Identify header row
    if raw_nav.iloc[0]['time'] == 'timestamp' or raw_nav.iloc[0]['nav'] == 'nav':
        print("Detected header row, dropping it.")
        raw_nav = raw_nav.iloc[1:]
        
    # Convert types
    raw_nav['time'] = pd.to_datetime(raw_nav['time'], errors='coerce')
    raw_nav['nav'] = pd.to_numeric(raw_nav['nav'], errors='coerce')
    nav_df = raw_nav.dropna().copy()
    
    print(f"Loaded {len(nav_df)} NAV points.")
    
    # 4. Generate New NAV Points
    # Base NAV calculation on the LAST KNOWN valid point before gap
    base_date = pd.Timestamp("2025-12-12 23:59:59")
    baseline_df = nav_df[nav_df['time'] <= base_date]
    if len(baseline_df) > 0:
        last_nav = baseline_df.iloc[-1]['nav']
        print(f"Baseline NAV at {baseline_df.iloc[-1]['time']}: {last_nav}")
    else:
        last_nav = 10000.0 # Fallback
        print("No baseline found, using default 10000.0")

    new_rows = []
    current_nav = last_nav
    
    for _, row in filtered_events.sort_values('time').iterrows():
        pnl = row['realized_pnl']
        current_nav += pnl
        new_row = {"time": row['time'], "nav": round(current_nav, 2)}
        new_rows.append(new_row)
        print(f"  Generated: {new_row['time']} -> {new_row['nav']}")
        
    # 5. Merge and Save
    new_df = pd.DataFrame(new_rows)
    if not new_df.empty:
        # Concatenate
        combined = pd.concat([nav_df, new_df])
        # Sort
        combined = combined.sort_values('time')
        # Drop duplicates at same timestamp (keep last updated)
        combined = combined.drop_duplicates(subset=['time'], keep='last')
        
        # Save with header
        combined.to_csv("nav_history.csv", index=False, header=["timestamp", "nav"])
        print("Successfully saved nav_history.csv")
    else:
        print("No new rows to add.")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
