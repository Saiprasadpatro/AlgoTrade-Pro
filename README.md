# AlgoTrade Pro - Algorithmic Trading Platform

## 🚀 Project Overview

**AlgoTrade Pro** is a demonstration algorithmic trading platform built with Hono and Cloudflare Pages. It provides real-time technical analysis, signal detection, pattern recognition, and backtesting capabilities for educational purposes.

### ⚠️ Important Notice
**THIS IS A DEMO PLATFORM FOR EDUCATIONAL PURPOSES ONLY**
- Uses simulated market data (not real market data)
- Does not execute real trades
- No connection to actual brokers or exchanges
- All data and signals are for learning purposes only

### 🎯 Main Features

- **📊 Real-time Technical Indicators**
  - Simple Moving Average (SMA)
  - Exponential Moving Average (EMA)
  - Relative Strength Index (RSI)
  - MACD (Moving Average Convergence Divergence)
  - Bollinger Bands
  
- **🎯 Signal Detection System**
  - Bullish/Bearish signal identification
  - Confidence scoring
  - Entry/Exit price suggestions
  - Stop-loss and target price calculations

- **🔍 Pattern Recognition**
  - Golden Cross / Death Cross detection
  - Support/Resistance breakouts
  - Trend identification

- **📈 Backtesting Engine**
  - Strategy performance testing
  - Historical data analysis
  - Win rate calculation
  - Equity curve visualization

- **💼 Portfolio Management**
  - Position tracking (demo)
  - P&L monitoring (demo)
  - Trade history (demo)

## 🌐 URLs

- **Live Demo**: https://3000-ify5yl6c2x4ymvtkd920y-583b4d74.sandbox.novita.ai
- **GitHub**: _(Not yet deployed)_

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- TailwindCSS for styling
- Chart.js for data visualization
- Axios for HTTP requests
- Vanilla JavaScript (no framework dependencies)

**Backend:**
- Hono (lightweight web framework)
- Cloudflare Pages/Workers
- TypeScript

**Deployment:**
- PM2 for process management (sandbox)
- Cloudflare Pages (production)

### Data Models

**Market Data Structure:**
```typescript
{
  prices: number[]     // Closing prices
  highs: number[]      // Daily highs
  lows: number[]       // Daily lows
  volumes: number[]    // Trading volumes
}
```

**Signal Structure:**
```typescript
{
  type: 'BULLISH' | 'BEARISH'
  indicator: string    // RSI, MACD, MA, etc.
  value: string        // Indicator value
  signal: string       // Signal description
  confidence: number   // 0-100
  entryPrice: number
  targetPrice: number
  stopLoss: number
}
```

**Pattern Structure:**
```typescript
{
  name: string         // Golden Cross, Death Cross, etc.
  type: 'BULLISH' | 'BEARISH'
  confidence: number   // 0-100
  description: string
}
```

### Storage

**Current Implementation:**
- All data is generated in-memory (simulated market data)
- No persistent storage required for demo version

**Future Enhancement Options:**
- Cloudflare D1 for historical data storage
- Cloudflare KV for caching indicator calculations
- Cloudflare R2 for storing backtest results

## 📖 User Guide

### Dashboard Tab
1. View current price and RSI indicator
2. See active signals count
3. Monitor charts:
   - Price chart with Bollinger Bands
   - RSI indicator (oversold < 30, overbought > 70)
   - MACD histogram with signal lines

### Signals Tab
1. Click "Refresh Signals" to detect new trading signals
2. View bullish (green) and bearish (red) signals
3. Each signal shows:
   - Indicator source (RSI, MACD, MA)
   - Confidence percentage
   - Entry price, target, and stop-loss

### Backtest Tab
1. Select a trading strategy:
   - SMA Crossover (20/50)
   - RSI Mean Reversion
   - MACD Momentum
2. Set initial capital (default: $10,000)
3. Click "Run Backtest"
4. Review results:
   - Final capital
   - Total return percentage
   - Win rate
   - Equity curve chart

### Portfolio Tab
- View demo portfolio statistics
- Monitor open positions (mock data)
- Track P&L performance (demo)

## 🔧 API Documentation

### GET /api/market/sample
Generate sample market data for testing.

**Response:**
```json
{
  "prices": [100, 101.5, ...],
  "highs": [102, 103, ...],
  "lows": [99, 100, ...],
  "volumes": [1000000, 1200000, ...]
}
```

### POST /api/indicators/sma
Calculate Simple Moving Average.

**Request:**
```json
{
  "prices": [100, 101, 102, ...],
  "period": 20
}
```

