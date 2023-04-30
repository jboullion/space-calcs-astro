<template>
  <div id="drake__app" class="row justify-content-center">
    <div id="drake__form" class="col-md-8 col-lg-6">
      <!-- <h2 class="text-center mb-3">
        R<sub>∗</sub> &bull; f<sub>p</sub> &bull; n<sub>e</sub> &bull; f<sub
          >l</sub
        >
        &bull; f<sub>i</sub> &bull; f<sub>c</sub> &bull; L = N
      </h2> -->
      <div class="p-2 bg-light rounded border mb-5">
        <div class="calc-form">
          <NumberInput
            id="averageRateOfStarFormation"
            label="Average Rate of Star Formation"
            v-model.number="formData.averageRateOfStarFormation"
            prefix="R<sub>∗</sub>"
            :step="0.1"
            :min="0"
            description="Current Estimates are between 1.5 and 3"
          />
          <NumberInput
            id="fractionOfStarsWithPlanets"
            label="Fraction of stars with planets"
            v-model.number="formData.fractionOfStarsWithPlanets"
            :prefix="'f<sub>p</sub>'"
            :step="0.01"
            :min="0"
            :max="1"
            description="Current Estimates are about 1"
          />
          <NumberInput
            id="averageNumberOfPlanetsThatCanSupportLife"
            label="Average number of planets that can support life"
            v-model.number="formData.averageNumberOfPlanetsThatCanSupportLife"
            :prefix="'n<sub>e</sub>'"
            :step="0.01"
            :min="0"
            description="Current Estimates are about 0.4"
          />
          <NumberInput
            id="fractionOfPlanetsThatLifeAppears"
            label="Fraction of Planets that Life Appears"
            v-model.number="formData.fractionOfPlanetsThatLifeAppears"
            :prefix="'f<sub>l</sub>'"
            :step="0.01"
            :min="0"
            :max="1"
            description="Unknown"
          />
          <NumberInput
            id="fractionOfPlanetsThatCanSupportIntelligentLife"
            label="Fraction of Planets that can Support Intelligent Life"
            v-model.number="
              formData.fractionOfPlanetsThatCanSupportIntelligentLife
            "
            :prefix="'f<sub>i</sub>'"
            :step="0.01"
            :min="0"
            :max="1"
            description="Unknown"
          />
          <NumberInput
            id="fractionOfPlanetsThatHaveCommunicativeLife"
            label="Fraction of Planets that have Communicative Life"
            v-model.number="formData.fractionOfPlanetsThatHaveCommunicativeLife"
            :prefix="'f<sub>c</sub>'"
            :step="0.01"
            :min="0"
            :max="1"
            description="Unknown"
          />
          <NumberInput
            id="averageLifetimeOfCommunicativeCivilizations"
            label="Average Lifetime of Communicative Civilizations"
            v-model.number="
              formData.averageLifetimeOfCommunicativeCivilizations
            "
            prefix="L"
            :step="0.1"
            :min="0"
            description="Unknown"
          />
        </div>
      </div>
    </div>
    <div id="drake__results" class="col-md-4 col-lg-6 text-center">
      <img
        src="https://wikimedia.org/api/rest_v1/media/math/render/svg/08459525b4c05af9b9e1748406e26ad869d9462d"
        alt=""
        class="mb-3"
      />
      <h2 class="text-center mb-3">
        <strong>N = {{ numberOfCivilizations }}</strong>
      </h2>
    </div>
  </div>
</template>

<script setup lang="ts">
// TODO: Must Dos!

// ! BUGS

// ? NOTE: Optional Improvements!

import { computed, onMounted, ref } from "vue";
import NumberInput from "../forms/NumberInput.vue";

import type { DrakeEquationForm } from "./constants";
import { clampNumber, formatNumber } from "../utils";

const formData = ref<DrakeEquationForm>({
  averageRateOfStarFormation: 1.5,
  fractionOfStarsWithPlanets: 1,
  averageNumberOfPlanetsThatCanSupportLife: 0.4,
  fractionOfPlanetsThatLifeAppears: 0.1,
  fractionOfPlanetsThatCanSupportIntelligentLife: 0.3,
  fractionOfPlanetsThatHaveCommunicativeLife: 0.1,
  averageLifetimeOfCommunicativeCivilizations: 1000,
});

/**
 *
 *
 * COMPUTED
 *
 *
 */
const numberOfCivilizations = computed(() => {
  return formatNumber(
    formData.value.averageRateOfStarFormation *
      formData.value.fractionOfStarsWithPlanets *
      formData.value.averageNumberOfPlanetsThatCanSupportLife *
      formData.value.fractionOfPlanetsThatLifeAppears *
      formData.value.fractionOfPlanetsThatCanSupportIntelligentLife *
      formData.value.fractionOfPlanetsThatHaveCommunicativeLife *
      formData.value.averageLifetimeOfCommunicativeCivilizations,
    2
  );
});

/**
 *
 *
 * SETUP
 *
 *
 */
onMounted(() => {});

/**
 *
 *
 * METHODS
 *
 *
 */
</script>
<style></style>
