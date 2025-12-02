"""
Multi-Coin Signal Generator
Generates technical indicators for BTC, ETH, BNB, DOGE, SOL
"""
import pandas as pd
import numpy as np
from pathlib import Path

COINS = ['BTC', 'ETH', 'BNB', 'DOGE', 'SOL']
CSV_DIR = Path("csv_data")
SIGNALS_DIR = Path("signals")
SIGNALS_DIR.mkdir(exist_ok=True)

def compute_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    """Calculate RSI using Wilder's smoothing"""
    delta = series.diff()
    gain = delta.clip(lower=0.0)
    loss = -delta.clip(upper=0.0)
    avg_gain = gain.ewm(alpha=1/period, min_periods=period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1/period, min_periods=period, adjust=False).mean()
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

def add_technical_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """Add technical indicators to OHLCV data"""
    
    # Moving Averages
    df['ma_5'] = df['close'].rolling(window=5, min_periods=5).mean()
    df['ma_20'] = df['close'].rolling(window=20, min_periods=20).mean()
    df['ma_60'] = df['close'].rolling(window=60, min_periods=60).mean()
    
    # MA Cross
    df['ma_cross'] = (df['ma_5'] > df['ma_20']).astype(int)
    
    # Momentum
    df['momentum_12'] = df['close'].pct_change(periods=12)
    
    # MACD
    ema_12 = df['close'].ewm(span=12, adjust=False).mean()
    ema_26 = df['close'].ewm(span=26, adjust=False).mean()
    df['macd'] = ema_12 - ema_26
    df['macd_signal'] = df['macd'].ewm(span=9, adjust=False).mean()
    df['macd_hist'] = df['macd'] - df['macd_signal']
    
    # ATR (Average True Range)
    high_low = df['high'] - df['low']
    high_close = (df['high'] - df['close'].shift()).abs()
    low_close = (df['low'] - df['close'].shift()).abs()
    tr = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
    df['atr_14'] = tr.ewm(alpha=1/14, adjust=False).mean()
    
    # Bollinger Bands
    rolling_mean = df['close'].rolling(window=20, min_periods=20).mean()
    rolling_std = df['close'].rolling(window=20, min_periods=20).std(ddof=0)
    df['bb_mid'] = rolling_mean
    df['bb_upper'] = rolling_mean + 2 * rolling_std
    df['bb_lower'] = rolling_mean - 2 * rolling_std
    df['bb_width_20'] = (df['bb_upper'] - df['bb_lower']) / df['bb_mid']
    df['bb_pos_20'] = (df['close'] - df['bb_lower']) / (df['bb_upper'] - df['bb_lower'])
    
    # RSI
    df['rsi_14'] = compute_rsi(df['close'], 14)
    
    # Volume indicators
    df['volume_ma_20'] = df['volume'].rolling(window=20, min_periods=20).mean()
    df['rel_volume_20'] = df['volume'] / df['volume_ma_20']
    
    # Price position
    df['price_position_20'] = df['close'].rolling(window=20, min_periods=20).apply(
        lambda x: pd.Series(x).rank(pct=True).iloc[-1], raw=False
    )
    
    # Returns
    df['log_return'] = np.log(df['close'] / df['close'].shift(1))
    df['ret'] = df['close'].pct_change()
    
    # Volatility
    df['volatility_20'] = df['ret'].rolling(window=20, min_periods=20).std()
    
    # Sentiment Factors (if available)
    if 'funding_rate' in df.columns:
        # Funding Rate Z-Score (20 periods)
        fr_mean = df['funding_rate'].rolling(window=20, min_periods=20).mean()
        fr_std = df['funding_rate'].rolling(window=20, min_periods=20).std()
        df['funding_rate_zscore'] = (df['funding_rate'] - fr_mean) / (fr_std + 1e-8)
        
    if 'open_interest' in df.columns:
        # OI Change
        df['oi_change'] = df['open_interest'].pct_change()
        # OI RSI (is money flowing in too fast?)
        df['oi_rsi'] = compute_rsi(df['open_interest'], 14)
    
    # ----------------------------------------------------
    # 4. Advanced Features (Optimized for Qlib)
    # ----------------------------------------------------
    
    # A. Normalized ATR (NATR)
    # Rationale: Allows comparing volatility across coins with different price levels
    df['natr_14'] = df['atr_14'] / df['close']

    # B. Custom Signal Stars (Ported from custom_signal_v2_backtest.py)
    # 1. Price Percentile (20) - already calculated as price_position_20
    # df['price_percentile_20'] = df['price_position_20'] 
    
    # 2. Volume Ratio (20) - already calculated as rel_volume_20
    # df['volume_ratio_ma_20'] = df['rel_volume_20']
    
    # 3. DMI Indicators (+DI, -DI, ADX)
    # Calculate TR, +DM, -DM first
    high = df['high']
    low = df['low']
    close = df['close']
    
    tr1 = high - low
    tr2 = (high - close.shift(1)).abs()
    tr3 = (low - close.shift(1)).abs()
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    
    up_move = high.diff()
    down_move = -low.diff()
    plus_dm = np.where((up_move > down_move) & (up_move > 0), up_move, 0.0)
    minus_dm = np.where((down_move > up_move) & (down_move > 0), down_move, 0.0)
    
    # Smooth (Wilder's method approx with ewm alpha=1/14)
    atr_smooth = tr.ewm(alpha=1/14, adjust=False).mean()
    plus_dm_smooth = pd.Series(plus_dm, index=df.index).ewm(alpha=1/14, adjust=False).mean()
    minus_dm_smooth = pd.Series(minus_dm, index=df.index).ewm(alpha=1/14, adjust=False).mean()
    
    plus_di = 100 * plus_dm_smooth / atr_smooth
    minus_di = 100 * minus_dm_smooth / atr_smooth
    dx = 100 * (plus_di - minus_di).abs() / (plus_di + minus_di)
    adx = dx.ewm(alpha=1/14, adjust=False).mean()
    
    # 4. Star Calculation
    # Buy Stars: RSI < 30 + Low Price (Pct < 0.1) & High Vol (Ratio > 2) + ADX Down (Trend weakening or Reversal)
    # Note: Simplified logic for feature generation
    low_high_mask = ((df['price_position_20'] < 0.10) & (df['rel_volume_20'] > 2.0)).astype(int)
    rsi_oversold = (df['rsi_14'] < 30).astype(int)
    adx_down = ((minus_di > plus_di) & (adx > 40)).astype(int) # Strong downtrend
    
    df['buy_stars'] = rsi_oversold + low_high_mask + adx_down
    
    # Sell Stars: RSI > 70 + High Price (Pct > 0.9) & High Vol + ADX Up
    high_high_mask = ((df['price_position_20'] > 0.90) & (df['rel_volume_20'] > 2.0)).astype(int)
    rsi_overbought = (df['rsi_14'] > 70).astype(int)
    adx_up = ((plus_di > minus_di) & (adx > 40)).astype(int) # Strong uptrend
    
    df['sell_stars'] = rsi_overbought + high_high_mask + adx_up
    
    return df

