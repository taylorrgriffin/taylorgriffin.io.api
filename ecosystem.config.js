module.exports = {
  apps : [{
    name: 'taylorgriffin.io.api',
    script: 'npm start',
    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }],
  deploy : {
    "production" : {
      "user" : 'ubuntu',
      "key"  : "taylorgriffinio.pem",
      "host" : '44.230.185.161',
      "ref"  : 'origin/master',
      "repo" : 'https://github.com/taylorrgriffin/taylorgriffin.io.api.git',
      "path" : '/home/ubuntu/www/api',
      "pre-deploy-local" : "if [ ! -f taylorgriffinio.pem ]; then echo 'Failed to locate file: taylorgriffinio.pem' && exit 1; else exit 0; fi",
      "post-deploy"      : 'npm install && npm run-script python-ast-install && pm2 reload ecosystem.config.js --env production',
    }
  }
};
