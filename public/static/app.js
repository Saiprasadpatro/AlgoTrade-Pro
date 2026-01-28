// Global data storage
let marketData = {
  prices: [],
  highs: [],
  lows: [],
  volumes: [],
  rsi: [],
  macd: null,
  bollinger: null,
  signals: [],
  patterns: []
};

let charts = {
  price: null,
  rsi: null,
  macd: null,
  equity: null
};

// Initialize application
async function init() {
  console.log('Initializing AlgoTrade Pro...');
  await loadMarketData();
  await calculateIndicators();
  await detectSignals();
  await detectPatterns();
  renderCharts();
  updateDashboard();
}

// Load sample market data
async function loadMarketData() {
  try {
    const response = await axios.get('/api/market/sample');
    marketData.prices = response.data.prices;
    marketData.highs = response.data.highs;
    marketData.lows = response.data.lows;
    marketData.volumes = response.data.volumes;
    console.log('Market data loaded:', marketData.prices.length, 'data points');
  } catch (error) {
    console.error('Error loading market data:', error);
  }
}

// Calculate all technical indicators
async function calculateIndicators() {
  try {
    // Calculate RSI
    const rsiResponse = await axios.post('/api/indicators/rsi', {
      prices: marketData.prices,
      period: 14
    });
    marketData.rsi = rsiResponse.data.rsi;

    // Calculate MACD
    const macdResponse = await axios.post('/api/indicators/macd', {
      prices: marketData.prices,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9
    });
    marketData.macd = macdResponse.data;

    // Calculate Bollinger Bands
    const bollingerResponse = await axios.post('/api/indicators/bollinger', {
      prices: marketData.prices,
      period: 20,
      stdDev: 2
    });
    marketData.bollinger = bollingerResponse.data;

    console.log('Indicators calculated successfully');
  } catch (error) {
    console.error('Error calculating indicators:', error);
  }
}

// Detect trading signals
async function detectSignals() {
  try {
    const response = await axios.post('/api/signals/detect', {
      prices: marketData.prices,
      rsi: marketData.rsi,
      macd: marketData.macd
    });
    marketData.signals = response.data.signals;
    console.log('Signals detected:', marketData.signals.length);
    renderSignals();
  } catch (error) {
    console.error('Error detecting signals:', error);
  }
}

// Detect patterns
async function detectPatterns() {
  try {
    const response = await axios.post('/api/patterns/detect', {
      prices: marketData.prices,
      highs: marketData.highs,
      lows: marketData.lows
    });
    marketData.patterns = response.data.patterns;
    console.log('Patterns detected:', marketData.patterns.length);
    renderPatterns();
  } catch (error) {
    console.error('Error detecting patterns:', error);
  }
}

// Render all charts
function renderCharts() {
  renderPriceChart();
  renderRSIChart();
  renderMACDChart();
}

// Render price chart with Bollinger Bands
function renderPriceChart() {
  const ctx = document.getElementById('priceChart');
  if (!ctx) return;

  if (charts.price) {
    charts.price.destroy();
  }

  const labels = marketData.prices.map((_, i) => i);
  const bollingerOffset = marketData.prices.length - marketData.bollinger.middle.length;

  charts.price = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Price',
          data: marketData.prices,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          pointRadius: 0,
          fill: true
        },
        {
          label: 'Upper Band',
          data: Array(bollingerOffset).fill(null).concat(marketData.bollinger.upper),
          borderColor: 'rgba(239, 68, 68, 0.5)',
          borderWidth: 1,
          pointRadius: 0,
          borderDash: [5, 5],
          fill: false
        },
        {
          label: 'Middle Band',
          data: Array(bollingerOffset).fill(null).concat(marketData.bollinger.middle),
          borderColor: 'rgba(156, 163, 175, 0.5)',
          borderWidth: 1,
          pointRadius: 0,
          borderDash: [5, 5],
          fill: false
        },
        {
          label: 'Lower Band',
          data: Array(bollingerOffset).fill(null).concat(marketData.bollinger.lower),
          borderColor: 'rgba(34, 197, 94, 0.5)',
          borderWidth: 1,
          pointRadius: 0,
          borderDash: [5, 5],
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          labels: { color: 'white' }
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        x: {
          display: true,
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          ticks: { color: 'white' }
        },
        y: {
          display: true,
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          ticks: { color: 'white' }
        }
      }
    }
  });
}

