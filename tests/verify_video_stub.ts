
import { VideoAgent } from '../src/services/site-manager/video-agent';
import { ServiceType } from '../src/services/site-manager/types';

async function main() {
  console.log('Testing Video Analyzer Logic...');
  
  // Mock env var
  process.env.REPLICATE_API_TOKEN = 'mock-token';

  const agent = new VideoAgent();
  await agent.start();

  console.log('Agent status:', agent.getStatus());

  try {
      // We expect this to fail on actual API call because token is mock,
      // OR we can mock the replicate instance. 
      // For this "Stub" test, let's just inspect the Agent's methods exist and types align.
      // Since we can't easily mock the private 'replicate' property without some tricks,
      // We will wrap the call in a try/catch and inspect the error, 
      // OR we can rely on my implementation of `video-agent.ts` where I see I used `this.replicate.run`.
      
      console.log('Mocking Replicate run...');
      // @ts-ignore
      agent.replicate = {
          run: async (model: string, input: any) => {
              console.log(`Called Replicate with model: ${model}`);
              console.log(`Input prompts: ${input.input.prompts}`);
              return ["mock_output"];
          }
      };

      console.log('--- Testing Landscaping Service ---');
      const resultLandscape = await agent.analyzeVideo('http://test.com/video.mp4', 'landscaping');
      console.log('Landscaping Items:', resultLandscape.items.map(i => i.label));

      console.log('--- Testing Dump Service ---');
      const resultDump = await agent.analyzeVideo('http://test.com/video.mp4', 'dump');
      console.log('Dump Items:', resultDump.items.map(i => i.label));
      
      if (resultLandscape.items.some(i => i.service === 'landscaping') && 
          resultDump.items.some(i => i.service === 'dump')) {
          console.log('SUCCESS: Service differentiation works.');
      } else {
          console.error('FAILURE: Items did not match service types.');
      }

  } catch (err) {
      console.error('Test failed:', err);
  }
}

main();
