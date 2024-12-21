export interface IPopulationGrowthForm {
	initialPopulation: number;
	initialAgeDistribution: number[];
	birthRate: number;
	deathRate: number;
	lifeExpectancy: number;
	years: number;
}
