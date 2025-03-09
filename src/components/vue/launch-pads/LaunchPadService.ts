import { supabase } from '../../../lib/supabaseClient';
import type { LaunchPad } from './launchpad.types';

// Use environment variable with a fallback
const API_URL = 'https://lldev.thespacedevs.com/2.2.0';

export class LaunchPadService {
	/**
	 * Fetch launch pads from Supabase
	 */
	static async getList(): Promise<LaunchPad[]> {
		const { data, error } = await supabase
			.from('launch_pads')
			.select(
				`
        *,
        location:launch_pad_locations(*)
      `,
			)
			.order('location_name', { ascending: true });

		if (error) {
			console.error('Error fetching launch pads:', error);
			return [];
		}

		// Format data to match the structure expected by the component
		return data
			.map((pad) => ({
				...pad,
				location_name: pad.location?.name || '',
			}))
			.filter((pad) => pad.name !== 'Unknown Pad');
	}

	// Rest of the service methods remain the same...

	/**
	 * Get a single launch pad by ID
	 */
	static async get(id: number): Promise<LaunchPad | null> {
		const { data, error } = await supabase
			.from('launch_pads')
			.select(
				`
        *,
        location:launch_pad_locations(*)
      `,
			)
			.eq('id', id)
			.single();

		if (error) {
			console.error('Error fetching launch pad:', error);
			return null;
		}

		return {
			...data,
			location_name: data.location?.name || '',
		};
	}

	/**
	 * Update launch pads from the Space Devs API
	 * This should be run on a schedule (e.g., once a day)
	 */
	static async updateLaunchPads(): Promise<{
		success: boolean;
		message: string;
	}> {
		try {
			// First, let's fetch and update the locations
			await this.updateLocations();

			// Then update the pads with references to the locations
			const pads = await this.fetchAllPadsFromAPI();

			// Process the pads in batches to avoid overwhelming the DB
			const BATCH_SIZE = 100;
			for (let i = 0; i < pads.length; i += BATCH_SIZE) {
				const batch = pads.slice(i, i + BATCH_SIZE);

				const { error } = await supabase
					.from('launch_pads')
					.upsert(batch, {
						onConflict: 'id',
						ignoreDuplicates: false,
					});

				if (error) {
					console.error('Error upserting launch pads:', error);
					return {
						success: false,
						message: `Error inserting batch ${
							i / BATCH_SIZE + 1
						}: ${error.message}`,
					};
				}
			}

			return {
				success: true,
				message: `Successfully updated ${pads.length} launch pads`,
			};
		} catch (error) {
			console.error('Error updating launch pads:', error);
			return { success: false, message: error.message };
		}
	}

	/**
	 * Update locations from the Space Devs API
	 */
	private static async updateLocations(): Promise<void> {
		try {
			const locations = await this.fetchAllLocationsFromAPI();

			// Process the locations in batches
			const BATCH_SIZE = 100;
			for (let i = 0; i < locations.length; i += BATCH_SIZE) {
				const batch = locations.slice(i, i + BATCH_SIZE);

				const { error } = await supabase
					.from('launch_pad_locations')
					.upsert(batch, {
						onConflict: 'id',
						ignoreDuplicates: false,
					});

				if (error) {
					console.error('Error upserting locations:', error);
					throw new Error(
						`Error inserting locations batch: ${error.message}`,
					);
				}
			}
		} catch (error) {
			console.error('Error updating locations:', error);
			throw error;
		}
	}

	/**
	 * Fetch all pads from the API
	 */
	private static async fetchAllPadsFromAPI(): Promise<any[]> {
		let allPads = [];
		let nextUrl = `${API_URL}/pad/?limit=100`;

		while (nextUrl) {
			const response = await fetch(nextUrl);
			const data = await response.json();

			// Transform pads to match our database schema
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
		}

		return allPads;
	}

	/**
	 * Fetch all locations from the API
	 */
	private static async fetchAllLocationsFromAPI(): Promise<any[]> {
		let allLocations = [];
		let nextUrl = `${API_URL}/location/?limit=100`;

		while (nextUrl) {
			const response = await fetch(nextUrl);
			const data = await response.json();

			// Transform locations to match our database schema
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
		}

		return allLocations;
	}
}
