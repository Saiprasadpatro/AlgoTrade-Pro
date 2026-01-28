import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

// Enable CORS for frontend-backend communication
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// ============================================
// TECHNICAL INDICATORS API
// ============================================

// Calculate Simple Moving Average (SMA)
app.post('/api/indicators/sma', async (c) => {
  const { prices, period } = await c.req.json()
  
  if (!prices || !period || prices.length < period) {
    return c.json({ error: 'Invalid input. Need prices array and period.' }, 400)
  }
  
  const sma = []
  for (let i = period - 1; i < prices.length; i++) {
    const sum = prices.slice(i - period + 1, i + 1).reduce((a: number, b: number) => a + b, 0)
    sma.push(sum / period)
  }
  
  return c.json({ sma, period })
})

// Calculate Exponential Moving Average (EMA)
app.post('/api/indicators/ema', async (c) => {
  const { prices, period } = await c.req.json()
  
  if (!prices || !period || prices.length < period) {
    return c.json({ error: 'Invalid input.' }, 400)
  }
  
  const k = 2 / (period + 1)
  const ema = []
  
  // First EMA is SMA
  const firstSMA = prices.slice(0, period).reduce((a: number, b: number) => a + b, 0) / period
  ema.push(firstSMA)
  
  // Calculate subsequent EMAs
  for (let i = period; i < prices.length; i++) {
    const newEMA = prices[i] * k + ema[ema.length - 1] * (1 - k)
    ema.push(newEMA)
  }
  
  return c.json({ ema, period })
})

// Calculate Relative Strength Index (RSI)
app.post('/api/indicators/rsi', async (c) => {
  const { prices, period = 14 } = await c.req.json()
  
  if (!prices || prices.length < period + 1) {
    return c.json({ error: 'Invalid input. Need sufficient price data.' }, 400)
  }
  
  const changes = []
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1])
  }
  
  const gains = changes.map(change => change > 0 ? change : 0)
  const losses = changes.map(change => change < 0 ? Math.abs(change) : 0)
  
  const rsi = []
  
  // Calculate initial average gain and loss
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period
  
  let rs = avgGain / avgLoss
  rsi.push(100 - (100 / (1 + rs)))
  
  // Calculate subsequent RSI values
  for (let i = period; i < changes.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period
    rs = avgGain / avgLoss
    rsi.push(100 - (100 / (1 + rs)))
  }
  
  return c.json({ rsi, period })
})

// Calculate MACD (Moving Average Convergence Divergence)
app.post('/api/indicators/macd', async (c) => {
  const { prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9 } = await c.req.json()
  
  if (!prices || prices.length < slowPeriod + signalPeriod) {
    return c.json({ error: 'Invalid input. Need sufficient price data.' }, 400)
  }
  
  // Calculate EMA helper
  const calculateEMA = (data: number[], period: number) => {
    const k = 2 / (period + 1)
    const ema = []
    const firstSMA = data.slice(0, period).reduce((a, b) => a + b, 0) / period
    ema.push(firstSMA)
    
    for (let i = period; i < data.length; i++) {
      ema.push(data[i] * k + ema[ema.length - 1] * (1 - k))
    }
    return ema
  }
  
  const fastEMA = calculateEMA(prices, fastPeriod)
  const slowEMA = calculateEMA(prices, slowPeriod)
  
  // Calculate MACD line
  const macdLine = []
  const offset = fastPeriod - slowPeriod
  for (let i = 0; i < slowEMA.length; i++) {
    macdLine.push(fastEMA[i + offset] - slowEMA[i])
  }
  
  // Calculate Signal line
  const signalLine = calculateEMA(macdLine, signalPeriod)
  
  // Calculate Histogram
  const histogram = []
  const signalOffset = signalPeriod - 1
  for (let i = 0; i < signalLine.length; i++) {
    histogram.push(macdLine[i + signalOffset] - signalLine[i])
  }
  
  return c.json({ macdLine, signalLine, histogram })
})

// Calculate Bollinger Bands
app.post('/api/indicators/bollinger', async (c) => {
  const { prices, period = 20, stdDev = 2 } = await c.req.json()
  
  if (!prices || prices.length < period) {
    return c.json({ error: 'Invalid input.' }, 400)
  }
  
  const middle = []
  const upper = []
  const lower = []
  
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1)
    const sma = slice.reduce((a: number, b: number) => a + b, 0) / period
    
    // Calculate standard deviation
    const variance = slice.reduce((sum: number, price: number) => {
      return sum + Math.pow(price - sma, 2)
    }, 0) / period
    const std = Math.sqrt(variance)
    
    middle.push(sma)
    upper.push(sma + stdDev * std)
    lower.push(sma - stdDev * std)
  }
  
  return c.json({ middle, upper, lower, period, stdDev })
})

