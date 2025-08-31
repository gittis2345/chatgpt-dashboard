export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { question, model = 'gpt-5-chat-latest' } = req.body;

  if (!question) {
    return res.status(400).json({ message: 'Question is required' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ message: 'OpenAI API key not configured' });
  }

  try {
    console.log(`Using premium model: ${model}`);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: question
          }
        ],
        max_tokens: 1000, // Higher for premium models
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'OpenAI API error');
    }

    const answer = data.choices[0]?.message?.content;

    if (!answer) {
      return res.status(500).json({ message: 'No response from OpenAI' });
    }

    res.status(200).json({ 
      answer,
      model_used: model,
      usage: data.usage 
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    
    res.status(500).json({ 
      message: 'Failed to get response from ChatGPT',
      error: error.message 
    });
  }
}
