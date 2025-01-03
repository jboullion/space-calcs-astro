<template>
	<div>
		<section class="py-5 text-center bg-black text-light" id="home-canvas">
			<div id="homeAccents">
				<img :src="sunImage" id="homeSun" alt="Sun" />
				<img :src="earthImage" id="homeEarth" alt="Earth" />
			</div>
			<div class="container position-relative">
				<div class="row">
					<div class="col-lg-6 col-md-8 mx-auto">
						<div class="d-flex justify-content-center gap-3">
							<img
								id="homeLogo"
								:src="logoImage"
								alt="Space Calcs"
							/>
						</div>

						<p class="lead mt-4 mb-0">
							All the tools you need to calculate your mission to
							space
						</p>
					</div>
				</div>
			</div>
		</section>

		<CalcList />
	</div>
</template>

<script setup lang="ts">
import CalcList from './CalcList.vue';
import { ref } from 'vue';

// Import images using absolute URLs
const sunImage = ref('/images/sun.jpg');
const earthImage = ref('/images/earth.jpg');
const logoImage = ref('/logo.svg');
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

@media (max-width: 768px) {
	#home-canvas #homeAccents {
		display: none !important;
	}
}
</style>
