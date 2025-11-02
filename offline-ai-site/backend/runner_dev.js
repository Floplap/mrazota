// Runner to set DEV_STUB and an alternate PORT then start server.js
process.env.PORT = process.env.PORT || '3022';
process.env.DEV_STUB = 'true';
require('./server.js');
