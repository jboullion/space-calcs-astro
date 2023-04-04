<template>
  <div>
    <section class="py-4 py-lg-5 text-center border-bottom">
      <div class="container">
        <div class="row">
          <div class="col-lg-6 col-md-8 mx-auto">
            <div class="d-flex justify-content-center gap-3">
              <img src="/logo.svg" alt="Space Calcs" height="70" width="30" />
              <h1 class="fw-light">Space Calcs</h1>
            </div>

            <p class="lead my-4">
              All the tools you need to calculate your mission to space.
            </p>

            <div class="input-group">
              <input
                type="text"
                class="form-control"
                placeholder="Search for a tool"
                aria-label="Search for a tool"
                v-model="search"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <CardList :search="search" />
  </div>
</template>

<script setup lang="ts">
import CardList from "./CardList.vue";
import { ref } from "vue";

const search = ref("");
</script>
