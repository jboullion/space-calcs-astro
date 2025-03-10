import type { SpaceCalc } from '../types/types';
import {
	ADVANCED_CAT,
	ENERGY_CAT,
	HABITAT_CAT,
	LIFE_CAT,
	ORBIT_CAT,
	ROCKET_CAT,
	categories,
} from '../components/vue/home/constants';

// TODO: Figure out a better way to create calculators...may need a DB. For now, just hardcode them.
// At the very least share / pass this to the pages so they can display the name and description the same as these strings
export const unOrderedCalculators: SpaceCalc[] = [
	{
		id: 'delta-v',
		name: 'Rocket Potential Delta V',
		description: 'Calculate the delta v required for a mission',
		categories: [categories[ROCKET_CAT], categories[ORBIT_CAT]],
		image: '',
		link: '/calcs/delta-v',
	},
	{
		id: 'hohmann-transfer',
		name: 'Hohmann Transfer',
		description: 'Calculate the delta v required for a Hohmann transfer',
		categories: [categories[ROCKET_CAT], categories[ORBIT_CAT]],
		image: '',
		link: '/calcs/hohmann-transfer',
	},
	{
		id: 'orbit-visualizer',
		name: 'Orbit Visualizer',
		description: 'Visualize the orbit of a satellite',
		categories: [categories[ORBIT_CAT]],
		image: '',
		link: '/calcs/orbit-visualizer',
	},
	{
		id: 'rotating-habitats',
		name: 'Rotating Habitats',
		description:
			'Calculate the forces and properties of a rotating space habitat',
		categories: [categories[HABITAT_CAT]],
		image: '',
		link: '/calcs/rotating-habitats',
	},
	{
		id: 'habitat-requirements',
		name: 'Habitat Requirements',
		description:
			'Esimate the energy, mass, crew, and volume requirements for a habitat',
		categories: [categories[HABITAT_CAT], categories[ADVANCED_CAT]],
		image: '',
		link: '/calcs/habitat-requirements',
		sponsor: 'Sam Ross',
		sponsorImg: '/images/sponsors/sam-ross.png',
	},
	{
		id: 'nutrition-requirements',
		name: 'Nutrition Requirements',
		description: 'Estimate the nutrition requirements for a crew',
		categories: [categories[HABITAT_CAT]],
		image: '',
		link: '/calcs/nutrition-requirements',
	},
	{
		id: 'habitable-zone',
		name: 'Habitable Zone',
		description: 'Estimate the habitable zone of a star',
		categories: [categories[ORBIT_CAT]],
		image: '',
		link: '/calcs/habitable-zone',
	},
	{
		id: 'solar-energy',
		name: 'Solar Energy',
		description:
			'Estimate the available power from a solar panel anywhere in the solar system',
		categories: [categories[ENERGY_CAT], categories[HABITAT_CAT]],
		image: '',
		link: '/calcs/solar-energy',
	},
	{
		id: 'drake-equation',
		name: 'Drake Equation',
		description:
			'Estimate the number of intelligent civilizations in the Milky Way galaxy',
		categories: [categories[LIFE_CAT]],
		image: '',
		link: '/calcs/drake-equation',
	},
	{
		id: 'oneill-cylinder',
		name: "O'Neill Cylinder",
		description:
			"Create an O'Neill Cylinder and estimate the area, mass, population and energy requirements",
		categories: [categories[HABITAT_CAT], categories[ADVANCED_CAT]],
		image: '',
		link: '/calcs/oneill-cylinder',
	},
	{
		id: 'space-elevator',
		name: 'Space Elevator',
		description:
			'Create a space elevator and estimate the mass, length, and time requirements',
		categories: [categories[HABITAT_CAT]],
		image: '',
		link: '/calcs/space-elevator',
	},
	{
		id: 'lagrange-points',
		name: 'Lagrange Points',
		description: 'Calculate the Lagrange points for a two body system',
		categories: [categories[ORBIT_CAT]],
		image: '',
		link: '/calcs/lagrange-points',
	},
	{
		id: 'mass-drivers',
		name: 'Mass Drivers',
		description:
			'Calculate the length, acceleration, and power requirements for a mass driver',
		categories: [categories[ROCKET_CAT]],
		image: '',
		link: '/calcs/mass-drivers',
	},
	{
		id: 'star-travel',
		name: 'Travel Between Stars',
		description:
			'Calculate the time and energy required to travel between stars.',
		categories: [categories[ROCKET_CAT]],
		image: '',
		link: '/calcs/star-travel',
	},
	{
		id: 'fly-wheel',
		name: 'Fly Wheel',
		description: 'Estimate the properties of a fly wheel for storing power',
		categories: [categories[ENERGY_CAT]],
		image: '',
		link: '/calcs/fly-wheel',
	},
	{
		id: 'population-growth',
		name: 'Population Growth',
		description: 'Estimate population growth based on initial parameters',
		categories: [categories[LIFE_CAT]],
		image: '',
		link: '/calcs/population-growth',
	},
	{
		id: 'project-hyperion',
		name: 'Project Hyperion',
		description:
			"O'Neill Cylinder visualizer built for the Project Hyperion contest",
		categories: [categories[HABITAT_CAT], categories[ADVANCED_CAT]],
		image: '',
		link: '/calcs/project-hyperion',
		sponsor: 'Nexus Aurora',
		sponsorImg: '/images/sponsors/na-logo.png',
	},
	{
		id: 'rocket-performance',
		name: 'Rocket Engine Performance',
		description: 'Calculate the performance of a rocket engine',
		categories: [categories[ROCKET_CAT]],
		image: '',
		link: '/calcs/rocket-performance',
	},
	{
		id: 'create-planet',
		name: 'Create Planet',
		description: 'Create a planet and estimate its properties',
		categories: [categories[HABITAT_CAT]],
		image: '',
		link: '/calcs/create-planet',
	},
	{
		id: 'launch-pads',
		name: 'Launch Pads',
		description: 'Search all public launch pads on Earth',
		categories: [categories[ROCKET_CAT]],
		image: '',
		link: '/calcs/launch-pads',
	},
	// {
	// 	id: 'transfer-window',
	// 	name: 'Transfer Window',
	// 	description: 'Calculate the transfer window between two planets',
	// 	categories: [categories[ROCKET_CAT], categories[ADVANCED_CAT]],
	// 	image: '',
	// 	link: '/calcs/transfer-window',
	// },
];

export const calculators = unOrderedCalculators.sort((a, b) =>
	a.name.localeCompare(b.name),
);
