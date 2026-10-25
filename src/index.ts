import app from './app.js';
import config from './config/config.js';

const server = app.listen(config.port, () => {
  console.log(`=========================================`);
  console.log(`🚀 HiAnime Scraper API is running!`);
  console.log(`📍 Port: http://localhost:${config.port}`);
  console.log(`📡 Main Base URL: ${config.baseUrl}`);
  console.log(`🪞 Mirrors (${config.mirrors.length}): ${config.mirrors.join(', ')}`);
  console.log(`🔗 Home Feed: http://localhost:${config.port}/api/v1/hianime/home`);
  console.log(`=========================================`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

export default server;
