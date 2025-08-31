import fs from 'fs';
import path from 'path';

const API_URL = 'https://lldev.thespacedevs.com/2.2.0';

async function fetchAllLocationsFromAPI() {
	let allLocations = [];
	let nextUrl = `${API_URL}/location/?limit=100`;

	console.log('🌍 Fetching locations from Space Devs API...');

	while (nextUrl) {
		try {
			console.log(`   Fetching: ${nextUrl}`);
			const response = await fetch(nextUrl);

			if (!response.ok) {
				throw new Error(
					`HTTP ${response.status}: ${response.statusText}`,
				);
			}

			const data = await response.json();

			const transformedLocations = data.results.map((location) => ({
				id: location.id,
				name: location.name,
				country_code: location.country_code,
				description: location.description,
				timezone_name: location.timezone_name,
				total_launch_count: location.total_launch_count,
				total_landing_count: location.total_landing_count,
			}));

			allLocations = [...allLocations, ...transformedLocations];
			nextUrl = data.next;

			// Add small delay to be respectful to the API
			await new Promise((resolve) => setTimeout(resolve, 200));
		} catch (error) {
			console.error(`❌ Error fetching locations: ${error.message}`);
			// Continue with what we have so far
			break;
		}
	}

	console.log(`✅ Fetched ${allLocations.length} locations`);
	return allLocations;
}

async function fetchAllPadsFromAPI() {
	let allPads = [];
	let nextUrl = `${API_URL}/pad/?limit=100`;

	console.log('🚀 Fetching launch pads from Space Devs API...');

	while (nextUrl) {
		try {
			console.log(`   Fetching: ${nextUrl}`);
			const response = await fetch(nextUrl);

			if (!response.ok) {
				throw new Error(
					`HTTP ${response.status}: ${response.statusText}`,
				);
			}

			const data = await response.json();

			const transformedPads = data.results.map((pad) => ({
				id: pad.id,
				agency_id: pad.agency_id,
				name: pad.name,
				description: pad.description,
				info_url: pad.info_url,
				wiki_url: pad.wiki_url,
				map_url: pad.map_url,
				latitude: pad.latitude,
				longitude: pad.longitude,
				location_id: pad.location?.id,
				country_code: pad.country_code,
				map_image: pad.map_image,
				total_launch_count: pad.total_launch_count,
				orbital_launch_attempt_count: pad.orbital_launch_attempt_count,
				location_name: pad.location?.name || null,
			}));

			allPads = [...allPads, ...transformedPads];
			nextUrl = data.next;

			// Add small delay to be respectful to the API
			await new Promise((resolve) => setTimeout(resolve, 200));
		} catch (error) {
			console.error(`❌ Error fetching pads: ${error.message}`);
			// Continue with what we have so far
			break;
		}
	}

	console.log(`✅ Fetched ${allPads.length} launch pads`);
	return allPads;
}

async function generateLaunchPadsData() {
	console.log('🎯 Starting launch pad data generation...');

	try {
		const [locations, pads] = await Promise.all([
			fetchAllLocationsFromAPI(),
			fetchAllPadsFromAPI(),
		]);

		if (locations.length === 0) {
			throw new Error('No locations fetched from API');
		}

		if (pads.length === 0) {
			throw new Error('No launch pads fetched from API');
		}

		// Create a map of locations for easy lookup
		const locationMap = new Map(locations.map((loc) => [loc.id, loc]));

		// Enhance pads with full location data and filter out unknown pads
		const enhancedPads = pads
			.map((pad) => ({
				...pad,
				location: pad.location_id
					? locationMap.get(pad.location_id)
					: null,
			}))
			.filter((pad) => pad.name !== 'Unknown Pad');

		const data = {
			lastUpdated: new Date().toISOString(),
			locations,
			pads: enhancedPads,
			stats: {
				totalLocations: locations.length,
				totalPads: enhancedPads.length,
				countriesCount: new Set(enhancedPads.map((p) => p.country_code))
					.size,
			},
		};

		// Ensure the public directory exists
		const publicDir = path.join(process.cwd(), 'public');
		if (!fs.existsSync(publicDir)) {
			fs.mkdirSync(publicDir, { recursive: true });
		}

		// Write the data to a JSON file in the public directory
		const filePath = path.join(publicDir, 'launch-pads-data.json');
		fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

		console.log(`✅ Successfully generated launch pads data:`);
		console.log(`   📁 File: ${filePath}`);
		console.log(`   🚀 ${enhancedPads.length} launch pads`);
		console.log(`   🌍 ${locations.length} locations`);
		console.log(`   🏳️ ${data.stats.countriesCount} countries`);
		console.log(`   📅 Updated: ${data.lastUpdated}`);
	} catch (error) {
		console.error('❌ Error generating launch pads data:', error);

		// Try to use existing data if available
		const existingDataPath = path.join(
			process.cwd(),
			'public',
			'launch-pads-data.json',
		);
		if (fs.existsSync(existingDataPath)) {
			console.log('⚠️ Using existing data file due to API error');
			return;
		}

		// Use fallback data if no existing data
		const fallbackDataPath = path.join(
			process.cwd(),
			'public',
			'launch-pads-data-fallback.json',
		);
		const targetPath = path.join(
			process.cwd(),
			'public',
			'launch-pads-data.json',
		);

		if (fs.existsSync(fallbackDataPath)) {
			fs.copyFileSync(fallbackDataPath, targetPath);
			console.log('⚠️ Using fallback data due to API error');
		} else {
			// Create minimal fallback
			const fallbackData = {
				lastUpdated: new Date().toISOString(),
				locations: [],
				pads: [],
				stats: { totalLocations: 0, totalPads: 0, countriesCount: 0 },
				error: 'API unavailable during build',
			};
			fs.writeFileSync(targetPath, JSON.stringify(fallbackData, null, 2));
			console.log('⚠️ Created minimal fallback data');
		}

		// Don't exit with error in build context - use fallback data instead
		console.log(
			'⚠️ Continuing with fallback data to prevent build failure',
		);
	}
}

// Handle graceful shutdown
process.on('SIGINT', () => {
	console.log('\n🛑 Process interrupted, exiting gracefully...');
	process.exit(0);
});

process.on('SIGTERM', () => {
	console.log('\n🛑 Process terminated, exiting gracefully...');
	process.exit(0);
});

// Run the script
generateLaunchPadsData();