**Response:**
```json
{
  "sma": [100.5, 101.2, ...],
  "period": 20
}
```

### POST /api/indicators/rsi
Calculate Relative Strength Index.

**Request:**
```json
{
  "prices": [100, 101, 102, ...],
  "period": 14
}
```

**Response:**
```json
{
  "rsi": [45.2, 52.3, 68.7, ...],
  "period": 14
}
```

### POST /api/indicators/macd
Calculate MACD indicator.

**Request:**
```json
{
  "prices": [100, 101, 102, ...],
  "fastPeriod": 12,
  "slowPeriod": 26,
  "signalPeriod": 9
}
```

**Response:**
```json
{
  "macdLine": [0.5, 0.8, ...],
  "signalLine": [0.3, 0.6, ...],
  "histogram": [0.2, 0.2, ...]
}
```

### POST /api/indicators/bollinger
Calculate Bollinger Bands.

**Request:**
```json
{
  "prices": [100, 101, 102, ...],
  "period": 20,
  "stdDev": 2
}
```

**Response:**
```json
{
  "middle": [100, 101, ...],
  "upper": [105, 106, ...],
  "lower": [95, 96, ...],
  "period": 20,
  "stdDev": 2
}
```

### POST /api/signals/detect
Detect trading signals from indicators.

**Request:**
```json
{
  "prices": [100, 101, ...],
  "rsi": [45, 52, 68, ...],
  "macd": {
    "histogram": [0.2, 0.3, ...]
  }
}
```

**Response:**
```json
{
  "signals": [
    {
      "type": "BULLISH",
      "indicator": "RSI",
      "value": "28.50",
      "signal": "Oversold",
      "confidence": 75,
      "entryPrice": 100,
      "targetPrice": "105.00",
      "stopLoss": "97.00"
    }
  ],
  "timestamp": "2026-01-28T06:45:00.000Z"
}
```

### POST /api/patterns/detect
Detect chart patterns.

**Request:**
```json
{
  "prices": [100, 101, ...],
  "highs": [102, 103, ...],
  "lows": [99, 100, ...]
}
```

**Response:**
```json
{
  "patterns": [
    {
      "name": "Golden Cross",
      "type": "BULLISH",
      "confidence": 85,
      "description": "50-day MA crosses above 200-day MA"
    }
  ],
  "timestamp": "2026-01-28T06:45:00.000Z"
}
```

### POST /api/backtest/strategy
Run strategy backtest.

**Request:**
```json
{
  "prices": [100, 101, ...],
  "strategy": "sma_crossover",
  "initialCapital": 10000
}
```

**Response:**
```json
{
  "initialCapital": 10000,
  "finalCapital": "11250.50",
  "totalReturn": "12.51",
  "trades": 8,
  "winRate": "62.50",
  "equity": [10000, 10200, ...],
  "tradeHistory": [...]
}
```

## 🚀 Deployment

### Local Development (Sandbox)

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start with PM2
pm2 start ecosystem.config.cjs

# Test the service
curl http://localhost:3000

# View logs
pm2 logs trading-platform --nostream
```

### Production (Cloudflare Pages)

```bash
# Setup Cloudflare API key (required)
# Call setup_cloudflare_api_key tool first

# Build
npm run build

# Create project (first time)
npx wrangler pages project create trading-platform \
  --production-branch main \
  --compatibility-date 2024-01-01

# Deploy
npm run deploy:prod

