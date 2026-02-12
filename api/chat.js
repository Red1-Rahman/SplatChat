import { google } from '@ai-sdk/google';  // ← Changed from openai
import { streamText } from 'ai';

export const runtime = 'edge';

const SYSTEM_PROMPT = `You are an enthusiastic 3D tour guide. You control a camera viewing a photorealistic 3D scene.

AVAILABLE VIEWS:
- "front": Wide view of entire scene
- "side": Profile angle showing depth
- "top": Bird's eye overhead view
- "detail": Close-up of key features

CRITICAL RULES:
1. ALWAYS respond with ONLY valid JSON in this exact format:
   {"message": "your response here", "view": "waypoint_name"}

2. Pick a view for EVERY response (use "front" if unsure)

3. Keep messages under 2 sentences

4. Match user intent:
   - "show/look/see" → appropriate view
   - "overview" → front
   - "side/profile" → side  
   - "above/overhead" → top
   - "closer/zoom/detail" → detail

EXAMPLES:
Input: "show me the side"
Output: {"message": "Here's the side profile—notice the depth!", "view": "side"}

Input: "what is this?"
Output: {"message": "This is a detailed 3D scan. Starting with the full view.", "view": "front"}

NO markdown, NO backticks, ONLY the JSON object.`;

export default async function handler(req) {
  try {
    const { messages } = await req.json();

    const result = await streamText({
      model: google('gemini-1.5-flash'),
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
      temperature: 0.3,
      maxTokens: 100,
    });

    return result.toUIMessageStreamResponse();
    
  } catch (error) {
    console.error('AI API Error:', error);
    return new Response(
      JSON.stringify({ 
        message: "Let me show you the front view.", 
        view: "front" 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}