const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Прокси для Binance API
app.use('/binance-api', createProxyMiddleware({
  target: 'https://api.binance.com',
  changeOrigin: true,
  pathRewrite: {
    '^/binance-api': ''
  },
  onProxyReq: (proxyReq, req, res) => {
    // Убираем лишние заголовки которые могут вызывать CORS
    proxyReq.removeHeader('origin');
    proxyReq.removeHeader('referer');
  }
}));

// Прокси для Binance WebSocket
app.use('/binance-ws', createProxyMiddleware({
  target: 'wss://stream.binance.com:9443',
  changeOrigin: true,
  ws: true,
  pathRewrite: {
    '^/binance-ws': ''
  }
}));

// Статические файлы из dist
app.use(express.static(path.join(__dirname, 'dist')));

// Все остальные запросы возвращают index.html для SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Binance API proxy: http://localhost:${PORT}/binance-api`);
  console.log(`Binance WebSocket proxy: ws://localhost:${PORT}/binance-ws`);
}); 