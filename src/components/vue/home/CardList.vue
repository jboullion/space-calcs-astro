<template>
  <div class="album py-5 bg-light flex-fill">
    <div class="container">
      <div
        class="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3 justify-content-center"
      >
        <div class="col" v-for="tool in filteredTools">
          <Card :tool="tool" />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import type { SpaceTool } from "../../../types/types";
import Card from "./Card.vue";
import { categories } from "./constants";

const props = defineProps<{
  search: string;
  activeCategories: string[];
}>();

const filteredTools = computed(() => {
  if (props.activeCategories.length === 0) {
    return tools.filter(
      (tool) =>
        tool.name.toLowerCase().includes(props.search.toLowerCase()) ||
        tool.description.toLowerCase().includes(props.search.toLowerCase())
    );
  }

  return tools.filter((tool) => {
    const catList = tool.categories.map((cat) => cat.slug);
    return (
      props.activeCategories.filter((value) => catList.includes(value)) &&
      (tool.name.toLowerCase().includes(props.search.toLowerCase()) ||
        tool.description.toLowerCase().includes(props.search.toLowerCase()))
    );
  });
});

// TODO: Is there a better way to do this? Maybe a JSON file?
const tools: SpaceTool[] = [
  {
    name: "Delta V",
    description: "Calculate the delta v required for a mission",
    categories: [categories[0]],
    image: "https://i.imgur.com/4ZQZQ2M.png",
    link: "/calcs/delta-v",
  },
  {
    name: "Hohmann Transfer",
    description: "Calculate the delta v required for a Hohmann transfer",
    categories: [categories[1]],
    image: "https://i.imgur.com/4ZQZQ2M.png",
    link: "/calcs/hohmann-transfer",
  },
  {
    name: "Orbit Visualizer",
    description: "Visualize the orbit of a satellite",
    categories: [categories[1]],
    image: "https://i.imgur.com/4ZQZQ2M.png",
    link: "/calcs/orbit-visualizer",
  },
  {
    name: "Rotational Gravity",
    description: "Calculate the forces on a rotating space station",
    categories: [categories[3]],
    image: "https://i.imgur.com/4ZQZQ2M.png",
    link: "/calcs/rotational-gravity",
  },
  {
    name: "Habitat Requirements",
    description:
      "Esimate the energy, mass, crew, and volume requirements for a habitat",
    categories: [categories[2]],
    image: "https://i.imgur.com/4ZQZQ2M.png",
    link: "/calcs/habitat-requirements",
  },
];
</script>
