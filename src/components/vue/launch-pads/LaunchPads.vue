<template>
	<div id="population-growth__app" class="row calculator">
		<div id="population-growth__form" class="col-12">
			<div id="padMap" class="flex-fill">
				<div class="row">
					<div class="col-md-4 mb-4 relative">
						<div class="pad-form">
							<div class="mb-3">
								<label for="padSearch" class="form-label"
									>Pad Search</label
								>
								<input
									type="search"
									class="form-control"
									id="padSearch"
									placeholder=""
									v-model="padSearch"
									@input="debounceBuildMapPads()"
								/>
							</div>
							<div class="mb-3">
								<label for="padCountry" class="form-label"
									>Pad Country</label
								>
								<select
									id="padCountry"
									class="form-select"
									aria-label="Select Pad Country"
									v-model="padCountry"
									@input="debounceBuildMapPads()"
								>
									<option value="" selected>All</option>
									<option
										v-for="code in countryCodes"
										:value="code"
										:key="code"
									>
										{{ code }}
									</option>
								</select>
							</div>

							<!-- Admin-only section if user is authenticated -->
							<div class="mt-4 mb-3 p-3 border rounded">
								<h4>Admin Controls</h4>
								<button
									class="btn btn-primary"
									@click="updatePads"
									:disabled="loading || updateLoading"
								>
									<span v-if="updateLoading">
										<i
											class="fa-solid fa-circle-notch fa-spin me-2"
										></i
										>Updating...
									</span>
									<span v-else>
										<i class="fa-solid fa-sync me-2"></i
										>Update Launch Pads
									</span>
								</button>
								<div
									v-if="updateMessage"
									class="mt-2 alert"
									:class="
										updateSuccess
											? 'alert-success'
											: 'alert-danger'
									"
								>
									{{ updateMessage }}
								</div>
							</div>
						</div>
					</div>
					<div class="col-md-8">
						<div v-if="loading" class="text-center my-5">
							<i
								class="fa-solid fa-circle-notch fa-spin fa-3x"
							></i>
							<p class="mt-3">Loading launch pads...</p>
						</div>

						<div v-else-if="error" class="alert alert-danger">
							{{ error }}
						</div>

						<div v-else>
							<div id="map" ref="map" class="google-map"></div>

							<div class="pad_list mt-5">
								<table
									class="pad_list__table table table-striped table-hover"
								>
									<thead>
										<tr>
											<th>#</th>
											<th>Location</th>
											<th>Pad</th>
											<th class="text-center">
												Launches
											</th>
											<th class="text-end">Country</th>
										</tr>
									</thead>
									<tbody>
										<tr
											class="pad_list__row"
											v-for="(pad, index) in filteredPads"
											:key="pad.id"
											@click="openMapMarker(pad.id)"
										>
											<td class="">
												{{ index + 1 }}
											</td>
											<td class="">
												{{ pad.location_name }}
											</td>
											<td class="">
												{{ pad.name }}
											</td>
											<td class="text-center">
												{{ pad.total_launch_count }}
											</td>
											<td class="text-end">
												{{ pad.country_code }}
											</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
// @ts-nocheck
// Despite importing the google map types, the compiler still complains about all the google.maps types
// Probably a simple resolution to this, but my brain is COVID mush right now

import { computed, onMounted, ref } from 'vue';
import { Loader } from '@googlemaps/js-api-loader';
import { useLaunchPads } from './useLaunchPads';
import { supabase } from '../../../lib/supabaseClient';
import { useStore } from '@nanostores/vue';
import { storeUser } from '../../../utils/store';

// Map element reference
let map: HTMLElement;
const markers = ref<google.maps.Marker[]>([]);

// Google Maps configuration
const additionalOptions = {};
const loader = new Loader({
	apiKey: import.meta.env.PUBLIC_GOOGLE_MAPS_API_KEY,
	version: 'weekly',
	...additionalOptions,
});

// Get current user from store
const $user = useStore(storeUser);

// Check if user is an admin (you'll need to define your own criteria)
const isAdmin = computed(() => {
	return !!$user.value;
});

// Launch pad state
const {
	loading,
	error,
	padSearch,
	padCountry,
	countryCodes,
	filteredPads,
	loadPads,
} = useLaunchPads();

// Update state
const updateLoading = ref(false);
const updateMessage = ref('');
const updateSuccess = ref(false);

// Load all pads on component mount
onMounted(async () => {
	await loadPads();
	buildMapPads();
});

// Update launch pads from the Space Devs API (admin only)
async function updatePads() {
	//if (!isAdmin.value) return;

	updateLoading.value = true;
	updateMessage.value = '';

	try {
		const { updateAllPads } = useLaunchPads();
		const result = await updateAllPads();

		updateSuccess.value = result.success;
		updateMessage.value = result.message;

		if (result.success) {
			// Rebuild the map with the updated pads
			buildMapPads(true);
		}
	} catch (error) {
		updateSuccess.value = false;
		updateMessage.value = error.message || 'An unknown error occurred';
	} finally {
		updateLoading.value = false;
	}
}

