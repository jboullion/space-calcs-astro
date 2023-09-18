<template>
	<div id="tools__app" class="row justify-content-center calculator">
		<div id="tools__app__form" class="col-lg-8 m-auto">
			<ToolList />
		</div>
		<!-- <div id="tools__app__results" class="col-lg-8"> -->

		<!-- </div> -->
	</div>
</template>

<script setup lang="ts">
// TODO: Must Dos!

// ! BUGS

// ? NOTE: Optional Improvements!

import { computed, onMounted, reactive, ref } from 'vue';
import ToolList from './ToolList.vue';
import { categories, tools } from './constants';
</script>
<style></style>
