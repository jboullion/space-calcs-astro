export interface Category {
    name: string;
    slug: string;
    color: string;
}

// TODO: We should probably move this to a DB or figure out a better way to do this.
export const ADVANCED_CAT = 0; // TODO: Advanced should probably be broken out into a different thing
export const ENERGY_CAT = 1;
export const HABITAT_CAT = 2;
export const LIFE_CAT = 3;
export const ORBIT_CAT = 4;
export const ROCKET_CAT = 5;
export const STATION_CAT = 6;

export const categories: Category[] = [
    // TODO: Perhaps split this into a different thing. IE Give each calculator a boolean of "advanced" instead of a category. Possibly hide by deafult until it is toggled on
    {
        name: 'Advanced',
        slug: 'advancd',
        color: 'dark',
    },
    {
        name: 'Energy',
        slug: 'energy',
        color: '',
    },
    {
        name: 'Habitats',
        slug: 'habitats',
        color: 'success',
    },
    {
        name: 'Life',
        slug: 'life',
        color: 'success',
    },

    {
        name: 'Orbits',
        slug: 'orbits',
        color: 'info',
    },
    {
        name: 'Rockets',
        slug: 'rockets',
        color: 'danger',
    },
    {
        name: 'Stations',
        slug: 'stations',
        color: 'primary',
    },
];