def process_coin(coin: str):
    """Process a single coin"""
    print(f"\n📊 Processing {coin}...")
    
    input_path = CSV_DIR / f"{coin}_4h.csv"
    if not input_path.exists():
        print(f"   ⚠️ File not found: {input_path}")
        return None
    
    # Load data
    df = pd.read_csv(input_path)
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date').reset_index(drop=True)
    
    print(f"   Loaded {len(df)} rows from {df['date'].min()} to {df['date'].max()}")
    
    # Add indicators
    df = add_technical_indicators(df)
    
    # Add instrument column
    df['instrument'] = coin
    
    # Save
    output_path = SIGNALS_DIR / f"{coin}_4h_signals.csv"
    df.to_csv(output_path, index=False)
    print(f"   ✅ Saved to {output_path}")
    
    # Print summary
    print(f"   Features: {len(df.columns)} columns")
    print(f"   Sample RSI: {df['rsi_14'].iloc[-1]:.2f}")
    print(f"   Sample MACD: {df['macd_hist'].iloc[-1]:.4f}")
    
    return df[['date', 'ret']]

def main():
    print("🚀 Multi-Coin Signal Generator")
    print(f"Processing {len(COINS)} coins: {', '.join(COINS)}\n")
    
    # Store returns for correlation calculation
    returns_map = {}
    
    for coin in COINS:
        df_ret = process_coin(coin)
        if df_ret is not None:
            returns_map[coin] = df_ret.set_index('date')['ret']
            
    # C. BTC Correlation (Rolling 24H)
    # 24H = 6 bars of 4H
    if 'BTC' in returns_map:
        btc_ret = returns_map['BTC']
        print("\n🔗 Calculating BTC Correlations...")
        
        for coin in COINS:
            if coin == 'BTC': 
                continue
                
            # Load existing signal file
            file_path = SIGNALS_DIR / f"{coin}_4h_signals.csv"
            if not file_path.exists():
                continue
                
            df = pd.read_csv(file_path)
            df['date'] = pd.to_datetime(df['date'])
            
            # Merge with BTC returns
            # Note: Ensure alignment
            df = df.merge(btc_ret.rename('btc_ret'), on='date', how='left')
            
            # Calculate Rolling Correlation (Window=24H=6 bars, or longer like 7 days=42 bars)
            # Using 42 bars (1 week) for stable correlation
            df['btc_corr_24h'] = df['ret'].rolling(42).corr(df['btc_ret'])
            
            # Fill NaN
            df['btc_corr_24h'] = df['btc_corr_24h'].fillna(0)
            
            # Save back
            df.to_csv(file_path, index=False)
            print(f"   Updated {coin} with BTC correlation")
            
        # Also add btc_corr_24h = 1.0 for BTC itself for consistency
        btc_path = SIGNALS_DIR / "BTC_4h_signals.csv"
        if btc_path.exists():
            df_btc = pd.read_csv(btc_path)
            df_btc['btc_corr_24h'] = 1.0
            df_btc.to_csv(btc_path, index=False)
    
    if not returns_map:
        print("❌ No coins processed! Exiting with error.")
        import sys
        sys.exit(1)

    print(f"\n✅ All done! Signals saved to {SIGNALS_DIR}/")

if __name__ == "__main__":
    main()
