import type { Category } from '../components/vue/home/constants';

export interface Reference {
	title: string;
	url: string;
}

export type SpaceCalc = {
	id: string;
	name: string;
	description: string;
	categories: Category[];
	image: string;
	link: string;
	advanced?: boolean;
	sponsor?: string;
	sponsorImg?: string;
	sponsorLink?: string;
	newTab?: boolean;
};
