export interface Category {
  name: string;
  slug: string;
  color: string;
}

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
];