// Render RSI chart
function renderRSIChart() {
  const ctx = document.getElementById('rsiChart');
  if (!ctx) return;

  if (charts.rsi) {
    charts.rsi.destroy();
  }

  const labels = marketData.rsi.map((_, i) => i);

  charts.rsi = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'RSI',
          data: marketData.rsi,
          borderColor: 'rgb(168, 85, 247)',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          borderWidth: 2,
          pointRadius: 0,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          labels: { color: 'white' }
        },
        annotation: {
          annotations: {
            oversold: {
              type: 'line',
              yMin: 30,
              yMax: 30,
              borderColor: 'rgba(34, 197, 94, 0.5)',
              borderWidth: 2,
              borderDash: [5, 5]
            },
            overbought: {
              type: 'line',
              yMin: 70,
              yMax: 70,
              borderColor: 'rgba(239, 68, 68, 0.5)',
              borderWidth: 2,
              borderDash: [5, 5]
            }
          }
        }
      },
      scales: {
        x: {
          display: true,
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          ticks: { color: 'white' }
        },
        y: {
          min: 0,
          max: 100,
          display: true,
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          ticks: { color: 'white' }
        }
      }
    }
  });
}

// Render MACD chart
function renderMACDChart() {
  const ctx = document.getElementById('macdChart');
  if (!ctx) return;

  if (charts.macd) {
    charts.macd.destroy();
  }

  const labels = marketData.macd.histogram.map((_, i) => i);

  charts.macd = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Histogram',
          data: marketData.macd.histogram,
          backgroundColor: marketData.macd.histogram.map(v => v >= 0 ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)'),
          borderWidth: 0
        },
        {
          label: 'MACD',
          data: Array(marketData.macd.macdLine.length - marketData.macd.histogram.length).fill(null).concat(marketData.macd.macdLine.slice(-marketData.macd.histogram.length)),
          type: 'line',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 2,
          pointRadius: 0,
          fill: false
        },
        {
          label: 'Signal',
          data: marketData.macd.signalLine,
          type: 'line',
          borderColor: 'rgb(249, 115, 22)',
          borderWidth: 2,
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          labels: { color: 'white' }
        }
      },
      scales: {
        x: {
          display: true,
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          ticks: { color: 'white' }
        },
        y: {
          display: true,
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          ticks: { color: 'white' }
        }
      }
    }
  });
}

// Update dashboard metrics
function updateDashboard() {
  const currentPrice = marketData.prices[marketData.prices.length - 1];
  const currentRSI = marketData.rsi[marketData.rsi.length - 1];
  
  document.getElementById('current-price').textContent = `$${currentPrice.toFixed(2)}`;
  document.getElementById('current-rsi').textContent = currentRSI.toFixed(2);
  document.getElementById('active-signals').textContent = marketData.signals.length;
  
  // Calculate average confidence as win rate
  if (marketData.signals.length > 0) {
    const avgConfidence = marketData.signals.reduce((sum, s) => sum + s.confidence, 0) / marketData.signals.length;
    document.getElementById('win-rate').textContent = `${avgConfidence.toFixed(0)}%`;
  }
}

// Render signals list
function renderSignals() {
  const signalsList = document.getElementById('signals-list');
  if (!signalsList) return;

  if (marketData.signals.length === 0) {
    signalsList.innerHTML = '<p class="text-gray-400">No active signals detected.</p>';
    return;
  }

  signalsList.innerHTML = marketData.signals.map(signal => `
    <div class="bg-gray-700 p-4 rounded-lg border-l-4 ${signal.type === 'BULLISH' ? 'border-green-500' : 'border-red-500'}">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <i class="fas ${signal.type === 'BULLISH' ? 'fa-arrow-up text-green-500' : 'fa-arrow-down text-red-500'} text-2xl"></i>
          <div>
            <h3 class="font-bold text-lg">${signal.type} Signal</h3>
            <p class="text-sm text-gray-400">${signal.indicator} - ${signal.signal}</p>
          </div>
        </div>
        <div class="text-right">
          <div class="bg-blue-600 px-3 py-1 rounded text-sm font-semibold">
            ${signal.confidence}% Confidence
          </div>
        </div>
      </div>
      <div class="grid grid-cols-3 gap-4 mt-4 text-sm">
        <div>
          <p class="text-gray-400">Entry Price</p>
          <p class="font-semibold">$${signal.entryPrice}</p>
        </div>
        <div>
          <p class="text-gray-400">Target</p>
          <p class="font-semibold text-green-500">$${signal.targetPrice}</p>
        </div>
        <div>
          <p class="text-gray-400">Stop Loss</p>
          <p class="font-semibold text-red-500">$${signal.stopLoss}</p>
        </div>
      </div>
    </div>
  `).join('');
}

