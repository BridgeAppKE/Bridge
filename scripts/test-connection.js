// Test script to verify Airtable connection
// Run this in browser console to test your setup

async function testAirtableConnection() {
    console.log('🔍 Testing Bridge Platform Connection...\n');
    
    // Check if config exists
    if (typeof CONFIG === 'undefined') {
        console.error('❌ CONFIG not found. Make sure config.js is loaded.');
        return;
    }
    
    console.log('✅ Configuration loaded');
    console.log(`📍 Base ID: ${CONFIG.AIRTABLE_BASE_ID}`);
    console.log(`🔑 API Key: ${CONFIG.AIRTABLE_API_KEY.substring(0, 10)}...`);
    
    const results = {
        passed: 0,
        failed: 0,
        tables: {}
    };
    
    // Test each table
    console.log('\n📊 Testing Tables:\n');
    
    for (const [key, tableName] of Object.entries(CONFIG.TABLES)) {
        try {
            const response = await fetch(
                `https://api.airtable.com/v0/${CONFIG.AIRTABLE_BASE_ID}/${tableName}?maxRecords=1`,
                {
                    headers: {
                        'Authorization': `Bearer ${CONFIG.AIRTABLE_API_KEY}`
                    }
                }
            );
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ ${tableName}: Connected (${data.records.length} test records)`);
                results.passed++;
                results.tables[tableName] = 'Connected';
            } else {
                console.error(`❌ ${tableName}: Failed (${response.status} ${response.statusText})`);
                results.failed++;
                results.tables[tableName] = `Error ${response.status}`;
            }
        } catch (error) {
            console.error(`❌ ${tableName}: Network Error - ${error.message}`);
            results.failed++;
            results.tables[tableName] = 'Network Error';
        }
    }
    
    // Summary
    console.log('\n📈 Test Summary:');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    
    if (results.failed === 0) {
        console.log('\n🎉 All tests passed! Your Bridge platform is ready to use.');
    } else {
        console.log('\n⚠️  Some tests failed. Please check:');
        console.log('1. API Key is correct and has proper permissions');
        console.log('2. Base ID matches your Airtable base');
        console.log('3. Table names match exactly (case-sensitive)');
        console.log('4. Tables exist in your base');
    }
    
    return results;
}

// Function to test creating a sample property
async function testCreateProperty() {
    console.log('\n📝 Testing Property Creation...\n');
    
    const testProperty = {
        fields: {
            PropertyType: 'Apartment',
            Area: 'Test Area',
            FullAddress: 'Test Address 123',
            Price: 1000000,
            Bedrooms: 2,
            Bathrooms: 1,
            Size: '100 sqm',
            TotalCommission: 3,
            CommissionSplit: '50-50',
            AgentName: 'Test Agent',
            AgentEmail: 'test@bridge.co.ke',
            Agency: 'Test Agency',
            Status: 'Pending',
            CreatedDate: new Date().toISOString()
        }
    };
    
    try {
        const response = await fetch(
            `https://api.airtable.com/v0/${CONFIG.AIRTABLE_BASE_ID}/${CONFIG.TABLES.PROPERTIES}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${CONFIG.AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testProperty)
            }
        );
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Test property created successfully!');
            console.log(`Record ID: ${data.id}`);
            console.log('You can delete this test record from Airtable.');
        } else {
            const error = await response.json();
            console.error('❌ Failed to create property:', error);
        }
    } catch (error) {
        console.error('❌ Network error:', error);
    }
}

// Run the connection test
console.log('To test your connection, run: testAirtableConnection()');
console.log('To test creating a property, run: testCreateProperty()');
