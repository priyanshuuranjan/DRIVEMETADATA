const kafka = require('kafka-node');
const pool = require('./db');
require('dotenv').config();

const client = new kafka.KafkaClient({ kafkaHost: process.env.KAFKA_BROKER });
const consumer = new kafka.Consumer(
  client,
  [{ topic: process.env.KAFKA_TOPIC }],
  { autoCommit: true }
);

consumer.on('message', async (message) => {
  console.log('Message received from Kafka:', message.value);
  const data = JSON.parse(message.value);

  const query = `
    INSERT INTO registrations (name, email, mobile, city)
    VALUES ($1, $2, $3, $4)
  `;
  try {
    await pool.query(query, [data.name, data.email, data.mobile, data.city]);
    console.log('Data inserted into PostgreSQL');
  } catch (err) {
    console.error('Error inserting data into PostgreSQL:', err);
  }
});

consumer.on('error', (err) => console.error('Kafka Consumer Error:', err));
