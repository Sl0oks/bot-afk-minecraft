const mineflayer = require('mineflayer');
const pathfinder = require('mineflayer-pathfinder');
const { GoalNear } = require('mineflayer-pathfinder').goals;
const vec3 = require('vec3');
const express = require('express');
const mcData = require('minecraft-data');

const config = require('./settings.json');

let bot;
const app = express();

// Função para conectar o bot
function connectBot() {
  try {
    bot = mineflayer.createBot({
      username: config['bot-account'].username,
      host: config.server.ip,
      port: config.server.port,
      version: config.server.version || false,
      auth: config['bot-account'].type
    });

    // Carrega plugins
    bot.loadPlugin(pathfinder.pathfinder);

    // Eventos
    bot.once('spawn', () => {
      console.log('✅ Bot conectado! Iniciando anti-AFK...');
      startAntiAFK();
    });

    bot.on('end', () => {
      console.log('❌ Desconectado. Reconectando em 10s...');
      setTimeout(connectBot, 10000);
    });

    bot.on('error', err => {
      console.error('⚠️ Erro:', err.message);
    });

  } catch (err) {
    console.error('Erro ao criar bot:', err);
    setTimeout(connectBot, 10000);
  }
}

// Sistema Anti-AFK Aprimorado com Redstone e interações
function startAntiAFK() {
  try {
    const movements = new pathfinder.Movements(bot, mcData(bot.version));
    const blocks = mcData(bot.version).blocksByName;

    // Lista de ações com pesos (probabilidades)
    const weightedActions = [
      { action: walkRandomly, weight: 0.3 },
      { action: jumpAndLook, weight: 0.2 },
      { action: interactRedstone, weight: 0.25 },
      { action: interactDoors, weight: 0.15 },
      { action: interactBlocks, weight: 0.1 }
    ];

    // Funções de ação individuais
    function walkRandomly() {
      const radius = 2 + Math.random() * 3;
      const angle = Math.random() * Math.PI * 2;
      const x = bot.entity.position.x + Math.cos(angle) * radius;
      const z = bot.entity.position.z + Math.sin(angle) * radius;
      bot.pathfinder.setGoal(new GoalNear(x, bot.entity.position.y, z, 1));
      console.log('🚶 Andando para posição aleatória');
    }

    function jumpAndLook() {
      bot.setControlState('jump', true);
      bot.look(Math.random() * Math.PI * 2, Math.random() * Math.PI - Math.PI/2);
      setTimeout(() => bot.setControlState('jump', false), 500);
      console.log('👀 Olhando em volta e pulando');
    }

    function interactRedstone() {
      const devices = [
        blocks.lever?.id,
        blocks.stone_button?.id,
        blocks.oak_pressure_plate?.id
      ].filter(Boolean);

      if (devices.length) {
        const device = bot.findBlock({
          matching: devices,
          maxDistance: 4
        });

        if (device) {
          bot.activateBlock(device);
          console.log('🔘 Interagindo com redstone');
        }
      }
    }

    function interactDoors() {
      const doors = [
        blocks.oak_door?.id,
        blocks.iron_door?.id,
        blocks.oak_fence_gate?.id
      ].filter(Boolean);

      if (doors.length) {
        const door = bot.findBlock({
          matching: doors,
          maxDistance: 3
        });

        if (door) {
          bot.activateBlock(door);
          console.log('🚪 Interagindo com porta');
        }
      }
    }

    function interactBlocks() {
      const interactables = [
        blocks.chest?.id,
        blocks.furnace?.id,
        blocks.crafting_table?.id
      ].filter(Boolean);

      if (interactables.length) {
        const block = bot.findBlock({
          matching: interactables,
          maxDistance: 3
        });

        if (block) {
          bot.activateBlock(block);
          console.log('🖐️ Interagindo com bloco');
        }
      }
    }

    // Seleciona ação baseada no peso
    function getRandomAction() {
      const totalWeight = weightedActions.reduce((sum, {weight}) => sum + weight, 0);
      let random = Math.random() * totalWeight;

      for (const {action, weight} of weightedActions) {
        if (random < weight) return action;
        random -= weight;
      }

      return weightedActions[0].action;
    }

    // Executa ações em intervalos variados
    function executeAction() {
      try {
        const action = getRandomAction();
        action();

        const nextInterval = 8000 + Math.random() * 12000;
        setTimeout(executeAction, nextInterval);

      } catch (err) {
        console.error('Erro na ação:', err);
        setTimeout(executeAction, 10000);
      }
    }

    // Inicia o ciclo
    executeAction();

    // Sistema de agachamento
    if (config.utils.antiAfk?.sneak) {
      setInterval(() => {
        bot.setControlState('sneak', true);
        setTimeout(() => bot.setControlState('sneak', false), 
          1500 + Math.random() * 2000);
      }, 10000 + Math.random() * 15000);
    }

  } catch (err) {
    console.error('Erro no Anti-AFK:', err);
  }
}

// Servidor web
app.get('/', (req, res) => res.send('Bot Online'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Servidor web na porta ${PORT}`);
  connectBot();
});

// Tratamento de erros
process.on('uncaughtException', (err) => {
  console.error('Erro não tratado:', err);
});