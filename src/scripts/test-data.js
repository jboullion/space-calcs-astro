// src/scripts/test-data.js
import fs from 'fs';
import path from 'path';

async function testData() {
	const filePath = path.join(
		process.cwd(),
		'public',
		'launch-pads-data.json',
	);

	if (!fs.existsSync(filePath)) {
		console.log('❌ No data file found at:', filePath);
		return;
	}

	try {
		const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

		console.log('📊 Launch Pads Data Summary:');
		console.log('─'.repeat(40));
		console.log(
			`📅 Last Updated: ${new Date(data.lastUpdated).toLocaleString()}`,
		);
		console.log(
			`🚀 Launch Pads: ${
				data.stats?.totalPads || data.pads?.length || 0
			}`,
		);
		console.log(
			`🌍 Locations: ${
				data.stats?.totalLocations || data.locations?.length || 0
			}`,
		);
		console.log(`🏳️ Countries: ${data.stats?.countriesCount || 'N/A'}`);

		if (data.error) {
			console.log(`⚠️ Error: ${data.error}`);
		}

		// Sample a few pads
		if (data.pads && data.pads.length > 0) {
			console.log('\n📍 Sample Launch Pads:');
			console.log('─'.repeat(40));
			data.pads.slice(0, 5).forEach((pad) => {
				console.log(
					`  • ${pad.name} (${pad.country_code}) - ${pad.location_name}`,
				);
			});

			if (data.pads.length > 5) {
				console.log(`  ... and ${data.pads.length - 5} more`);
			}
		}

		console.log('\n✅ Data file is valid and ready to use!');
	} catch (error) {
		console.error('❌ Error reading data file:', error.message);
	}
}

testData();
