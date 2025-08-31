// src/components/vue/launch-pads/LaunchPadService.ts
import type { LaunchPad } from './launchpad.types';

interface LaunchPadData {
	lastUpdated: string;
	locations: any[];
	pads: LaunchPad[];
	stats: {
		totalLocations: number;
		totalPads: number;
		countriesCount: number;
	};
}

export class LaunchPadService {
	private static cachedData: LaunchPadData | null = null;

	/**
	 * Load data from the static JSON file
	 */
	private static async loadData(): Promise<LaunchPadData> {
		if (this.cachedData) {
			return this.cachedData;
		}

		try {
			const response = await fetch('/launch-pads-data.json');
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			this.cachedData = await response.json();
			return this.cachedData;
		} catch (error) {
			console.error('Error loading launch pads data:', error);
			throw new Error(
				'Failed to load launch pads data. Please try again later.',
			);
		}
	}

	/**
	 * Fetch launch pads from static JSON file
	 */
	static async getList(): Promise<LaunchPad[]> {
		try {
			const data = await this.loadData();

			// Sort by location name, ascending
			return data.pads
				.map((pad: any) => ({
					...pad,
					location_name: pad.location?.name || '',
				}))
				.sort((a: LaunchPad, b: LaunchPad) =>
					a.location_name.localeCompare(b.location_name),
				);
		} catch (error) {
			console.error('Error fetching launch pads:', error);
			return [];
		}
	}

	/**
	 * Get a single launch pad by ID
	 */
	static async get(id: number): Promise<LaunchPad | null> {
		try {
			const data = await this.loadData();
			const pad = data.pads.find((p: any) => p.id === id);

			if (!pad) {
				return null;
			}

			return {
				...pad,
				location_name: pad.location?.name || '',
			};
		} catch (error) {
			console.error('Error fetching launch pad:', error);
			return null;
		}
	}

	/**
	 * Get data freshness information
	 */
	static async getDataInfo(): Promise<{
		lastUpdated: string;
		totalPads: number;
		totalLocations: number;
		countriesCount: number;
		isStale: boolean;
	}> {
		try {
			const data = await this.loadData();

			// Check if data is more than 2 days old
			const lastUpdated = new Date(data.lastUpdated);
			const twoDaysAgo = new Date();
			twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

			return {
				lastUpdated: data.lastUpdated,
				totalPads: data.stats.totalPads,
				totalLocations: data.stats.totalLocations,
				countriesCount: data.stats.countriesCount,
				isStale: lastUpdated < twoDaysAgo,
			};
		} catch (error) {
			console.error('Error getting data info:', error);
			return {
				lastUpdated: 'Unknown',
				totalPads: 0,
				totalLocations: 0,
				countriesCount: 0,
				isStale: true,
			};
		}
	}

	/**
	 * Get locations data
	 */
	static async getLocations(): Promise<any[]> {
		try {
			const data = await this.loadData();
			return data.locations || [];
		} catch (error) {
			console.error('Error fetching locations:', error);
			return [];
		}
	}

	/**
	 * Clear cached data (useful for development)
	 */
	static clearCache(): void {
		this.cachedData = null;
	}

	/**
	 * Force refresh data from server (useful for development)
	 */
	static async forceRefresh(): Promise<LaunchPadData> {
		this.clearCache();
		return await this.loadData();
	}
}
