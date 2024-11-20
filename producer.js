const kafka = require('kafka-node');
require('dotenv').config();

const client = new kafka.KafkaClient({ kafkaHost: process.env.KAFKA_BROKER });
const producer = new kafka.Producer(client);

producer.on('ready', () => console.log('Kafka Producer is connected and ready.'));
producer.on('error', (err) => console.error('Kafka Producer Error:', err));

const sendToKafka = (topic, message) => {
  const payloads = [{ topic, messages: JSON.stringify(message) }];
  producer.send(payloads, (err, data) => {
    if (err) console.error('Error in Kafka Producer:', err);
    else console.log('Message sent to Kafka:', data);
  });
};

module.exports = sendToKafka;
