import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { question, model = 'gpt-3.5-turbo' } = req.body;

  if (!question) {
    return res.status(400).json({ message: 'Question is required' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ message: 'OpenAI API key not configured' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'user',
          content: question,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const answer = completion.choices[0]?.message?.content;

    if (!answer) {
      return res.status(500).json({ message: 'No response from OpenAI' });
    }

    res.status(200).json({ 
      answer,
      usage: completion.usage 
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    
    if (error.status === 401) {
      return res.status(401).json({ message: 'Invalid OpenAI API key' });
    }
    
    if (error.status === 429) {
      return res.status(429).json({ message: 'Rate limit exceeded. Please try again later.' });
    }

    res.status(500).json({ 
      message: 'Failed to get response from ChatGPT',
      error: error.message 
    });
  }
}