// Debounce map updates when filtering
let timeoutId: ReturnType<typeof setTimeout>;
function debounceBuildMapPads() {
	clearTimeout(timeoutId);
	timeoutId = setTimeout(() => {
		buildMapPads(true);
	}, 200);
}

// Build the Google Map with markers for each pad
function buildMapPads(recenter = false) {
	markers.value = [];

	if (filteredPads.value.length > 0) {
		loader.load().then(async () => {
			const { Map } = (await google.maps.importLibrary(
				'maps',
			)) as google.maps.MapsLibrary;

			const { AdvancedMarkerElement, PinElement } =
				(await google.maps.importLibrary(
					'marker',
				)) as google.maps.MarkerLibrary;

			map = new Map(document.getElementById('map'), {
				center: { lat: 28.4458, lng: -80.5657 },
				zoom: 3,
				minZoom: 2,
				mapId: 'c9aed3a80eb0e1f2',
				zoomControl: false,
				mapTypeControl: true,
				scaleControl: true,
				streetViewControl: false,
				rotateControl: false,
				fullscreenControl: true,
			});

			const infoWindow = new google.maps.InfoWindow();

			filteredPads.value.forEach((pad) => {
				const padLocation = {
					lat: parseFloat(pad.latitude),
					lng: parseFloat(pad.longitude),
				};

				const title = pad.name;

				const contentString =
					'<div id="content" class="info-window">' +
					'<h2>' +
					title +
					'</h2>' +
					'<div class="info-window__content">' +
					'<p class="text-elipsis"><b>Launches:</b> ' +
					pad.total_launch_count +
					'<br />' +
					'<b>Wiki:</b> <a href="' +
					pad.wiki_url +
					'" target="_blank">' +
					pad.wiki_url +
					'</a><br />' +
					'<b>Country:</b> ' +
					pad.country_code +
					'</p>' +
					'</div>' +
					'</div>';

				// A new icon and faPin must me created for each marker
				const icon = document.createElement('div');
				icon.innerHTML =
					'<svg xmlns="http://www.w3.org/2000/svg" style="padding-top: 3px;" width="20" height="20" viewBox="0 0 512 512"><path fill="none" stroke="#f84d33" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M461.81 53.81a4.4 4.4 0 0 0-3.3-3.39c-54.38-13.3-180 34.09-248.13 102.17a294.9 294.9 0 0 0-33.09 39.08c-21-1.9-42-.3-59.88 7.5c-50.49 22.2-65.18 80.18-69.28 105.07a9 9 0 0 0 9.8 10.4l81.07-8.9a180.29 180.29 0 0 0 1.1 18.3a18.15 18.15 0 0 0 5.3 11.09l31.39 31.39a18.15 18.15 0 0 0 11.1 5.3a179.91 179.91 0 0 0 18.19 1.1l-8.89 81a9 9 0 0 0 10.39 9.79c24.9-4 83-18.69 105.07-69.17c7.8-17.9 9.4-38.79 7.6-59.69a293.91 293.91 0 0 0 39.19-33.09c68.38-68 115.47-190.86 102.37-247.95M298.66 213.67a42.7 42.7 0 1 1 60.38 0a42.65 42.65 0 0 1-60.38 0"/><path fill="none" stroke="#f84d33" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M109.64 352a45.06 45.06 0 0 0-26.35 12.84C65.67 382.52 64 448 64 448s65.52-1.67 83.15-19.31A44.73 44.73 0 0 0 160 402.32"/></svg>';

				const faPin = new PinElement({
					glyph: icon,
					background: '#f7f0dc',
					borderColor: '#f84d33',
				});

				const marker = new AdvancedMarkerElement({
					map: map,
					position: padLocation,
					content: faPin.element,
					title: title,
				});

				marker.addListener('click', () => {
					infoWindow.close();
					infoWindow.setContent(contentString);
					infoWindow.open(map, marker);
				});

				marker.padId = pad.id;
				markers.value.push(marker);
			});

			if (recenter && filteredPads.value.length > 0) {
				const newCenter = new google.maps.LatLng(
					parseFloat(filteredPads.value[0].latitude),
					parseFloat(filteredPads.value[0].longitude),
				);

				map.setCenter(newCenter);
			}
		});
	}
}

// Open the info window for a specific marker
function openMapMarker(padId: number) {
	const marker = markers.value.find((marker) => {
		return marker.padId === padId;
	});

	if (marker) {
		new google.maps.event.trigger(marker, 'click');
	}
}
</script>

<style>
#map {
	height: 500px;
	width: 100%;
}

.pad_list {
	overflow-x: auto;
}

.pad_list__row {
	cursor: pointer;
}

.pad-form {
	position: sticky;
	top: 20px;
}

/* Customize the Google Maps Info Window */
.gm-style-iw {
	background-color: #fff;
	box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
	border-radius: 8px;
	padding: 10px;
}

.gm-style-iw h2 {
	font-size: 26px;
	color: black;
}

.gm-style-iw p {
	font-size: 16px;
	line-height: 1.5;
	color: black;
}

.gm-style-iw p b {
	font-weight: bold;
}

/* Customize the Close Button */
.gm-style-iw-close {
	color: #111;
	font-size: 18px;
}
</style>