// ============================================
// SIGNAL DETECTION API
// ============================================

// Detect trading signals
app.post('/api/signals/detect', async (c) => {
  const { prices, rsi, macd } = await c.req.json()
  
  const signals = []
  const currentPrice = prices[prices.length - 1]
  const currentRSI = rsi[rsi.length - 1]
  const currentMACD = macd.histogram[macd.histogram.length - 1]
  
  // RSI Oversold/Overbought
  if (currentRSI < 30) {
    signals.push({
      type: 'BULLISH',
      indicator: 'RSI',
      value: currentRSI.toFixed(2),
      signal: 'Oversold',
      confidence: 75,
      entryPrice: currentPrice,
      targetPrice: (currentPrice * 1.05).toFixed(2),
      stopLoss: (currentPrice * 0.97).toFixed(2)
    })
  } else if (currentRSI > 70) {
    signals.push({
      type: 'BEARISH',
      indicator: 'RSI',
      value: currentRSI.toFixed(2),
      signal: 'Overbought',
      confidence: 75,
      entryPrice: currentPrice,
      targetPrice: (currentPrice * 0.95).toFixed(2),
      stopLoss: (currentPrice * 1.03).toFixed(2)
    })
  }
  
  // MACD Crossover
  if (macd.histogram.length >= 2) {
    const prevMACD = macd.histogram[macd.histogram.length - 2]
    if (prevMACD < 0 && currentMACD > 0) {
      signals.push({
        type: 'BULLISH',
        indicator: 'MACD',
        value: currentMACD.toFixed(4),
        signal: 'Bullish Crossover',
        confidence: 80,
        entryPrice: currentPrice,
        targetPrice: (currentPrice * 1.08).toFixed(2),
        stopLoss: (currentPrice * 0.96).toFixed(2)
      })
    } else if (prevMACD > 0 && currentMACD < 0) {
      signals.push({
        type: 'BEARISH',
        indicator: 'MACD',
        value: currentMACD.toFixed(4),
        signal: 'Bearish Crossover',
        confidence: 80,
        entryPrice: currentPrice,
        targetPrice: (currentPrice * 0.92).toFixed(2),
        stopLoss: (currentPrice * 1.04).toFixed(2)
      })
    }
  }
  
  // Moving Average Analysis
  if (prices.length >= 50) {
    const sma20 = prices.slice(-20).reduce((a: number, b: number) => a + b, 0) / 20
    const sma50 = prices.slice(-50).reduce((a: number, b: number) => a + b, 0) / 50
    
    if (currentPrice > sma20 && sma20 > sma50) {
      signals.push({
        type: 'BULLISH',
        indicator: 'MA',
        value: `${sma20.toFixed(2)}/${sma50.toFixed(2)}`,
        signal: 'Bullish Trend',
        confidence: 70,
        entryPrice: currentPrice,
        targetPrice: (currentPrice * 1.06).toFixed(2),
        stopLoss: (currentPrice * 0.96).toFixed(2)
      })
    } else if (currentPrice < sma20 && sma20 < sma50) {
      signals.push({
        type: 'BEARISH',
        indicator: 'MA',
        value: `${sma20.toFixed(2)}/${sma50.toFixed(2)}`,
        signal: 'Bearish Trend',
        confidence: 70,
        entryPrice: currentPrice,
        targetPrice: (currentPrice * 0.94).toFixed(2),
        stopLoss: (currentPrice * 1.04).toFixed(2)
      })
    }
  }
  
  return c.json({ signals, timestamp: new Date().toISOString() })
})

