import { ref } from 'vue';
import type { ITool } from './types';

// Reference for more calcs https://www.omnicalculator.com/physics
// More Reference https://calculator.academy/math/
export const tools: ITool[] = [
	{
		name: 'Rocket Equation',
		description: 'A searchable Description',
		id: 'rocket-equation',
	},
	{
		name: 'Terminal Velocity',
		description: 'A searchable Description',
		id: 'terminal-velocity',
	},
	{
		name: 'Velocity',
		description: 'A searchable Description',
		id: 'velocity',
	},
	{
		name: 'Trajectory',
		description: 'A searchable Description',
		id: 'trajectory',
	},
	{
		name: 'Acceleration',
		description: 'A searchable Description',
		id: 'acceleration',
	},
	{
		name: 'Force',
		description: 'A searchable Description',
		id: 'force',
	},
];

export const categories = ref<{ name: string; slug: string }[]>([
	{
		name: 'Physics',
		slug: 'physics',
	},
	{
		name: 'Math',
		slug: 'math',
	},
	{
		name: 'Chemistry',
		slug: 'chemistry',
	},
	{
		name: 'Biology',
		slug: 'biology',
	},
	{
		name: 'Astronomy',
		slug: 'astronomy',
	},
	{
		name: 'Engineering',
		slug: 'engineering',
	},
	{
		name: 'Computer Science',
		slug: 'computer-science',
	},
	{
		name: 'Other',
		slug: 'other',
	},
]);
