// NB - SharePoint and IIS are a real PoS. See: https://github.com/joyent/node/issues/5119
module.exports = {
  SP_ONLINE_TIMEOUT : 5000,
  SP_ONLINE_SECURITY_OPTIONS : {
    secureOptions: require('constants').SSL_OP_NO_TLSv1_2,
    ciphers: 'ECDHE-RSA-AES256-SHA:AES256-SHA:RC4-SHA:RC4:HIGH:!MD5:!aNULL:!EDH:!AESGCM',
    honorCipherOrder: true,
    strictSSL : false
  },
  STS_LOGIN_URL : 'https://login.microsoftonline.com/extSTS.srf'
};
