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
export const ADVANCED_CAT = 4;

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
    name: "Advanced",
    slug: "advancd",
    color: "dark",
  },
];