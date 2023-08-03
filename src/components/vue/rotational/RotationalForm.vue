<template>
    <div class="calc-form col-12 mb-5 px-2 rounded border">
        <div>
            <div id="mission" class="rotational__mission">
                <!-- <h4>Mission</h4> -->
                <div class="calc-toggle">
                    <SelectInput
                        id="structureType"
                        label="Structure Type"
                        v-model="formData.type"
                        :options="availableTypes"
                        tooltip="What type of object is rotating? Different structures provide different advantages."
                        @update:modelValue="updateType"
                        :description="formData.type.description"
                    />

                    <NumberInput
                        v-if="formData.type.shape != 'can'"
                        id="shipLength"
                        :label="structureLengthName"
                        v-model="formData.shipLength"
                        tooltip="The length of the structure. This is only visual and does not affect the results."
                        :min="1"
                        unit="m"
                        @change="updateShipLength"
                    />

                    <NumberInput
                        id="radius"
                        label="Radius"
                        v-model="formData.radius"
                        tooltip="The distance from the center of rotation to the outer edge of the structure."
                        :min="0"
                        unit="m"
                        @change="updateRadius"
                    />

                    <NumberInput
                        id="rpm"
                        :key="`rpm-${rpmKey}`"
                        label="Revolutions per minute"
                        v-model="formData.rpm"
                        tooltip="The rotation speed of the structure"
                        :min="0"
                        :max="1000"
                        :step="0.1"
                        unit="rpm"
                        @change="updateRPM"
                    />

                    <NumberInput
                        id="gravity"
                        :key="`gravity-${gravityKey}`"
                        label="Gravity"
                        v-model="formData.gravity"
                        tooltip="The apparent gravity applied by the centripetal acceleration."
                        :min="0"
                        :step="0.01"
                        unit="g"
                        @change="updateGravity"
                    />

                    <SelectInput
                        id="location"
                        label="Location"
                        v-model="formData.location"
                        :options="locations"
                        tooltip="Update your environment and apply natural gravity if applicaible"
                        @update:modelValue="setupScene"
                        :description="formData.location.description"
                    />

                    <CheckboxInput
                        id="showEnvironment"
                        label="Show environment?"
                        v-model="formData.showEnvironment"
                        tooltip="Show the planet at your location. Purely visual."
                        @change="setupScene"
                    />

                    <!-- <div class="form-check form-switch mb-3">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="isSpace"
                  v-model="formData.isSpace"
                  @change="setupScene"
                />
                <label class="form-check-label" for="isSpace">
                  In Space?
                  <i
                    class="fas fa-question-circle"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="0g environment or on the surface of a planet?"
                  ></i>
                </label>
              </div> -->

                    <CheckboxInput
                        id="seeInside"
                        label="Show Inside of Structure?"
                        v-model="formData.seeInside"
                        tooltip="Display the inside or outside of the structure. Purely visual."
                        @change="setupScene"
                    />

                    <CheckboxInput
                        v-if="
                            formData.type.shape == 'cylinder' ||
                            formData.type.shape == 'can'
                        "
                        id="hollow"
                        label="Hollow Cylinder?"
                        v-model="formData.hollow"
                        tooltip="Should the structure be hollow? Purely visual."
                        @change="setupScene"
                    />

                    <!-- <div class="form-check form-switch mb-3">
            <input class="form-check-input" type="checkbox" id="focusSuit" v-model="formData.focusSuit">
            <label class="form-check-label" for="focusSuit">
              Focus on suit?
            </label>
          </div> -->
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
// TODO: Must Dos!

// ! BUGS

// ? NOTE: Optional Improvements!

import { computed, onMounted, ref } from 'vue';
import NumberInput from '../forms/NumberInput.vue';
import SelectInput from '../forms/SelectInput.vue';
import type { BodyRelation, ILagrangeForm } from './types';
import { physicsConstants, formatNumber } from '../utils';

const props = defineProps<{
    formData: ILagrangeForm;
}>();
</script>
