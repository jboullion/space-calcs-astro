<template>
	<div>
		<section class="py-5 text-center bg-black text-light" id="home-canvas">
			<div id="homeAccents">
				<img :src="sunImg.src" id="homeSun" alt="" />
				<img :src="earthImg.src" id="homeEarth" alt="" />
			</div>
			<div class="container position-relative">
				<div class="row">
					<div class="col-lg-6 col-md-8 mx-auto">
						<div class="d-flex justify-content-center gap-3">
							<img
								id="homeLogo"
								:src="logoImg.src"
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
import sunImg from '@images/sun.jpg';
import earthImg from '@images/earth.jpg';
import logoImg from '@images/logo.svg';
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
