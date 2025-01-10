const express = require('express');
const bodyParser = require('body-parser');
const { handler } = require('./index_neon');

const app = express();
app.use(bodyParser.json());

app.all('*', async (req, res) => {
  if (req.path === '/favicon.ico') {
    res.status(204).end();
    return;
  }
  const event = {
    httpMethod: req.method,
    path: req.path,
    body: req.body ? JSON.stringify(req.body) : null,
    pathParameters: req.params,
  };
  try {
    const result = await handler(event);
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
