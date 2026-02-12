import express from 'express';
import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const app = express();
app.use(express.json());

// ✅ Proper Google AI Studio provider
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// ✅ Strict schema — Gemini MUST obey this
const cameraSchema = z.object({
  view: z.enum(['front', 'side', 'top', 'detail']),
  message: z.string(),
});

const systemPrompt = `You are a 3D product tour guide for a Nike shoe 3D model.
When the user asks to see something, choose the best camera view and describe it.

Respond ONLY with the required fields.`;

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    const result = await generateObject({
      model: google('models/gemini-2.5-flash'), // ✅ free tier best
      schema: cameraSchema,             // ✅ forces structure
      system: systemPrompt,
      messages,
      temperature: 0.2,
      maxTokens: 80,
    });

    // ✅ This is already a JS object, not text
    res.json({
      data: result.object,
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
