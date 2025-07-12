const express = require('express');
const { serverConfig } = require('./config');

const app = express();
app.use(express.json());

const PORT = serverConfig.PORT;
app.listen(PORT, () => {
  console.log(`Server running on PORT: ${PORT}`);
});