# Your site will be available at:
# https://trading-platform.pages.dev
```

### Deployment Status
- ✅ **Sandbox**: Active at https://3000-ify5yl6c2x4ymvtkd920y-583b4d74.sandbox.novita.ai
- ❌ **Production**: Not yet deployed to Cloudflare Pages
- ❌ **GitHub**: Not yet pushed to repository

## 📊 Currently Completed Features

✅ **Phase 1: Core Functionality**
- Technical indicators (SMA, EMA, RSI, MACD, Bollinger Bands)
- Real-time chart visualization with Chart.js
- Signal detection system
- Pattern recognition (Golden/Death Cross, Breakouts)

✅ **Phase 2: Analysis Tools**
- Backtesting engine with SMA crossover strategy
- Win rate and return calculations
- Equity curve visualization
- Portfolio management UI (demo data)

✅ **Phase 3: User Interface**
- Responsive dashboard with TailwindCSS
- Multi-tab navigation
- Real-time metrics display
- Interactive charts

## 🚧 Features Not Yet Implemented

### High Priority
- ❌ Real market data integration (Alpha Vantage, Polygon.io)
- ❌ User authentication (JWT)
- ❌ Strategy builder interface
- ❌ Additional backtest strategies (RSI, MACD)

### Medium Priority
- ❌ Email/SMS alert system
- ❌ Historical data storage (Cloudflare D1)
- ❌ Multiple timeframe analysis
- ❌ Volume analysis algorithms

### Low Priority
- ❌ Machine learning models for prediction
- ❌ Sentiment analysis integration
- ❌ Multi-asset support (crypto, forex)
- ❌ Community features (strategy sharing)
- ❌ Advanced risk management tools

## 🎯 Recommended Next Steps

### 1. Real Market Data Integration
**Priority: HIGH**
- Integrate Alpha Vantage or Polygon.io API
- Store API keys securely using Cloudflare secrets
- Implement data caching with Cloudflare KV
- Add real-time WebSocket data (if possible within limitations)

```typescript
// Example: Alpha Vantage integration
app.get('/api/market/realtime/:symbol', async (c) => {
  const symbol = c.req.param('symbol')
  const apiKey = c.env.ALPHA_VANTAGE_KEY
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`
  
  const response = await fetch(url)
  const data = await response.json()
  // Process and return data
})
```

### 2. Add More Backtest Strategies
**Priority: HIGH**
- RSI Mean Reversion strategy
- MACD Momentum strategy
- Bollinger Band squeeze strategy
- Multi-indicator confirmation strategies

### 3. User Authentication & Data Persistence
**Priority: MEDIUM**
- Implement JWT authentication
- Create user profiles
- Store user strategies in Cloudflare D1
- Save backtest results and trade history

### 4. Deploy to Production
**Priority: MEDIUM**
- Push code to GitHub
- Deploy to Cloudflare Pages
- Set up custom domain
- Configure environment variables

### 5. Enhanced Analytics
**Priority: MEDIUM**
- Add Sharpe ratio calculation
- Implement maximum drawdown analysis
- Create performance comparison charts
- Add strategy optimization tools

## ⚙️ Technical Indicators Reference

### RSI (Relative Strength Index)
- **Range**: 0-100
- **Oversold**: < 30 (potential buy signal)
- **Overbought**: > 70 (potential sell signal)
- **Period**: 14 days (default)

### MACD (Moving Average Convergence Divergence)
- **Components**: MACD line, Signal line, Histogram
- **Bullish Signal**: MACD crosses above signal line
- **Bearish Signal**: MACD crosses below signal line
- **Parameters**: 12/26/9 (default)

### Bollinger Bands
- **Components**: Upper band, Middle band (SMA), Lower band
- **Buy Signal**: Price touches lower band
- **Sell Signal**: Price touches upper band
- **Parameters**: 20-period SMA ± 2 standard deviations

### Moving Averages
- **Golden Cross**: 50-day MA crosses above 200-day MA (bullish)
- **Death Cross**: 50-day MA crosses below 200-day MA (bearish)
- **Trend**: Price above MA = uptrend, below MA = downtrend

## 🔒 Security & Compliance

### Security Measures Implemented
- CORS enabled for API routes
- Client-side validation
- No sensitive data storage in current version

### Required for Production
- ⚠️ Add rate limiting
- ⚠️ Implement input sanitization
- ⚠️ Add API authentication
- ⚠️ Encrypt sensitive data
- ⚠️ Add HTTPS enforcement

### Legal Disclaimers
This platform includes appropriate risk warnings:
- Demo platform disclaimer
- Educational purposes notice
- Risk of trading warning
- Past performance disclaimer

### Compliance Considerations
For production use, consider:
- Trading licenses (if executing real trades)
- Data privacy regulations (GDPR, CCPA)
- Financial regulations (SEC, FINRA)
- Terms of service and user agreements

## 🤝 Contributing

This is a demonstration project. For production use:
1. Fork the repository
2. Add real market data integration
3. Implement proper authentication
4. Add comprehensive testing
5. Follow security best practices

## 📝 License

Educational demonstration project. Not for commercial trading use.

## ⚠️ Risk Warning

**TRADING INVOLVES SUBSTANTIAL RISK OF LOSS**

This platform is for educational purposes only. Trading stocks, options, futures, forex, and other securities involves risk and can result in significant losses. Past performance does not guarantee future results. Always do your own research and consult with a licensed financial advisor before making trading decisions.

## 📞 Support

For questions or issues with this demo platform, please refer to the API documentation above or the inline code comments.

---

**Built with Hono + Cloudflare Pages**  
**Last Updated**: January 28, 2026  
**Version**: 1.0.0 (Demo)
