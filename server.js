import express from 'express';
import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const app = express();
app.use(express.json());

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const cameraSchema = z.object({
  view: z.enum(['front', 'side', 'top', 'detail']),
  message: z.string(),
});

const systemPrompt = `You are a 3D product tour guide for a Nike shoe 3D model.
Choose the best camera view based on what the user wants to see.`;

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    const cleanMessages = messages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    const result = await generateObject({
      model: google('gemini-2.5-flash'), // ✅ correct
      schema: cameraSchema,
      system: systemPrompt,
      messages: cleanMessages,
      temperature: 0.2,
      maxTokens: 80,
    });

    res.json({
      data: result.object,   // { view, message }
      usage: result.usage,
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
});
