<template>
  <button type="button" @click="changeTheme()" class="btn btn-dark fs-4">
    <i v-if="theme === 'light'" class="fa-solid fa-fw fa-moon"></i>
    <i v-if="theme === 'dark'" class="fa-solid fa-fw fa-sun"></i>
  </button>
</template>

<script setup lang="ts">
import { onBeforeMount, ref } from "vue";

const theme = ref<"light" | "dark">("light");

onBeforeMount(() => {
  if (localStorage.getItem("theme") == "dark") {
    theme.value = "dark";
  }
});

function changeTheme() {
  if (theme.value == "dark") {
    theme.value = "light";
  } else {
    theme.value = "dark";
  }

  document.documentElement.setAttribute("data-bs-theme", theme.value);

  localStorage.setItem("theme", theme.value);
}
</script>
