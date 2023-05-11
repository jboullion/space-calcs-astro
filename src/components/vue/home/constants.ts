export interface Category {
  name: string;
  slug: string;
  color: string;
}

// TODO: We should probably move this to a DB or figure out a better way to do this.
export const ROCKET_CAT = 0;
export const ORBIT_CAT = 1;
export const HABITAT_CAT = 2;
export const STATION_CAT = 3;
export const LIFE_CAT = 4;
export const ADVANCED_CAT = 5; // TODO: Advanced should probably be broken out into a different thing

export const categories: Category[] = [
  {
    name: "Rockets",
    slug: "rockets",
    color: "primary",
  },
  {
    name: "Orbits",
    slug: "orbits",
    color: "secondary",
  },
  {
    name: "Habitats",
    slug: "habitats",
    color: "success",
  },
  {
    name: "Stations",
    slug: "stations",
    color: "danger",
  },
  {
    name: "Life",
    slug: "life",
    color: "success",
  },
  // TODO: Perhaps split this into a different thing. IE Give each calculator a boolean of "advanced" instead of a category. Possibly hide by deafult until it is toggled on
  {
    name: "Advanced",
    slug: "advancd",
    color: "dark",
  },
];
