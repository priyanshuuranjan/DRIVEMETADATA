const express = require('express');
const bodyParser = require('body-parser');
const redisClient = require('./redisClient');
const sendToKafka = require('./producer');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

app.post('/register', async (req, res) => {
  const { name, email, mobile, city } = req.body;
  const clientId = req.headers.client_id;

  if (!clientId) return res.status(400).send({ error: 'Client_id header is required.' });

  try {
    redisClient.get('client_status', (err, status) => {
      if (err) return res.status(500).send({ error: 'Redis Error', details: err });

      if (status === 'active') {
        const message = { name, email, mobile, city };
        sendToKafka(process.env.KAFKA_TOPIC, message);
        res.status(200).send({ message: 'Registration queued successfully.' });
      } else {
        res.status(403).send({ error: 'Client status not active.' });
      }
    });
  } catch (err) {
    res.status(500).send({ error: 'Server Error', details: err });
  }
});

app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