// Pattern Recognition
app.post('/api/patterns/detect', async (c) => {
  const { prices, highs, lows } = await c.req.json()
  
  const patterns = []
  
  // Golden Cross / Death Cross detection
  if (prices.length >= 50) {
    const sma50_prev = prices.slice(-51, -1).reduce((a: number, b: number) => a + b, 0) / 50
    const sma50_curr = prices.slice(-50).reduce((a: number, b: number) => a + b, 0) / 50
    const sma200_prev = prices.slice(-201, -1).reduce((a: number, b: number) => a + b, 0) / 200
    const sma200_curr = prices.slice(-200).reduce((a: number, b: number) => a + b, 0) / 200
    
    if (sma50_prev < sma200_prev && sma50_curr > sma200_curr) {
      patterns.push({
        name: 'Golden Cross',
        type: 'BULLISH',
        confidence: 85,
        description: '50-day MA crosses above 200-day MA'
      })
    } else if (sma50_prev > sma200_prev && sma50_curr < sma200_curr) {
      patterns.push({
        name: 'Death Cross',
        type: 'BEARISH',
        confidence: 85,
        description: '50-day MA crosses below 200-day MA'
      })
    }
  }
  
  // Support/Resistance breakout
  if (highs && lows && highs.length >= 20) {
    const recentHigh = Math.max(...highs.slice(-20))
    const recentLow = Math.min(...lows.slice(-20))
    const currentPrice = prices[prices.length - 1]
    
    if (currentPrice > recentHigh * 1.02) {
      patterns.push({
        name: 'Resistance Breakout',
        type: 'BULLISH',
        confidence: 75,
        description: `Price broke above resistance at ${recentHigh.toFixed(2)}`
      })
    } else if (currentPrice < recentLow * 0.98) {
      patterns.push({
        name: 'Support Breakdown',
        type: 'BEARISH',
        confidence: 75,
        description: `Price broke below support at ${recentLow.toFixed(2)}`
      })
    }
  }
  
  return c.json({ patterns, timestamp: new Date().toISOString() })
})

// ============================================
// BACKTESTING API
// ============================================

app.post('/api/backtest/strategy', async (c) => {
  const { prices, strategy, initialCapital = 10000 } = await c.req.json()
  
  let capital = initialCapital
  let position = 0
  let trades = []
  let equity = [initialCapital]
  
  // Simple Moving Average Crossover Strategy
  if (strategy === 'sma_crossover') {
    const shortPeriod = 20
    const longPeriod = 50
    
    for (let i = longPeriod; i < prices.length; i++) {
      const shortSMA = prices.slice(i - shortPeriod, i).reduce((a: number, b: number) => a + b, 0) / shortPeriod
      const longSMA = prices.slice(i - longPeriod, i).reduce((a: number, b: number) => a + b, 0) / longPeriod
      const prevShortSMA = prices.slice(i - shortPeriod - 1, i - 1).reduce((a: number, b: number) => a + b, 0) / shortPeriod
      const prevLongSMA = prices.slice(i - longPeriod - 1, i - 1).reduce((a: number, b: number) => a + b, 0) / longPeriod
      
      // Buy signal
      if (prevShortSMA <= prevLongSMA && shortSMA > longSMA && position === 0) {
        position = capital / prices[i]
        trades.push({
          type: 'BUY',
          price: prices[i],
          quantity: position,
          date: i,
          capital: capital
        })
      }
      // Sell signal
      else if (prevShortSMA >= prevLongSMA && shortSMA < longSMA && position > 0) {
        capital = position * prices[i]
        trades.push({
          type: 'SELL',
          price: prices[i],
          quantity: position,
          date: i,
          capital: capital
        })
        position = 0
      }
      
      // Track equity
      const currentEquity = position > 0 ? position * prices[i] : capital
      equity.push(currentEquity)
    }
  }
  
  const finalCapital = position > 0 ? position * prices[prices.length - 1] : capital
  const totalReturn = ((finalCapital - initialCapital) / initialCapital) * 100
  const winningTrades = trades.filter((t, i) => i % 2 === 1 && t.capital > trades[i - 1].capital).length
  const totalTradePairs = Math.floor(trades.length / 2)
  const winRate = totalTradePairs > 0 ? (winningTrades / totalTradePairs) * 100 : 0
  
  return c.json({
    initialCapital,
    finalCapital: finalCapital.toFixed(2),
    totalReturn: totalReturn.toFixed(2),
    trades: trades.length,
    winRate: winRate.toFixed(2),
    equity,
    tradeHistory: trades
  })
})

// ============================================
// MARKET DATA SIMULATION
// ============================================

// Generate sample market data
app.get('/api/market/sample', (c) => {
  const days = 200
  const prices = []
  const highs = []
  const lows = []
  const volumes = []
  let basePrice = 100
  
  for (let i = 0; i < days; i++) {
    const change = (Math.random() - 0.48) * 3
    basePrice = Math.max(basePrice + change, 50)
    
    const open = basePrice
    const close = basePrice + (Math.random() - 0.5) * 2
    const high = Math.max(open, close) + Math.random() * 2
    const low = Math.min(open, close) - Math.random() * 2
    const volume = Math.floor(Math.random() * 1000000) + 500000
    
    prices.push(close)
    highs.push(high)
    lows.push(low)
    volumes.push(volume)
  }
  
  return c.json({ prices, highs, lows, volumes })
})

// ============================================
// FRONTEND
// ============================================

