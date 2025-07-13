require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const redis = require('../utils/redisClient');

const REQUEST_STREAM = 'gemini:requests';
const CONSUMER_GROUP = 'gemini-workers';
const CONSUMER_NAME = 'worker-1';

// Instantiate the Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

/**
 * Convert the flat array of stream fields into an object.
 */
function fieldsToObject(fieldsArray) {
  const obj = {};
  for (let i = 0; i < fieldsArray.length; i += 2) {
    obj[fieldsArray[i]] = fieldsArray[i + 1];
  }
  return obj;
}

async function startWorker() {
  // Create the consumer group if it doesn't exist
  try {
    await redis.xGroupCreate(REQUEST_STREAM, CONSUMER_GROUP, '0', { MKSTREAM: true });
    console.log(`👥 Created consumer group "${CONSUMER_GROUP}" on "${REQUEST_STREAM}"`);
  } catch (err) {
    if (err.message.includes('BUSYGROUP')) {
      console.log(`👥 Consumer group "${CONSUMER_GROUP}" already exists, skipping creation`);
    } else {
      console.error('Error creating consumer group:', err);
      process.exit(1);
    }
  }


  console.log('🤖 Gemini worker started, waiting for messages...');

  // Continuously read new entries
  while (true) {
    try {
      const streams = await redis.sendCommand([
        'XREADGROUP',
        'GROUP', CONSUMER_GROUP, CONSUMER_NAME,
        'COUNT', '1',
        'BLOCK', '0',
        'STREAMS', REQUEST_STREAM, '>',
      ]);

      if (!streams) continue; // no entries, loop again

      const [, entries] = streams[0];
      for (const [id, fields] of entries) {
        const msg = fieldsToObject(fields);
        const { correlationId, content } = msg;

        try {
          // Call Gemini
          const res = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: content,
          });

          const aiText = res.text;

          // Publish the AI response on the Pub/Sub channel
          const channel = `gemini:response:${correlationId}`;
          await redis.publish(channel, JSON.stringify({ text: aiText }));

          // Acknowledge the processed stream entry
          await redis.xAck(REQUEST_STREAM, CONSUMER_GROUP, id);
        } catch (apiErr) {
          console.error('Error calling Gemini or publishing response:', apiErr);
        }
      }
    } catch (streamErr) {
      console.error('Error reading from stream:', streamErr);
      // small delay before retrying to avoid a tight error loop
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

startWorker().catch(err => {
  console.error('Worker failed to start:', err);
  process.exit(1);
});