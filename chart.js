// Fetch chart data and handle fallback
async function fetchChartData() {
    try {
        // Attempt to fetch candlestick chart data
        const candlestickResponse = await fetch('https://api.dexscreener.com/latest/dex/pairs/fuwuqtctdsgtpw4ypxmsvnhw5txno65rohxztak5xkf4');
        if (!candlestickResponse.ok) throw new Error('Failed to fetch candlestick data');
        const candlestickData = await candlestickResponse.json();

        // If candlestick data exists, render the chart
        if (candlestickData && candlestickData.pairs && candlestickData.pairs.length > 0) {
            const tokenInfo = candlestickData.pairs[0];
            renderCandlestickChart(tokenInfo);
        } else {
            // Fallback to summary data if no candlestick data
            console.error('Candlestick data unavailable. Fetching fallback data...');
            await fetchFallbackSummary();
        }
    } catch (error) {
        console.error('Error fetching candlestick chart:', error);
        await fetchFallbackSummary();
    }
}

// Fallback to summary data
async function fetchFallbackSummary() {
    try {
        const response = await fetch('https://api.dexscreener.com/latest/dex/tokens/DdyoGjgQVT8UV8o7DoyVrBt5AfjrdZr32cfBMvbbPNHM');
        if (!response.ok) throw new Error('Failed to fetch fallback summary data');
        const summaryData = await response.json();

        if (summaryData && summaryData.pairs && summaryData.pairs.length > 0) {
            const tokenInfo = summaryData.pairs[0];
            renderSummary(tokenInfo);
        } else {
            console.error('No trading pairs found for fallback data.');
            showFallbackUI();
        }
    } catch (error) {
        console.error('Error fetching fallback summary data:', error);
        showFallbackUI();
    }
}

// Render candlestick chart
function renderCandlestickChart(tokenInfo) {
    const ctx = document.getElementById('chartCanvas').getContext('2d');
    const config = {
        type: 'line',
        data: {
            labels: tokenInfo.candlestick.map(item => new Date(item.time).toLocaleTimeString()),
            datasets: [
                {
                    label: 'Price (USD)',
                    data: tokenInfo.candlestick.map(item => item.price),
                    borderColor: 'rgba(50, 205, 50, 1)',
                    backgroundColor: 'rgba(50, 205, 50, 0.5)',
                    fill: false,
                },
            ],
        },
        options: {
            responsive: true,
            scales: {
                x: { type: 'time', time: { unit: 'minute' } },
                y: { beginAtZero: true },
            },
        },
    };
    new Chart(ctx, config);
}

// Render summary data
function renderSummary(tokenInfo) {
    const summaryElement = document.getElementById('chart-summary');
    summaryElement.innerHTML = `
        <strong>Price:</strong> ${parseFloat(tokenInfo.priceUsd).toFixed(8)} USD<br>
        <strong>24h Change:</strong> ${tokenInfo.priceChange.h24}%<br>
        <strong>Liquidity:</strong> $${tokenInfo.liquidity.usd.toLocaleString()}<br>
        <strong>24h Volume:</strong> $${tokenInfo.volume.h24.toLocaleString()}
    `;

    // Hide candlestick chart and show fallback elements
    document.getElementById('chartCanvas').style.display = 'none';
    document.getElementById('chart-video').style.display = 'block';
    document.getElementById('fallback-message').textContent = 'Oops! The chart hasn’t loaded. Heidrun went to check what happened!';
    document.getElementById('fallback-message').style.display = 'block';
    document.getElementById('fallback-button').style.display = 'inline-block';
}

// Show fallback UI if everything fails
function showFallbackUI() {
    document.getElementById('chartCanvas').style.display = 'none';
    document.getElementById('chart-video').style.display = 'block';
    document.getElementById('fallback-message').textContent = 'Oops! The chart hasn’t loaded. Heidrun went to check what happened!';
    document.getElementById('fallback-message').style.display = 'block';
    document.getElementById('fallback-button').style.display = 'inline-block';
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', fetchChartData);