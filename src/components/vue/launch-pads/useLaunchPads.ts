import { ref, computed } from 'vue';
import { LaunchPadService } from './LaunchPadService';
import type { LaunchPad } from './launchpad.types';

export function useLaunchPads() {
	const pads = ref<LaunchPad[]>([]);
	const loading = ref<boolean>(true);
	const error = ref<string | null>(null);
	const padSearch = ref<string>('');
	const padCountry = ref<string>('');

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
			pads.value = await LaunchPadService.getList();
		} catch (err) {
			console.error('Error loading launch pads:', err);
			error.value = 'Failed to load launch pads. Please try again later.';
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

	// Update all launch pads from the Space Devs API
	// This would typically be called by an admin or scheduled task
	const updateAllPads = async (): Promise<{
		success: boolean;
		message: string;
	}> => {
		loading.value = true;
		error.value = null;

		try {
			const result = await LaunchPadService.updateLaunchPads();

			if (result.success) {
				// Reload the pads after a successful update
				await loadPads();
			} else {
				error.value = result.message;
			}

			return result;
		} catch (err) {
			const message =
				err instanceof Error
					? err.message
					: 'An unknown error occurred';
			error.value = message;
			return { success: false, message };
		} finally {
			loading.value = false;
		}
	};

	return {
		pads,
		loading,
		error,
		padSearch,
		padCountry,
		countryCodes,
		filteredPads,
		loadPads,
		getPad,
		updateAllPads,
	};
}
