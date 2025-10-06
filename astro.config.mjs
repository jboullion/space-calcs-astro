import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'url';
import { calculators } from './src/utils/calculator-list.ts';

import vue from '@astrojs/vue';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
	site: 'https://spacecalcs.com',
	trailingSlash: 'ignore',
	integrations: [
		vue(),
		sitemap({
			// Create a list of all calculator pages
			customPages: calculators.map(
				(calc) => `https://spacecalcs.com${calc.link}`,
			),
		}),
		react(),
	],
	vite: {
		ssr: {
			noExternal: ['@googlemaps/js-api-loader'],
		},
		resolve: {
			alias: {
				'@': fileURLToPath(new URL('./src', import.meta.url)),
				'@components': fileURLToPath(
					new URL('./src/components', import.meta.url),
				),
				'@lib': fileURLToPath(new URL('./src/lib', import.meta.url)),
				'@utils': fileURLToPath(
					new URL('./src/utils', import.meta.url),
				),
				'@types': fileURLToPath(
					new URL('./src/types', import.meta.url),
				),
				'@images': fileURLToPath(
					new URL('./src/assets/images', import.meta.url),
				),
			},
		},
		assetsInclude: ['**/*.vert', '**/*.frag'],
		plugins: [
			{
				name: 'glsl',
				transform(code, id) {
					if (/\.(vert|frag)$/.test(id)) {
						const content = JSON.stringify(code);
						return {
							code: `export default ${content};`,
							map: null,
						};
					}
				},
			},
		],
	},
});
