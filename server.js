import express from 'express';
import { streamText } from 'ai';
import { google } from '@ai-sdk/google';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const app = express();
app.use(express.json());

const systemPrompt = `You are a 3D product tour guide. The user can see a 3D Gaussian Splat model of a Nike shoe.

Available camera views:
- "front": Front view of the shoe
- "side": Side profile view
- "top": Top-down view
- "detail": Close-up detail view

When the user asks to see something, respond with JSON in this format:
{
  "view": "front|side|top|detail",
  "message": "A natural response about what they're seeing"
}

Examples:
User: "Show me the side"
Response: {"view": "side", "message": "Here's the side profile of the shoe, showing the iconic Nike swoosh."}

User: "I want to see the top"
Response: {"view": "top", "message": "Looking down at the shoe from above. You can see the lacing system and overall shape."}

Always respond with valid JSON containing both "view" and "message" fields.`;

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  const result = await streamText({
    model: google('gemini-1.5-flash'),
    system: systemPrompt,
    messages,
  });

  result.pipeDataStreamToResponse(res);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
});
