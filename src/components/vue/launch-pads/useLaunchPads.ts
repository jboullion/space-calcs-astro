// src/components/vue/launch-pads/useLaunchPads.ts
import { ref, computed } from 'vue';
import { LaunchPadService } from './LaunchPadService';
import type { LaunchPad } from './launchpad.types';

export function useLaunchPads() {
	const pads = ref<LaunchPad[]>([]);
	const loading = ref<boolean>(true);
	const error = ref<string | null>(null);
	const padSearch = ref<string>('');
	const padCountry = ref<string>('');
	const dataInfo = ref<{
		lastUpdated: string;
		totalPads: number;
		totalLocations: number;
		countriesCount: number;
		isStale: boolean;
	} | null>(null);

	// List of unique country codes
	const countryCodes = computed(() => {
		const codes = pads.value
			.map((pad) => pad.country_code)
			.filter(
				(value, index, self) =>
					self.indexOf(value) === index && value.length === 3,
			);

		return codes.sort((a, b) => a.localeCompare(b));
	});

	// Filtered pads based on search and country filter
	const filteredPads = computed(() => {
		return pads.value.filter((pad) => {
			const nameMatch =
				pad.name
					.toLowerCase()
					.includes(padSearch.value.toLowerCase()) ||
				(pad.location_name || '')
					.toLowerCase()
					.includes(padSearch.value.toLowerCase());
			const countryMatch =
				padCountry.value === '' ||
				pad.country_code === padCountry.value;

			return nameMatch && countryMatch;
		});
	});

	// Load all launch pads
	const loadPads = async () => {
		loading.value = true;
		error.value = null;

		try {
			// Load both pads and data info
			const [padsData, info] = await Promise.all([
				LaunchPadService.getList(),
				LaunchPadService.getDataInfo(),
			]);

			pads.value = padsData;
			dataInfo.value = info;

			if (padsData.length === 0) {
				error.value =
					'No launch pads data available. Please check back later.';
			}
		} catch (err) {
			console.error('Error loading launch pads:', err);
			error.value =
				err instanceof Error
					? err.message
					: 'Failed to load launch pads. Please try again later.';
		} finally {
			loading.value = false;
		}
	};

	// Get a single launch pad by ID
	const getPad = async (id: number): Promise<LaunchPad | null> => {
		try {
			return await LaunchPadService.get(id);
		} catch (err) {
			console.error(`Error fetching launch pad #${id}:`, err);
			return null;
		}
	};

	// Force refresh data (clears cache and reloads)
	const refreshData = async (): Promise<void> => {
		loading.value = true;
		error.value = null;

		try {
			LaunchPadService.clearCache();
			await loadPads();
		} catch (err) {
			console.error('Error refreshing data:', err);
			error.value =
				err instanceof Error
					? err.message
					: 'Failed to refresh data. Please try again later.';
		} finally {
			loading.value = false;
		}
	};

	// Format last updated date for display
	const formattedLastUpdated = computed(() => {
		if (
			!dataInfo.value?.lastUpdated ||
			dataInfo.value.lastUpdated === 'Unknown'
		) {
			return 'Unknown';
		}

		const date = new Date(dataInfo.value.lastUpdated);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			timeZoneName: 'short',
		});
	});

	return {
		pads,
		loading,
		error,
		padSearch,
		padCountry,
		countryCodes,
		filteredPads,
		dataInfo,
		formattedLastUpdated,
		loadPads,
		getPad,
		refreshData,
	};
}
