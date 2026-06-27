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
  ],
}
