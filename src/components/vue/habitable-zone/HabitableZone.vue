<template>
    <div id="habitable-transfer__app" class="row">
        <div id="habitable__form" class="col-lg-4">
            <div class="calc-form mb-5 p-2 rounded border">
                <!-- <SelectInput
          id="star-type"
          label="Star Type"
          v-model="formData.starType"
          :options="starTypes"
          tooltip="Type of star. Our sun is a G type star"
        >
        </SelectInput> -->

                <!-- <NumberInput
          id="star-mass"
          label="Star Mass"
          v-model.number="formData.starMass"
          unit="M☉"
          tooltip="Mass of the star in solar masses. Our sun is ~1 M☉"
        />

        <NumberInput
          id="star-age"
          label="Star Age"
          v-model.number="formData.starAge"
          unit="Gyr"
          tooltip="Age of the star in billions of years. Our sun is ~4.6 Gyrs old"
        /> -->

                <NumberInput
                    id="star-radius"
                    label="Star Radius"
                    v-model.number="formData.starRadius"
                    :step="0.1"
                    :max="1000"
                    :min="0.1"
                    unit="R☉"
                    tooltip="Radius of the star in solar radii. Our sun is ~1 R☉"
                    :description="`${formatNumber(starKilometers)} km`"
                    @change="
                        formData.starRadius = clampNumber(
                            formData.starRadius,
                            0.1,
                            1000,
                        )
                    "
                />
                <NumberInput
                    id="star-temperature"
                    label="Star Temperature"
                    v-model.number="formData.starTemperature"
                    unit="K"
                    :min="1000"
                    :max="20000"
                    tooltip="Temperature of the star in Kelvin. Our sun is ~5778 K"
                    :description="`${formatNumber(
                        starCelsius,
                    )} °C<br /> ${formatNumber(starFahrenheit)} °F`"
                    @change="
                        formData.starTemperature = clampNumber(
                            formData.starTemperature,
                            1000,
                            20000,
                        )
                    "
                />
                <!-- <NumberInput
          id="star-luminosity"
          label="Star Luminosity"
          v-model.number="formData.starLuminosity"
          unit="L☉"
          tooltip="Luminosity of the star in solar luminosities. Our sun is ~1 L☉"
        /> -->

                <NumberInput
                    id="orbit"
                    label="Planet Orbit"
                    v-model.number="formData.planetOrbit"
                    unit="AU"
                    :step="0.1"
                    :max="1000"
                    tooltip="Distance from the star in astronomical units. Earth is ~1 AU"
                    :description="`${formatNumber(planetKm)} km`"
                    @change="
                        formData.planetOrbit = clampNumber(
                            formData.planetOrbit,
                            0.1,
                            1000,
                        )
                    "
                />

                <CheckboxInput
                    id="show-orbits"
                    label="Show example orbits?"
                    v-model="formData.showExampleOrbits"
                    :value="false"
                    tooltip="Show Venus, Earth, Mars, and other orbits"
                />

                <CheckboxInput
                    id="show-labels"
                    label="Show labels?"
                    v-model="formData.showLabels"
                    :value="false"
                />

                <!-- <NumberInput
          id="albedo"
          label="Albedo"
          v-model.number="formData.planetAlbedo"
          unit="%"
          tooltip="Percentage of light reflected by the planet. Earth is ~37%"
        />
        <NumberInput
          id="atmosphere"
          label="Atmosphere Density"
          v-model.number="formData.planetAtmosphere"
          unit="atm"
          tooltip="Density of the atmosphere in atmospheres. Earth is ~1"
        /> -->
            </div>
        </div>

        <HabitableResults :formData="formData" />
    </div>
</template>

<script setup lang="ts">
// TODO: Must Dos!

// ! BUGS

// ? NOTE: Optional Improvements!

import { computed, onMounted, ref } from 'vue';
import NumberInput from '../forms/NumberInput.vue';
import CheckboxInput from '../forms/CheckboxInput.vue';

import HabitableResults from './HabitableResults.vue';
//import HabitableForm from "./OLD-HabitableForm.vue";
import type { HabitableZoneForm, StarType } from './constants';
import { clampNumber, formatNumber, kToC, physicsConstants } from '../utils';

const loading = ref(true);

const starTypes: StarType[] = [
    { value: 'G', name: 'G' },
    { value: 'M', name: 'M' },
    { value: 'K', name: 'K' },
    { value: 'F', name: 'F' },
    { value: 'A', name: 'A' },
    { value: 'B', name: 'B' },
    { value: 'O', name: 'O' },
];

const formData = ref<HabitableZoneForm>({
    starMass: 1, // Multiples of Sol
    starAge: 5, // In billions of years
    starType: starTypes[0], // G, M, K, F, A, B, O
    starRadius: 1, // In solar radii
    starTemperature: 5778, // In Kelvin
    planetOrbit: 1, // In AU
    planetAlbedo: 0.37, // Percentage
    planetAtmosphere: 1, // In atmospheres
    showExampleOrbits: false,
    showLabels: true,
});

const starKilometers = computed(() => {
    return formData.value.starRadius * physicsConstants.sunRadius;
});

const starCelsius = computed(() => {
    return kToC(formData.value.starTemperature);
});

const starFahrenheit = computed(() => {
    return (starCelsius.value * 9) / 5 + 32;
});

const planetKm = computed(() => {
    return formData.value.planetOrbit * physicsConstants.AU;
});

onMounted(() => {
    loading.value = false;
});
</script>
<style></style>