app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Algorithmic Trading Platform</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    </head>
    <body class="bg-gray-900 text-white">
        <!-- Navigation -->
        <nav class="bg-gray-800 border-b border-gray-700">
            <div class="container mx-auto px-4 py-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                        <i class="fas fa-chart-line text-blue-500 text-2xl"></i>
                        <h1 class="text-2xl font-bold">AlgoTrade Pro</h1>
                    </div>
                    <div class="flex space-x-4">
                        <button onclick="switchTab('dashboard')" id="tab-dashboard" class="tab-btn px-4 py-2 rounded bg-blue-600">
                            <i class="fas fa-chart-area mr-2"></i>Dashboard
                        </button>
                        <button onclick="switchTab('signals')" id="tab-signals" class="tab-btn px-4 py-2 rounded hover:bg-gray-700">
                            <i class="fas fa-signal mr-2"></i>Signals
                        </button>
                        <button onclick="switchTab('backtest')" id="tab-backtest" class="tab-btn px-4 py-2 rounded hover:bg-gray-700">
                            <i class="fas fa-history mr-2"></i>Backtest
                        </button>
                        <button onclick="switchTab('portfolio')" id="tab-portfolio" class="tab-btn px-4 py-2 rounded hover:bg-gray-700">
                            <i class="fas fa-briefcase mr-2"></i>Portfolio
                        </button>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <div class="container mx-auto px-4 py-6">
            <!-- Dashboard Tab -->
            <div id="content-dashboard" class="tab-content">
                <div class="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                    <div class="bg-gray-800 p-6 rounded-lg border border-gray-700">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-400 text-sm">Current Price</p>
                                <p id="current-price" class="text-2xl font-bold">$0.00</p>
                            </div>
                            <i class="fas fa-dollar-sign text-blue-500 text-3xl"></i>
                        </div>
                    </div>
                    <div class="bg-gray-800 p-6 rounded-lg border border-gray-700">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-400 text-sm">RSI (14)</p>
                                <p id="current-rsi" class="text-2xl font-bold">0.00</p>
                            </div>
                            <i class="fas fa-tachometer-alt text-green-500 text-3xl"></i>
                        </div>
                    </div>
                    <div class="bg-gray-800 p-6 rounded-lg border border-gray-700">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-400 text-sm">Active Signals</p>
                                <p id="active-signals" class="text-2xl font-bold">0</p>
                            </div>
                            <i class="fas fa-bell text-yellow-500 text-3xl"></i>
                        </div>
                    </div>
                    <div class="bg-gray-800 p-6 rounded-lg border border-gray-700">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-400 text-sm">Win Rate</p>
                                <p id="win-rate" class="text-2xl font-bold">0%</p>
                            </div>
                            <i class="fas fa-trophy text-purple-500 text-3xl"></i>
                        </div>
                    </div>
                </div>

                <div class="bg-gray-800 p-6 rounded-lg border border-gray-700 mb-6">
                    <h2 class="text-xl font-bold mb-4">Price Chart with Indicators</h2>
                    <canvas id="priceChart" height="100"></canvas>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="bg-gray-800 p-6 rounded-lg border border-gray-700">
                        <h2 class="text-xl font-bold mb-4">RSI Indicator</h2>
                        <canvas id="rsiChart" height="150"></canvas>
                    </div>
                    <div class="bg-gray-800 p-6 rounded-lg border border-gray-700">
                        <h2 class="text-xl font-bold mb-4">MACD Indicator</h2>
                        <canvas id="macdChart" height="150"></canvas>
                    </div>
                </div>
            </div>

            <!-- Signals Tab -->
            <div id="content-signals" class="tab-content hidden">
                <div class="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-xl font-bold">Live Trading Signals</h2>
                        <button onclick="detectSignals()" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
                            <i class="fas fa-sync mr-2"></i>Refresh Signals
                        </button>
                    </div>
                    <div id="signals-list" class="space-y-4">
                        <!-- Signals will be populated here -->
                    </div>
                </div>

                <div class="bg-gray-800 p-6 rounded-lg border border-gray-700 mt-6">
                    <h2 class="text-xl font-bold mb-4">Pattern Recognition</h2>
                    <div id="patterns-list" class="space-y-4">
                        <!-- Patterns will be populated here -->
                    </div>
                </div>
            </div>

            <!-- Backtest Tab -->
            <div id="content-backtest" class="tab-content hidden">
                <div class="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <h2 class="text-xl font-bold mb-4">Strategy Backtesting</h2>
                    <div class="mb-6">
                        <label class="block text-sm font-medium mb-2">Select Strategy</label>
                        <select id="strategy-select" class="bg-gray-700 border border-gray-600 rounded px-4 py-2 w-full">
                            <option value="sma_crossover">SMA Crossover (20/50)</option>
                            <option value="rsi_mean_reversion">RSI Mean Reversion</option>
                            <option value="macd_momentum">MACD Momentum</option>
                        </select>
                    </div>
                    <div class="mb-6">
                        <label class="block text-sm font-medium mb-2">Initial Capital</label>
                        <input type="number" id="initial-capital" value="10000" class="bg-gray-700 border border-gray-600 rounded px-4 py-2 w-full">
                    </div>
                    <button onclick="runBacktest()" class="bg-green-600 hover:bg-green-700 px-6 py-3 rounded w-full">
                        <i class="fas fa-play mr-2"></i>Run Backtest
                    </button>
                </div>

                <div id="backtest-results" class="bg-gray-800 p-6 rounded-lg border border-gray-700 mt-6 hidden">
                    <h2 class="text-xl font-bold mb-4">Backtest Results</h2>
                    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div class="bg-gray-700 p-4 rounded">
                            <p class="text-gray-400 text-sm">Initial Capital</p>
                            <p id="bt-initial" class="text-xl font-bold">$0</p>
                        </div>
                        <div class="bg-gray-700 p-4 rounded">
                            <p class="text-gray-400 text-sm">Final Capital</p>
                            <p id="bt-final" class="text-xl font-bold">$0</p>
                        </div>
                        <div class="bg-gray-700 p-4 rounded">
                            <p class="text-gray-400 text-sm">Total Return</p>
                            <p id="bt-return" class="text-xl font-bold">0%</p>
                        </div>
                        <div class="bg-gray-700 p-4 rounded">
                            <p class="text-gray-400 text-sm">Win Rate</p>
                            <p id="bt-winrate" class="text-xl font-bold">0%</p>
                        </div>
                    </div>
                    <canvas id="equityChart" height="100"></canvas>
                </div>
            </div>

            <!-- Portfolio Tab -->
            <div id="content-portfolio" class="tab-content hidden">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div class="bg-gray-800 p-6 rounded-lg border border-gray-700">
                        <h3 class="text-lg font-semibold mb-2">Portfolio Value</h3>
                        <p class="text-3xl font-bold text-green-500">$10,000.00</p>
                        <p class="text-sm text-gray-400 mt-2">+5.2% Today</p>
                    </div>
                    <div class="bg-gray-800 p-6 rounded-lg border border-gray-700">
                        <h3 class="text-lg font-semibold mb-2">Total P&L</h3>
                        <p class="text-3xl font-bold text-blue-500">$520.00</p>
                        <p class="text-sm text-gray-400 mt-2">15 Trades</p>
                    </div>
                    <div class="bg-gray-800 p-6 rounded-lg border border-gray-700">
                        <h3 class="text-lg font-semibold mb-2">Best Trade</h3>
                        <p class="text-3xl font-bold text-purple-500">+12.5%</p>
                        <p class="text-sm text-gray-400 mt-2">AAPL Call</p>
                    </div>
                </div>

                <div class="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <h2 class="text-xl font-bold mb-4">Open Positions</h2>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left">
                            <thead class="bg-gray-700">
                                <tr>
                                    <th class="px-4 py-3">Symbol</th>
                                    <th class="px-4 py-3">Type</th>
                                    <th class="px-4 py-3">Entry</th>
                                    <th class="px-4 py-3">Current</th>
                                    <th class="px-4 py-3">P&L</th>
                                    <th class="px-4 py-3">Action</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-700">
                                <tr>
                                    <td class="px-4 py-3">DEMO</td>
                                    <td class="px-4 py-3"><span class="bg-green-600 px-2 py-1 rounded text-xs">LONG</span></td>
                                    <td class="px-4 py-3">$100.00</td>
                                    <td class="px-4 py-3">$105.20</td>
                                    <td class="px-4 py-3 text-green-500">+5.20%</td>
                                    <td class="px-4 py-3">
                                        <button class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm">Close</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- Disclaimer Footer -->
        <footer class="bg-gray-800 border-t border-gray-700 mt-12 py-6">
            <div class="container mx-auto px-4 text-center text-gray-400 text-sm">
                <p><strong>⚠️ DEMO PLATFORM - EDUCATIONAL PURPOSES ONLY</strong></p>
                <p class="mt-2">This platform uses simulated data and does not connect to real markets or execute real trades.</p>
                <p>Trading involves substantial risk. Past performance does not guarantee future results.</p>
            </div>
        </footer>

        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app
