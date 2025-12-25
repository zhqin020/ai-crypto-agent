
import pandas as pd
from datetime import datetime

# Load trade log
# Use header=0 since we confirmed it has a header now
trades = pd.read_csv("trade_log.csv")


# Validating trade log
trades['time'] = pd.to_datetime(trades['time'], errors='coerce')
trades = trades.dropna(subset=['time'])
trades = trades.sort_values('time')

# Load existing NAV
# nav_history.csv typically has no header
nav_df = pd.read_csv("nav_history.csv", names=["time", "nav"], header=None)
# If the first row is actually a header like "timestamp,nav", drop it
if isinstance(nav_df.iloc[0]['nav'], str):
    nav_df = nav_df.iloc[1:]
    nav_df['nav'] = pd.to_numeric(nav_df['nav'])

nav_df['time'] = pd.to_datetime(nav_df['time'], errors='coerce')
nav_df = nav_df.dropna(subset=['time'])

# ... (rest of logic)
# Filter out the recent "Dec 24" entries to re-append them correctly? 
# Or just insert the missing ones.

# Let's create a clean list of events from trade_log where 'realized_pnl' is non-zero
events = trades[trades['realized_pnl'] != 0].copy()
events = events[(events['time'] > "2025-12-12") & (events['time'] < "2025-12-24")]

new_rows = []
last_nav = 10832.04 # From lines viewed above, Dec 12 20:02

for _, row in events.iterrows():
    pnl = row['realized_pnl']
    last_nav += pnl
    new_rows.append({"time": row['time'].strftime("%Y-%m-%d %H:%M:%S"), "nav": round(last_nav, 2)})

# Convert to DF
new_df = pd.DataFrame(new_rows)

# Read original
orig_df = pd.read_csv("nav_history.csv", names=["time", "nav"], header=None)

# Combine and Sort
full_df = pd.concat([orig_df, new_df]).drop_duplicates(subset=['time'], keep='last')
full_df['time_dt'] = pd.to_datetime(full_df['time'])
full_df = full_df.sort_values('time_dt')
del full_df['time_dt']

# Save
full_df.to_csv("nav_history.csv", index=False, header=False)
print("Updated nav_history.csv with", len(new_df), "restored points.")
