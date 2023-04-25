export const conversion = {
  // meter conversion
  g: 9.8066,
  foot: 0.3048,
  mile: 5280,
  minLength: 2,
  maxLength: 100000,
};

export const defaultThree = {
  canvas: null,
  renderer: null,
  scene: null,
  camera: null,
  controls: null,
  station: null,
  spaceman: null,
  group: null,
  stats: null, // used for debugging
  gui: null, // used for debugging
  raycaster: null,
  mouse: null,
};

export type Location = {
  id: number;
  name: string;
  description: string;
  g: number;
  geomtry: {
    radius: number;
  };
  funnelDimentions?: {
    radius: number;
    rpm: number;
  };
};

export const locations: Location[] = [
  // {
  //   id: 1,
  //   name: "Space",
  //   description: "Baseline gravity: 0",
  //   g: 0,
  //   geomtry: null,
  //   funnelDimentions: null
  // },
  {
    id: 2,
    name: "Mars",
    description: "Baseline gravity: 0.375",
    g: 0.375,
    geomtry: {
      radius: 3396200,
    },
    // TODO: Setup default funnel stats for various locations that are "acceptible"?
    // funnelDimentions: {
    //   radius: 20, // meters
    //   rpm: 4,
    // },
  },
  {
    id: 3,
    name: "Moon",
    description: "Baseline gravity: 0.16",
    g: 0.16,
    geomtry: {
      radius: 1737400,
    },
    // funnelDimentions: {
    //   radius: 20, // meters
    //   rpm: 2.67
    // },
  },
  {
    id: 4,
    name: "Earth",
    description: "Baseline gravity: 1",
    g: 1,
    geomtry: {
      radius: 6357000,
    },
    // funnelDimentions: {
    //   radius: 20, // meters
    //   rpm: 0
    // },
  },
];

export type StationType = {
  id: number;
  name: string;
  shape: string;
  description: string;
  useInSpace: boolean;
  useOnGround: boolean;
  defaults: {
    radius: number;
    rpm: number;
    length: number;
  };
};

export const types: StationType[] = [
  {
    id: 1,
    name: "Cylinder", // Torus /
    shape: "cylinder",
    description:
      "Good for providing a permanent source of arificial gravity for an entire station.",
    useInSpace: true,
    useOnGround: false,
    defaults: {
      radius: 1000, // meters
      rpm: 0.9,
      length: 100,
    },
  },
  {
    id: 2,
    name: "Can",
    shape: "can",
    description:
      "Good for providing a periodic source of gravity on long trips through space.",
    useInSpace: true,
    useOnGround: true,
    defaults: {
      radius: 8, // meters
      rpm: 8,
      length: 3,
    },
  },
  {
    id: 3,
    name: "Bola",
    shape: "bola",
    description:
      "Good for providing a long term, but not permanent, source of arificial gravity for an entire station",
    useInSpace: true,
    useOnGround: false,
    defaults: {
      radius: 200, // meters
      rpm: 1.3,
      length: 50,
    },
  },
  {
    id: 4,
    name: "Funnel",
    shape: "funnel",
    description:
      "Good for providing a supplemental source gravity on bodies with limited gravity. ie: Moon or Mars",
    useInSpace: false,
    useOnGround: true,
    defaults: {
      radius: 500, // meters
      rpm: 1.337,
      length: 25,
    },
  },
];
