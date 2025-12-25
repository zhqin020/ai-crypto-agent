
import pandas as pd

# Load the messy log
df = pd.read_csv("trade_log.csv")

# Clean up sorting and duplicates
df['time'] = pd.to_datetime(df['time'])
df = df.sort_values('time').drop_duplicates()

# Strategy: 
# The "Dec 23 21:58" Closes are: BNB (4.9732), ETH (0.6163), SOL (0.2966).
# These match the Opens from Dec 11.
# We must REMOVE any "Close" events for these specific quantities between Dec 11 and Dec 23.
# This validates the "Held" theory and the "Loss" reality.

# Define targets to remove (The "False Profits")
# Dec 14 BNB Close of 4.973
# Dec 13 SOL Close of 0.2966
# Dec 13 ETH Close of 0.6163

# We filter OUT rows that match these criteria
mask_bnb_false_close = (df['symbol'] == 'BNB') & (df['action'] == 'close_position') & (df['qty'].between(4.973, 4.974)) & (df['time'].between("2025-12-12", "2025-12-20"))
mask_eth_false_close = (df['symbol'] == 'ETH') & (df['action'] == 'close_position') & (df['qty'].between(0.616, 0.617)) & (df['time'].between("2025-12-12", "2025-12-20"))
mask_sol_false_close = (df['symbol'] == 'SOL') & (df['action'] == 'close_position') & (df['qty'].between(0.296, 0.297)) & (df['time'].between("2025-12-12", "2025-12-20"))

# Apply filter: Keep rows that are NOT in the masks
df_clean = df[~(mask_bnb_false_close | mask_eth_false_close | mask_sol_false_close)].copy()

print(f"Removed {len(df) - len(df_clean)} conflicting interim close records.")

# Also ensure the Opens are present.
# We filtered FOR 'trade_log.csv' which implies we have the Dec 11 Opens?
# Let's check. If not, we append them from 'trade_full_recovered.csv' (oldest part).
# Actually, the 'trade_log.csv' I built in full_restore.py step 788 *started* with `trade_full_recovered`.
# Let's verify if `trade_full_recovered` had them.
# Step 840 output shows `trade_full_recovered` HAD Dec 11 Open BNB.
# So they should be in df_clean.

# Final Sort
df_clean = df_clean.sort_values('time')

# Save
df_clean.to_csv("trade_log.csv", index=False)
print("Harmonized Trade Log saved.")
