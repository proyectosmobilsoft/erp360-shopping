const express = require('express');
const supplierAPI = require('./api/supplierAPI.cjs');

const app = express();
const port = 3000;

app.use(express.json());
app.use('/api', supplierAPI);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});