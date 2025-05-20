
const { ProfitabilityService } = require('./src/features/analysis/analysis.service');
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('./tests/utils/db-test-helper');

const simpleTest = async () => {
  try {
    console.log('Starting test...');
    await connectDB();
    console.log('Connected to DB');
    
    // Generate a valid ObjectId
    const testId = new mongoose.Types.ObjectId().toString();
    console.log('Test ID:', testId);

    // Test with a non-existent ID (should return empty results)
    const result = await ProfitabilityService.getProfitabilitiesByVolumeCheckId(testId, 1, 10);
    console.log('Result:', JSON.stringify(result));
    
    await disconnectDB();
    console.log('Disconnected from DB');
    process.exit(0);
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
};

simpleTest().catch(console.error);

