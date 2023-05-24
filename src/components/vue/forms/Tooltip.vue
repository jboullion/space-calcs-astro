<template>
  <span class="fas fa-question-circle ms-2 sc-tooltip">
    <span class="sc-tooltip-inner" v-html="tooltip"></span>
  </span>
</template>

<script setup lang="ts">
const props = defineProps({
  tooltip: String,
});
</script>

<style>
.sc-tooltip {
  position: relative;
  display: inline-block;
  cursor: help;
}

.sc-tooltip .sc-tooltip-inner {
  visibility: hidden;
  border: 1px solid var(--bs-dark);
  background-color: #fefefe;
  color: var(--bs-dark);
  width: 200px;
  font-size: 14px;
  line-height: 1.4;
  text-align: center;
  font-family: "Inter", sans-serif;
  font-weight: normal;
  border-radius: 6px;
  padding: 6px;

  /* Position the tooltip */
  position: absolute;
  z-index: 1;
  bottom: 125%;
  left: 50%;
  margin-left: -100px;
}

.sc-tooltip:hover .sc-tooltip-inner {
  visibility: visible;
}

/* .sc-tooltip-inner::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: black transparent transparent transparent;
} */
</style>
