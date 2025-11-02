// Runner to set DEV_STUB and alternate PORT then start server.js
process.env.PORT = process.env.PORT || '3044';
process.env.DEV_STUB = 'true';
require('./server.js');
