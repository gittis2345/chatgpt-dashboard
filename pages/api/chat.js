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

  // Try different models in order of preference
  const modelsToTry = [
    model, // User selected model
    'gpt-3.5-turbo',
    'gpt-4o-mini',
    'text-davinci-003' // Older model that might work
  ];

  for (const testModel of modelsToTry) {
    try {
      console.log(`Trying model: ${testModel}`);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: testModel,
          messages: [
            {
              role: 'user',
              content: question
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      const data = await response.json();

      if (response.ok) {
        const answer = data.choices[0]?.message?.content;
        return res.status(200).json({ 
          answer,
          model_used: testModel,
          usage: data.usage 
        });
      } else if (response.status === 403) {
        console.log(`Model ${testModel} not accessible, trying next...`);
        continue; // Try next model
      } else {
        throw new Error(data.error?.message || 'OpenAI API error');
      }

    } catch (error) {
      console.error(`Error with model ${testModel}:`, error.message);
      continue; // Try next model
    }
  }

  // If all models failed
  return res.status(500).json({ 
    message: 'No accessible models found. Please check your OpenAI account setup.',
    suggested_actions: [
      'Add a payment method to your OpenAI account',
      'Verify your account email',
      'Check your API usage limits',
      'Generate a new API key'
    ]
  });
}
