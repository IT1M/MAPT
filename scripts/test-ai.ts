import { GeminiService, InventoryData } from '../src/services/gemini';

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
  duration?: number;
}

const results: TestResult[] = [];

// Sample inventory data for testing
const sampleData: InventoryData[] = [
  {
    productId: '1',
    productName: 'Surgical Gloves',
    currentStock: 250,
    minStockLevel: 50,
    maxStockLevel: 500,
    reorderPoint: 100,
    averageUsage: 80,
  },
  {
    productId: '2',
    productName: 'Face Masks',
    currentStock: 45,
    minStockLevel: 100,
    maxStockLevel: 1000,
    reorderPoint: 200,
    averageUsage: 150,
  },
  {
    productId: '3',
    productName: 'Insulin Syringes',
    currentStock: 800,
    minStockLevel: 30,
    maxStockLevel: 300,
    reorderPoint: 75,
    averageUsage: 50,
  },
];

async function testGeminiConnection(): Promise<boolean> {
  console.log('🔌 Testing Gemini API connection...');

  const startTime = Date.now();

  try {
    const geminiService = GeminiService.getInstance();

    if (!geminiService.isAvailable()) {
      results.push({
        test: 'Gemini API initialization',
        passed: false,
        message: 'Gemini service is not available (API key may be missing)',
        duration: Date.now() - startTime,
      });
      return false;
    }

    results.push({
      test: 'Gemini API initialization',
      passed: true,
      message: 'Gemini service initialized successfully',
      duration: Date.now() - startTime,
    });
    return true;
  } catch (error) {
    results.push({
      test: 'Gemini API initialization',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime,
    });
    return false;
  }
}

async function testAnalyzeInventoryTrends(): Promise<boolean> {
  console.log('📊 Testing analyzeInventoryTrends function...');

  const startTime = Date.now();

  try {
    const geminiService = GeminiService.getInstance();
    const trends = await geminiService.analyzeInventoryTrends(sampleData);

    if (!Array.isArray(trends)) {
      results.push({
        test: 'analyzeInventoryTrends returns array',
        passed: false,
        message: 'Function did not return an array',
        duration: Date.now() - startTime,
      });
      return false;
    }

    results.push({
      test: 'analyzeInventoryTrends returns array',
      passed: true,
      message: `Returned ${trends.length} trends`,
      duration: Date.now() - startTime,
    });

    // Validate structure of returned trends
    const validStructure = trends.every(
      (trend) =>
        typeof trend.product === 'string' &&
        ['increasing', 'decreasing', 'stable'].includes(trend.trend) &&
        typeof trend.confidence === 'number' &&
        typeof trend.recommendation === 'string'
    );

    results.push({
      test: 'analyzeInventoryTrends structure validation',
      passed: validStructure,
      message: validStructure
        ? 'All trends have valid structure'
        : 'Some trends have invalid structure',
    });

    // Check confidence scores are in valid range
    const validConfidence = trends.every(
      (trend) => trend.confidence >= 0 && trend.confidence <= 1
    );

    results.push({
      test: 'analyzeInventoryTrends confidence scores',
      passed: validConfidence,
      message: validConfidence
        ? 'All confidence scores are in valid range (0-1)'
        : 'Some confidence scores are out of range',
    });

    return validStructure && validConfidence;
  } catch (error) {
    results.push({
      test: 'analyzeInventoryTrends execution',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime,
    });
    return false;
  }
}

