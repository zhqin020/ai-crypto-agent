
def compute_pnl(entry_price, current_price, quantity):
    pnl = (current_price - entry_price) * quantity
    return round(pnl, 2)

# Case 1: Short Position (Price Rises -> Loss)
entry = 900.0
current = 904.3
qty = -2.22  # Negative for short
pnl = compute_pnl(entry, current, qty)
print(f"Short (Price Up): Entry {entry}, Current {current}, Qty {qty} -> PnL {pnl} (Expected: Negative)")

# Case 2: Short Position (Price Falls -> Profit)
entry = 900.0
current = 890.0
qty = -2.22
pnl = compute_pnl(entry, current, qty)
print(f"Short (Price Down): Entry {entry}, Current {current}, Qty {qty} -> PnL {pnl} (Expected: Positive)")

# Case 3: Long Position (Price Rises -> Profit)
entry = 900.0
current = 910.0
qty = 2.22
pnl = compute_pnl(entry, current, qty)
print(f"Long (Price Up): Entry {entry}, Current {current}, Qty {qty} -> PnL {pnl} (Expected: Positive)")
