const fs = require('fs');
const path = require('path');

// Read .env.local manually since we don't want to depend on dotenv package if not installed
const envPath = path.join(__dirname, '.env.local');
let apiKey = '';

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/GOOGLE_AI_STUDIO_KEY=(.+)/);
  if (match) {
    apiKey = match[1].trim();
  }
} catch (e) {
  console.error('Error reading .env.local:', e);
  process.exit(1);
}

if (!apiKey) {
  console.error('GOOGLE_AI_STUDIO_KEY not found in .env.local');
  process.exit(1);
}

async function listModels() {
  console.log('Fetching available Gemini models...');
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      console.error('API Error:', data.error);
      return;
    }

    if (data.models) {
      console.log('\nAvailable Models:');
      data.models.forEach(model => {
        // Only show gemini models
        if (model.name.includes('gemini')) {
            console.log(`- ${model.name.replace('models/', '')}`);
            console.log(`  Description: ${model.description}`);
            console.log(`  Capabilities: [${model.supportedGenerationMethods.join(', ')}]`);
            console.log('---');
        }
      });
    } else {
      console.log('No models found in response');
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

listModels();