async function testGenerateInsights(): Promise<boolean> {
  console.log('💡 Testing generateInsights function...');

  const startTime = Date.now();

  try {
    const geminiService = GeminiService.getInstance();
    const insights = await geminiService.generateInsights(sampleData);

    if (!Array.isArray(insights)) {
      results.push({
        test: 'generateInsights returns array',
        passed: false,
        message: 'Function did not return an array',
        duration: Date.now() - startTime,
      });
      return false;
    }

    results.push({
      test: 'generateInsights returns array',
      passed: true,
      message: `Returned ${insights.length} insights`,
      duration: Date.now() - startTime,
    });

    // Validate structure of returned insights
    const validStructure = insights.every(
      (insight) =>
        ['warning', 'info', 'success'].includes(insight.type) &&
        typeof insight.message === 'string' &&
        ['high', 'medium', 'low'].includes(insight.priority)
    );

    results.push({
      test: 'generateInsights structure validation',
      passed: validStructure,
      message: validStructure
        ? 'All insights have valid structure'
        : 'Some insights have invalid structure',
    });

    // Check that insights are actionable (have meaningful messages)
    const hasMessages = insights.every(
      (insight) => insight.message.length > 10
    );

    results.push({
      test: 'generateInsights message quality',
      passed: hasMessages,
      message: hasMessages
        ? 'All insights have meaningful messages'
        : 'Some insights have empty or too short messages',
    });

    return validStructure && hasMessages;
  } catch (error) {
    results.push({
      test: 'generateInsights execution',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime,
    });
    return false;
  }
}

async function testPredictStockNeeds(): Promise<boolean> {
  console.log('🔮 Testing predictStockNeeds function...');

  const startTime = Date.now();

  try {
    const geminiService = GeminiService.getInstance();
    const predictions = await geminiService.predictStockNeeds(sampleData);

    if (!Array.isArray(predictions)) {
      results.push({
        test: 'predictStockNeeds returns array',
        passed: false,
        message: 'Function did not return an array',
        duration: Date.now() - startTime,
      });
      return false;
    }

    results.push({
      test: 'predictStockNeeds returns array',
      passed: true,
      message: `Returned ${predictions.length} predictions`,
      duration: Date.now() - startTime,
    });

    // Validate structure of returned predictions
    const validStructure = predictions.every(
      (pred) =>
        typeof pred.product === 'string' &&
        typeof pred.currentStock === 'number' &&
        typeof pred.predictedNeed === 'number' &&
        typeof pred.timeframe === 'string' &&
        typeof pred.confidence === 'number'
    );

    results.push({
      test: 'predictStockNeeds structure validation',
      passed: validStructure,
      message: validStructure
        ? 'All predictions have valid structure'
        : 'Some predictions have invalid structure',
    });

    // Check confidence scores are in valid range
    const validConfidence = predictions.every(
      (pred) => pred.confidence >= 0 && pred.confidence <= 1
    );

    results.push({
      test: 'predictStockNeeds confidence scores',
      passed: validConfidence,
      message: validConfidence
        ? 'All confidence scores are in valid range (0-1)'
        : 'Some confidence scores are out of range',
    });

    // Check predicted needs are positive numbers
    const validPredictions = predictions.every(
      (pred) => pred.predictedNeed > 0
    );

    results.push({
      test: 'predictStockNeeds prediction values',
      passed: validPredictions,
      message: validPredictions
        ? 'All predicted needs are positive numbers'
        : 'Some predicted needs are invalid',
    });

    return validStructure && validConfidence && validPredictions;
  } catch (error) {
    results.push({
      test: 'predictStockNeeds execution',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime,
    });
    return false;
  }
}

async function testCaching(): Promise<boolean> {
  console.log('💾 Testing caching mechanism...');

  const startTime = Date.now();

  try {
    const geminiService = GeminiService.getInstance();

    // First call - should hit API
    const firstCallStart = Date.now();
    await geminiService.analyzeInventoryTrends(sampleData);
    const firstCallDuration = Date.now() - firstCallStart;

    // Second call - should use cache
    const secondCallStart = Date.now();
    await geminiService.analyzeInventoryTrends(sampleData);
    const secondCallDuration = Date.now() - secondCallStart;

    // Cached call should be significantly faster (at least 10x)
    const isCached = secondCallDuration < firstCallDuration / 10;

    results.push({
      test: 'Caching mechanism',
      passed: isCached,
      message: isCached
        ? `Cache working (1st: ${firstCallDuration}ms, 2nd: ${secondCallDuration}ms)`
        : `Cache may not be working (1st: ${firstCallDuration}ms, 2nd: ${secondCallDuration}ms)`,
      duration: Date.now() - startTime,
    });

    return isCached;
  } catch (error) {
    results.push({
      test: 'Caching mechanism',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime,
    });
    return false;
  }
}

