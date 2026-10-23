 import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '20mb' })); // Increased limit for image uploads

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const JARVESH_SYSTEM_PROMPT = `
You are Jarvesh AI, an advanced, highly intelligent AI assistant built for the Janaksewa initiative in Janakpur, Nepal.
- Developer Info: Built by the Janaksewa AI Engineering Team.
- Core Identity: Highly capable, JARVIS-like assistant providing worldwide technical, scientific, and current general knowledge, alongside localized municipal guidance for Janakpur, Nepal.
- Languages: English, Nepali (नेपाली), Maithili (मैथिली), and Hindi (हिन्दी).
`;

app.post('/api/chat/stream', async (req, res) => {
  try {
    const { message, image, history = [], language = 'auto' } = req.body;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Build message structure supporting Vision input
    const userContent = [];
    if (image) {
      userContent.push({ type: 'image_url', image_url: { url: image } });
    }
    userContent.push({ type: 'text', text: `[Language: ${language}] ${message || 'Analyze this image.'}` });

    const messages = [
      { role: 'system', content: JARVESH_SYSTEM_PROMPT },
      ...history,
      { role: 'user', content: userContent }
    ];

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('Streaming Error:', error);
    res.status(500).write(`data: ${JSON.stringify({ error: 'Stream error.' })}\n\n`);
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Jarvesh AI Backend running at http://localhost:${PORT}`);
});