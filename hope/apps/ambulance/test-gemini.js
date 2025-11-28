const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testModel(modelName) {
    const apiKey = "AIzaSyCtgFa1uhomejzEBJI9D-4TKtzxsYMnEik";
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    try {
        console.log(`Testing model: ${modelName}...`);
        const result = await model.generateContent("Hello");
        const response = await result.response;
        console.log(`Success with ${modelName}! Response:`, response.text());
        return true;
    } catch (error) {
        console.error(`Error with ${modelName}:`, error.message);
        return false;
    }
}

async function runTests() {
    await testModel("gemini-1.5-flash");
    await testModel("gemini-1.5-pro");
    await testModel("gemini-1.0-pro");
}

runTests();
