module.exports = {
  apps : [{
    name: 'taylorgriffin.io.api',
    script: 'start',
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
    production : {
      user : 'ubuntu',
      host : '44.230.185.161',
      ref  : 'origin/master',
      repo : 'https://github.com/taylorrgriffin/taylorgriffin.io.api.git',
      path : '/var/www/production',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};
