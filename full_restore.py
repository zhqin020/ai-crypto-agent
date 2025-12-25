
import pandas as pd
import sys

print("Starting full restoration...")

# --- 1. Restore Trade Log ---
print("Restoring Trade Log...")
# Load recovered ancient history (up to Dec 23 12:17)
# Note: trade_log.csv might have header in ad82b4b?
# Based on previous valid file, it likely does.
# Let's peek at first line of recovered file to be safe.
with open("trade_full_recovered.csv", "r") as f:
    header_line = f.readline()

if "time,symbol" in header_line:
    df_old = pd.read_csv("trade_full_recovered.csv")
else:
    # If no header, add it
    cols = ["time","symbol","action","side","qty","price","notional","margin","fee","realized_pnl","notes","reason","leverage"]
    df_old = pd.read_csv("trade_full_recovered.csv", names=cols, header=None)

# Load current file (Dec 25 state)
df_curr = pd.read_csv("trade_log.csv")

# Filter current file to ONLY keep records NEWER than the last record in old file
# And also keep the "Stop Loss" on Dec 23 21:58 which is NOT in old file.
df_old['time'] = pd.to_datetime(df_old['time'])
last_old_time = df_old['time'].max()
print(f"Old history ends at: {last_old_time}")

df_curr['time'] = pd.to_datetime(df_curr['time'])
# Keep everything after the old history ends
df_new_records = df_curr[df_curr['time'] > last_old_time].copy()

# Combine
df_trade_final = pd.concat([df_old, df_new_records])
df_trade_final = df_trade_final.sort_values('time').drop_duplicates(subset=['time', 'symbol', 'action'])

df_trade_final.to_csv("trade_log.csv", index=False)
print(f"Restored Trade Log: {len(df_trade_final)} records.")


# --- 2. Restore NAV History ---
print("Restoring NAV History...")

# Load recovered NAV (Dec 19-23 included)
# header handling
try:
    df_nav_old = pd.read_csv("nav_full_recovered.csv", names=["time", "nav"], header=None)
    # check header
    if str(df_nav_old.iloc[0]['nav']) == 'nav':
        df_nav_old = df_nav_old.iloc[1:]
    df_nav_old['nav'] = pd.to_numeric(df_nav_old['nav'])
    df_nav_old['time'] = pd.to_datetime(df_nav_old['time'])
except Exception as e:
    print(f"Error parsing old NAV: {e}")
    sys.exit(1)

# Load current NAV
try:
    df_nav_curr = pd.read_csv("nav_history.csv", names=["time", "nav"], header=None)
    if str(df_nav_curr.iloc[0]['nav']) == 'nav':
        df_nav_curr = df_nav_curr.iloc[1:]
    df_nav_curr['nav'] = pd.to_numeric(df_nav_curr['nav'])
    df_nav_curr['time'] = pd.to_datetime(df_nav_curr['time'])
except Exception as e:
    print(f"Error parsing current NAV: {e}")
    sys.exit(1)
    
# Find cut-off
last_nav_time = df_nav_old['time'].max()
print(f"Old NAV ends at: {last_nav_time}")

# Keep newer records from current
df_nav_new_records = df_nav_curr[df_nav_curr['time'] > last_nav_time].copy()

# Combine
df_nav_final = pd.concat([df_nav_old, df_nav_new_records])
df_nav_final = df_nav_final.sort_values('time').drop_duplicates(subset=['time'], keep='last')

# Save with header
df_nav_final.to_csv("nav_history.csv", index=False, header=["timestamp", "nav"])
print(f"Restored NAV History: {len(df_nav_final)} records.")

print("Full restoration complete.")
