/**
 * SAM Agent Tests
 * Run with: node tests/sam-agent.test.js
 */

const BASE_URL = 'http://localhost:3000';

async function testSAMStatus() {
  console.log('\n=== Test 1: SAM Status ===');
  try {
    const res = await fetch(`${BASE_URL}/api/segment`);
    const data = await res.json();
    console.log('Status:', JSON.stringify(data, null, 2));
    
    if (data.enabled) {
      console.log('✅ SAM is enabled');
    } else {
      console.log('❌ SAM is NOT enabled - check ROBOFLOW_API_KEY');
    }
    return data.enabled;
  } catch (error) {
    console.error('❌ Failed to get SAM status:', error.message);
    return false;
  }
}

async function testSAMWithTestImage() {
  console.log('\n=== Test 2: SAM with Test Image ===');
  
  // Create a simple test image (1x1 red pixel PNG as base64)
  // For real testing, we'd use an actual satellite image
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  
  try {
    const formData = new FormData();
    
    // Convert base64 to blob
    const byteCharacters = atob(testImageBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });
    
    formData.append('image', blob, 'test.png');
    formData.append('prompts', JSON.stringify(['tree']));
    
    console.log('Sending test image to SAM API...');
    const res = await fetch(`${BASE_URL}/api/segment`, {
      method: 'POST',
      body: formData,
    });
    
    const data = await res.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.success && data.masks && data.masks.length > 0) {
      console.log(`✅ Generated ${data.masks.length} masks`);
      return true;
    } else {
      console.log('⚠️ No masks returned (may be expected for tiny test image)');
      return false;
    }
  } catch (error) {
    console.error('❌ SAM test failed:', error.message);
    return false;
  }
}

async function testRoboflowDirectly() {
  console.log('\n=== Test 3: Direct Roboflow SAM 3 API Test ===');
  
  const apiKey = process.env.ROBOFLOW_API_KEY;
  if (!apiKey) {
    console.log('❌ No ROBOFLOW_API_KEY in environment');
    console.log('   Run with: ROBOFLOW_API_KEY=your_key node tests/sam-agent.test.js');
    return false;
  }
  
  console.log('API Key prefix:', apiKey.substring(0, 5) + '...');
  
  // SAM 3 Concept Segmentation endpoint
  const endpoint = `https://serverless.roboflow.com/sam3/concept_segment?api_key=${apiKey}`;
  
  // Simple 10x10 green image
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9QzwAEjDAGNzYAADWrA/77j+iNAAAAAElFTkSuQmCC';
  
  try {
    console.log('Calling Roboflow SAM 3 endpoint...');
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        format: 'polygon', // polygon or mask
        image: {
          type: 'base64',
          value: testImageBase64,
        },
        prompts: [
          { text: 'green area' }
        ],
      }),
    });
    
    console.log('Status:', res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.log('❌ API Error:', errorText);
      return false;
    }
    
    const data = await res.json();
    console.log('Response keys:', Object.keys(data));
    console.log('Response:', JSON.stringify(data, null, 2).substring(0, 500));
    
    // Check SAM 3 response format
    if (data.prompt_results && data.prompt_results.length > 0) {
      console.log('✅ Got prompt_results array with', data.prompt_results.length, 'results');
      if (data.prompt_results[0].predictions) {
        console.log('   Predictions:', data.prompt_results[0].predictions.length);
      }
      return true;
    } else {
      console.log('⚠️ No prompt_results in response, keys:', Object.keys(data));
      return false;
    }
  } catch (error) {
    console.error('❌ Direct API test failed:', error.message);
    return false;
  }
}

async function testAlternativeEndpoint() {
  console.log('\n=== Test 4: Alternative SAM Endpoint ===');
  
  const apiKey = process.env.ROBOFLOW_API_KEY;
  if (!apiKey) {
    console.log('Skipping - no API key');
    return false;
  }
  
  // Try the embed + segment workflow
  const embedEndpoint = `https://infer.roboflow.com/sam/embed_image?api_key=${apiKey}`;
  
  try {
    console.log('Testing SAM embed endpoint...');
    const res = await fetch(embedEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: {
          type: 'url',
          value: 'https://maps.googleapis.com/maps/api/staticmap?center=35.3,-120.6&zoom=19&size=640x640&maptype=satellite&key=demo',
        },
      }),
    });
    
    console.log('Embed status:', res.status);
    const data = await res.json();
    console.log('Embed response:', JSON.stringify(data).substring(0, 300));
    
    return res.ok;
  } catch (error) {
    console.error('❌ Embed test failed:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🧪 SAM Agent Integration Tests');
  console.log('================================');
  
  const results = {
    status: await testSAMStatus(),
    localAPI: await testSAMWithTestImage(),
    directRoboflow: await testRoboflowDirectly(),
    altEndpoint: await testAlternativeEndpoint(),
  };
  
  console.log('\n================================');
  console.log('📊 Test Results:');
  console.log('  SAM Status Check:', results.status ? '✅' : '❌');
  console.log('  Local API Test:', results.localAPI ? '✅' : '⚠️');
  console.log('  Direct Roboflow:', results.directRoboflow ? '✅' : '❌');
  console.log('  Alt Endpoint:', results.altEndpoint ? '✅' : '❌');
  
  const passed = Object.values(results).filter(Boolean).length;
  console.log(`\n${passed}/4 tests passed`);
}

runTests().catch(console.error);