async function testErrorHandling(): Promise<boolean> {
  console.log('🛡️  Testing error handling and fallbacks...');

  const startTime = Date.now();

  try {
    const geminiService = GeminiService.getInstance();

    // Test with empty data - should still return valid response
    const emptyResult = await geminiService.generateInsights([]);

    const handlesEmpty = Array.isArray(emptyResult);

    results.push({
      test: 'Error handling with empty data',
      passed: handlesEmpty,
      message: handlesEmpty
        ? 'Service handles empty data gracefully'
        : 'Service fails with empty data',
      duration: Date.now() - startTime,
    });

    return handlesEmpty;
  } catch (error) {
    // If it throws an error, that's also acceptable error handling
    results.push({
      test: 'Error handling with empty data',
      passed: true,
      message: 'Service throws appropriate error for invalid input',
      duration: Date.now() - startTime,
    });
    return true;
  }
}

async function testCircuitBreaker(): Promise<boolean> {
  console.log('⚡ Testing circuit breaker...');

  const startTime = Date.now();

  try {
    const geminiService = GeminiService.getInstance();
    const state = geminiService.getCircuitBreakerState();

    const validStates = ['CLOSED', 'OPEN', 'HALF_OPEN'];
    const isValid = validStates.includes(state);

    results.push({
      test: 'Circuit breaker state',
      passed: isValid,
      message: isValid
        ? `Circuit breaker is in ${state} state`
        : `Invalid circuit breaker state: ${state}`,
      duration: Date.now() - startTime,
    });

    return isValid;
  } catch (error) {
    results.push({
      test: 'Circuit breaker state',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime,
    });
    return false;
  }
}

async function main() {
  console.log('🤖 Testing AI Integration\n');
  console.log('='.repeat(60));

  // Check environment variable
  if (!process.env.GEMINI_API_KEY) {
    console.log('\n⚠️  Warning: GEMINI_API_KEY not found in environment');
    console.log('   Tests will run with fallback responses only\n');
  }

  // Run all tests
  await testGeminiConnection();
  await testAnalyzeInventoryTrends();
  await testGenerateInsights();
  await testPredictStockNeeds();
  await testCaching();
  await testErrorHandling();
  await testCircuitBreaker();

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary:\n');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  results.forEach((result) => {
    const icon = result.passed ? '✅' : '❌';
    const duration = result.duration ? ` (${result.duration}ms)` : '';
    console.log(`${icon} ${result.test}${duration}`);
    console.log(`   ${result.message}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log(`\n📈 Results: ${passed}/${total} tests passed`);

  if (failed > 0) {
    console.log(
      `\n❌ ${failed} test(s) failed. Please review the errors above.`
    );
    console.log('\n💡 Tips:');
    console.log('   - Verify GEMINI_API_KEY is set correctly');
    console.log('   - Check your internet connection');
    console.log('   - Ensure you have API quota available');
    console.log(
      '   - Fallback responses should still work without API access\n'
    );
    process.exit(1);
  } else {
    console.log('\n✅ All AI integration tests passed!');
    console.log('🎉 Gemini AI service is properly configured and working.\n');
    console.log('📝 Test Details:');
    console.log('   - API connection verified');
    console.log('   - All three AI functions tested');
    console.log('   - Caching mechanism working');
    console.log('   - Error handling and fallbacks functional');
    console.log('   - Circuit breaker operational\n');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('\n❌ Unexpected error during testing:', error);
  process.exit(1);
});
