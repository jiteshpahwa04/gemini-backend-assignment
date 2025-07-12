const express = require('express');
const { serverConfig } = require('./config');
const { errorHandler } = require('./utils/error');

const app = express();
app.use(express.json());

app.use(errorHandler);

const PORT = serverConfig.PORT;
app.listen(PORT, () => {
  console.log(`Server running on PORT: ${PORT}`);
});