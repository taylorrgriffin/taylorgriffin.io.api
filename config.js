module.exports = {
  development: {
    
  },
  test: {

  },
  production: {
    privateKey: '/etc/letsencrypt/live/api.taylorgriffin.io/privkey.pem',
    certificate: '/etc/letsencrypt/live/api.taylorgriffin.io/cert.pem',
    certificateAuthority: '/etc/letsencrypt/live/api.taylorgriffin.io/chain.pem',
  }
}