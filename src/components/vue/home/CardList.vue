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

const props = defineProps<{
  search: string;
}>();

const filteredTools = computed(() => {
  if (props.search === "") {
    return tools;
  }

  return tools.filter(
    (tool) =>
      tool.name.toLowerCase().includes(props.search.toLowerCase()) ||
      tool.description.toLowerCase().includes(props.search.toLowerCase())
  );
});

// TODO: Is there a better way to do this? Maybe a JSON file?
const tools: SpaceTool[] = [
  {
    name: "Delta V",
    description: "Calculate the delta v required for a mission",
    category: "Mission Planning",
    image: "https://i.imgur.com/4ZQZQ2M.png",
    link: "/calcs/delta-v",
  },
  {
    name: "Hohmann Transfer",
    description: "Calculate the delta v required for a Hohmann transfer",
    category: "Mission Planning",
    image: "https://i.imgur.com/4ZQZQ2M.png",
    link: "/calcs/hohmann-transfer",
  },
  {
    name: "Orbit Visualizer",
    description: "Visualize the orbit of a satellite",
    category: "Mission Planning",
    image: "https://i.imgur.com/4ZQZQ2M.png",
    link: "/calcs/hohmann-transfer",
  },
  {
    name: "Rotational Gravity",
    description: "Calculate the forces on a rotating space station",
    category: "Mission Planning",
    image: "https://i.imgur.com/4ZQZQ2M.png",
    link: "/calcs/hohmann-transfer",
  },
];
</script>
