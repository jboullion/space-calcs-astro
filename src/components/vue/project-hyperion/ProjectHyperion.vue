<template>
	<div id="project-hyperion__app" class="row calculator">
		<iframe
			class="col-12"
			src="https://spacecalcs.com/calcs/project-hyperion-app"
			style="height: 80vh; width: 100%"
			allowfullscreen
		/>
		<div class="col-12 mt-3">
			<div class="camera-controls">
				<h2>Camera Controls</h2>
				<ul>
					<li><strong>Orbit</strong>: Left-click + drag</li>
					<li>
						<strong>Pan</strong>: Right-click + drag (or
						middle-click + drag)
					</li>
					<li><strong>Zoom</strong>: Mouse wheel scroll</li>
					<li><strong>Reset View</strong>: Double-click</li>
				</ul>
			</div>
			<button
				class="btn btn-primary"
				onclick="document.querySelector('iframe').requestFullscreen()"
			>
				Go Fullscreen
			</button>
		</div>
	</div>
</template>
