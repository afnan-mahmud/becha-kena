module.exports = {
  apps: [
    {
      name: 'backend',
      script: 'dist/server.js',
      cwd: './backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
  ],

  // Frontend Note:
  // Frontend is a Vite React SPA (static files after build).
  // Nginx serves /var/www/becha-kena/frontend/dist directly.
  // No PM2 needed for frontend.
  //
  // Build command: cd /var/www/becha-kena/frontend && npm run build
};
