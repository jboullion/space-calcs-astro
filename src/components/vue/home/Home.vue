<template>
    <div>
        <section class="py-5 text-center bg-black text-light" id="home-canvas">
            <div id="homeAccents">
                <img src="/images/sun.jpg" id="homeSun" alt="" />
                <img src="/images/earth.jpg" id="homeEarth" alt="" />
            </div>
            <div class="container position-relative">
                <div class="row">
                    <div class="col-lg-6 col-md-8 mx-auto">
                        <div class="d-flex justify-content-center gap-3">
                            <img
                                id="homeLogo"
                                src="/logo.svg"
                                alt="Space Calcs"
                            />
                            <!-- <Logo /> -->
                            <!-- <h1 class="fw-light">Space Calcs</h1> -->
                        </div>

                        <p class="lead my-4">
                            All the tools you need to calculate your mission to
                            space
                        </p>

                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <div class="input-group">
                                    <input
                                        type="text"
                                        class="form-control"
                                        placeholder="Search for a tool"
                                        aria-label="Search for a tool"
                                        v-model="search"
                                    />
                                    <span class="input-group-text"
                                        ><i class="fas fa-search"></i
                                    ></span>
                                </div>
                            </div>
                            <div class="col-md-6 mb-3">
                                <select
                                    class="form-select"
                                    placeholder="Select Category"
                                    aria-label="Select Category"
                                    v-model="selectedCategory"
                                    @change="toggleCategory()"
                                >
                                    <option value="" selected>All</option>
                                    <option
                                        v-for="category in categories"
                                        :key="category.slug"
                                        :value="category.slug"
                                    >
                                        {{ category.name }}
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <CalcList :search="search" :active-categories="activeCategories" />
    </div>
</template>

<script setup lang="ts">
import * as THREE from 'three';

import CalcList from './CalcList.vue';
import Logo from '../shared/Logo.vue';

import { onMounted, ref } from 'vue';
import { categories } from './constants';
import {
    SUPA_PROJECT_URL,
    SUPA_ANON_PUBLIC,
} from '../../../utils/public-variables';
import { supabase } from '../../../lib/supabaseClient';

const search = ref('');

const activeCategories = ref<string[]>([]);
const selectedCategory = ref<string>('');

function toggleCategory() {
    if (selectedCategory.value === '') {
        activeCategories.value = [];
    } else {
        activeCategories.value = [selectedCategory.value];
    }
}

onMounted(async () => {
    // fetch(SUPA_PROJECT_URL + '/rest/v1/todos', {
    //     headers: {
    //         apikey: SUPA_ANON_PUBLIC,
    //     },
    // })
    //     .then((response) => response.json())
    //     .then((data) => console.log(data));

    const { data, error } = await supabase.from('todos').select();
    console.log(data, error);

    // const { data, error } = await supabase.from('countries').select();
    // console.log(data, error);
});
</script>

<style>
#home-canvas {
    position: relative;
}

#home-canvas #homeAccents {
    display: flex;
    justify-content: space-between;
    width: 100%;
    position: absolute;
    top: 0;
    height: 100%;
}

/* #home-canvas .container {
  position: relative;
  z-index: 2;
}

#home-canvas canvas {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
} */

@media (max-width: 768px) {
    #home-canvas canvas,
    #home-canvas #homeAccents {
        display: none !important;
    }
}
</style>
