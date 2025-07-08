const express = require('express');
const app = express();
const { bot } = require('./index'); // Importa o bot (opcional)

app.get('/', (req, res) => {
  res.send(`
    <h1>Status do Bot</h1>
    <p>${bot ? '✅ Online' : '❌ Offline'}</p>
    <p>Última ação: ${new Date().toLocaleTimeString()}</p>
  `);
});

app.get('/status', (req, res) => {
  res.json({
    status: bot ? 'online' : 'offline',
    lastActivity: new Date().toISOString()
  });
});

app.listen(3000, () => {
  console.log('🌐 Keep-alive rodando em http://localhost:3000');
});