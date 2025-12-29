// Quick test script to generate a summary
import fetch from 'node-fetch';

const testData = {
    repoPaths: [
        "/Users/danielcrowder/Desktop/Projects/Monumental-AI"
    ],
    recipientEmails: [
        "daniel@monumental-i.com"
    ],
    startDate: "2025-12-01",
    endDate: "2025-12-07"
};

console.log('Testing summary generation...');
console.log('Repos:', testData.repoPaths);
console.log('Recipients:', testData.recipientEmails);
console.log('Date range:', testData.startDate, 'to', testData.endDate);
console.log('\nGenerating summary...\n');

try {
    const response = await fetch('http://localhost:3001/api/generate-summary', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
    }

    const result = await response.json();

    console.log('✓ Success!');
    console.log(`Found ${result.commitsCount} commits\n`);
    console.log('='.repeat(80));
    console.log(result.summary);
    console.log('='.repeat(80));

} catch (error) {
    console.error('✗ Error:', error.message);
}
