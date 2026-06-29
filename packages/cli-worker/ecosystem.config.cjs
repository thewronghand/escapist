module.exports = {
  apps: [
    {
      name: 'escapist-worker',
      script: 'node',
      args: '--env-file=.env --import tsx/esm src/index.ts',
      cwd: __dirname,
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
      },
      max_restarts: 10,
      min_uptime: '5s',
      restart_delay: 3000,
      out_file: './logs/worker-out.log',
      error_file: './logs/worker-err.log',
      time: true,
    },
    {
      name: 'escapist-admin',
      script: 'node',
      args: '--env-file=.env --import tsx/esm src/admin-session.ts',
      cwd: __dirname,
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
      },
      max_restarts: 20,
      min_uptime: '3s',
      restart_delay: 5000,
      out_file: './logs/admin-out.log',
      error_file: './logs/admin-err.log',
      time: true,
    },
  ],
}
