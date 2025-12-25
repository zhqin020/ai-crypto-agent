
import pandas as pd

# Load
df = pd.read_csv("trade_log.csv")

# Fix 2026 -> 2025
# Check for any dates starting with 2026
# Convert to string first to be safe
df['time'] = df['time'].astype(str)
rows_2026 = df[df['time'].str.startswith("2026")]
print(f"Found {len(rows_2026)} rows with year 2026. Fixing...")

df['time'] = df['time'].str.replace("2026-", "2025-")

# Convert to datetime for sorting
df['time'] = pd.to_datetime(df['time'])

# Sort strictly
df = df.sort_values('time')

# formatting back to string to match style YYYY-MM-DD HH:MM:SS
# but pandas to_csv default is usually fine.
# Let's drop Action duplicates if any perfectly identical rows exist
df = df.drop_duplicates()

df.to_csv("trade_log.csv", index=False)
print("Fixed years and sorted trade_log.csv")