// Render patterns list
function renderPatterns() {
  const patternsList = document.getElementById('patterns-list');
  if (!patternsList) return;

  if (marketData.patterns.length === 0) {
    patternsList.innerHTML = '<p class="text-gray-400">No patterns detected in current market conditions.</p>';
    return;
  }

  patternsList.innerHTML = marketData.patterns.map(pattern => `
    <div class="bg-gray-700 p-4 rounded-lg border-l-4 ${pattern.type === 'BULLISH' ? 'border-green-500' : 'border-red-500'}">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="font-bold text-lg">${pattern.name}</h3>
          <p class="text-sm text-gray-400">${pattern.description}</p>
        </div>
        <div class="text-right">
          <span class="px-3 py-1 rounded text-sm font-semibold ${pattern.type === 'BULLISH' ? 'bg-green-600' : 'bg-red-600'}">
            ${pattern.type}
          </span>
          <p class="text-sm text-gray-400 mt-1">${pattern.confidence}% confidence</p>
        </div>
      </div>
    </div>
  `).join('');
}

// Run backtest
async function runBacktest() {
  const strategy = document.getElementById('strategy-select').value;
  const initialCapital = parseFloat(document.getElementById('initial-capital').value);

  try {
    const response = await axios.post('/api/backtest/strategy', {
      prices: marketData.prices,
      strategy: strategy,
      initialCapital: initialCapital
    });

    const results = response.data;
    
    // Update results display
    document.getElementById('bt-initial').textContent = `$${results.initialCapital.toLocaleString()}`;
    document.getElementById('bt-final').textContent = `$${parseFloat(results.finalCapital).toLocaleString()}`;
    
    const returnColor = parseFloat(results.totalReturn) >= 0 ? 'text-green-500' : 'text-red-500';
    document.getElementById('bt-return').innerHTML = `<span class="${returnColor}">${results.totalReturn}%</span>`;
    document.getElementById('bt-winrate').textContent = `${results.winRate}%`;

    // Show results section
    document.getElementById('backtest-results').classList.remove('hidden');

    // Render equity curve
    renderEquityCurve(results.equity);

    console.log('Backtest completed:', results);
  } catch (error) {
    console.error('Error running backtest:', error);
    alert('Error running backtest. Please try again.');
  }
}

// Render equity curve chart
function renderEquityCurve(equityData) {
  const ctx = document.getElementById('equityChart');
  if (!ctx) return;

  if (charts.equity) {
    charts.equity.destroy();
  }

  const labels = equityData.map((_, i) => i);

  charts.equity = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Portfolio Equity',
          data: equityData,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderWidth: 2,
          pointRadius: 0,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          labels: { color: 'white' }
        }
      },
      scales: {
        x: {
          display: true,
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          ticks: { color: 'white' }
        },
        y: {
          display: true,
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          ticks: { 
            color: 'white',
            callback: function(value) {
              return '$' + value.toLocaleString();
            }
          }
        }
      }
    }
  });
}

// Tab switching
function switchTab(tabName) {
  // Hide all content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.add('hidden');
  });
  
  // Remove active state from all buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('bg-blue-600');
    btn.classList.add('hover:bg-gray-700');
  });
  
  // Show selected content
  document.getElementById(`content-${tabName}`).classList.remove('hidden');
  
  // Add active state to selected button
  const activeBtn = document.getElementById(`tab-${tabName}`);
  activeBtn.classList.add('bg-blue-600');
  activeBtn.classList.remove('hover:bg-gray-700');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
