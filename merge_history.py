
import pandas as pd
import io

# 1. Load the restored mid-history (up to Dec 19)
# Use on_bad_lines='skip' to avoid parsing errors if any
df_mid = pd.read_csv("trade_log_mid.csv", names=["time","symbol","action","side","qty","price","notional","margin","fee","realized_pnl","notes","reason","leverage"], header=None)

# 2. Define the new valid trades from Dec 24 (Manually taken from tail of current file)
# 2025-12-24 15:39:03,ETH,open_long,long,1.3711073405659246,2917.35,4000.0,2000.0,4.0,-4.0,,new,2.0
# 2025-12-24 15:39:03,BNB,open_short,short,-1.5676873585130466,839.3,1315.76,657.88,1.31576,-1.31576,,new,2.0

new_trades_data = """2025-12-24 15:39:03,ETH,open_long,long,1.3711073405659246,2917.35,4000.0,2000.0,4.0,-4.0,,new,2.0
2025-12-24 15:39:03,BNB,open_short,short,-1.5676873585130466,839.3,1315.76,657.88,1.31576,-1.31576,,new,2.0"""

df_new = pd.read_csv(io.StringIO(new_trades_data), names=["time","symbol","action","side","qty","price","notional","margin","fee","realized_pnl","notes","reason","leverage"], header=None)

# 3. Concatenate
df_final = pd.concat([df_mid, df_new], ignore_index=True)

# 4. Save to trade_log.csv
# Note: The original file had a header? Let's check first line of current file via script or assume standard.
# My grep showed no header in the data lines, but usually there is one.
# Let's write with header if we think it needs it.
# Wait, checking step 258 server.py, it uses csv.DictReader, so it EXPECTS a header.
# My `trade_log_mid.csv` was created from `git show ...` which presumably included the header?
# Let's check the first line of `trade_log_mid.csv`
with open("trade_log_mid.csv", "r") as f:
    first_line = f.readline()

if "time,symbol" in first_line:
    # It has header, so read_csv with header=0
    df_mid = pd.read_csv("trade_log_mid.csv")
    df_final = pd.concat([df_mid, df_new], ignore_index=True)
    df_final.to_csv("trade_log.csv", index=False)
else:
    # No header, need to add it
    df_final.to_csv("trade_log.csv", index=False, header=["time","symbol","action","side","qty","price","notional","margin","fee","realized_pnl","notes","reason","leverage"])

print("Successfully merged history.")
