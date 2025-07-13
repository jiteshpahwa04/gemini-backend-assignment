const express = require('express');
const { serverConfig } = require('./config');
const { errorHandler } = require('./utils/error');
const router = require('./routers');
const webhookRouter = require('./routers/webhook-router');

const app = express();
app.use(
  '/webhook',
  express.raw({ type: 'application/json' }),
  webhookRouter
);

app.use(express.json());

app.use(router);

app.use(errorHandler);

const PORT = serverConfig.PORT;
app.listen(PORT, () => {
  console.log(`Server running on PORT: ${PORT}`);
});