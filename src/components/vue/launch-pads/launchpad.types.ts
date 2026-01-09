export interface LaunchPadLocation {
	id: number;
	name: string;
	country_code: string;
	description: string | null;
	timezone_name: string;
	total_launch_count: number;
	total_landing_count: number;
}

export interface LaunchPad {
	id: number;
	agency_id: number | null;
	name: string;
	description: string | null;
	info_url: string | null;
	wiki_url: string;
	map_url: string;
	latitude: string;
	longitude: string;
	location_id: number;
	country_code: string;
	map_image: string;
	total_launch_count: number;
	orbital_launch_attempt_count: number;
	location_name?: string;
	location?: LaunchPadLocation;
}

// Extend the Database types for Supabase
export interface LaunchPadDatabase {
	public: {
		Tables: {
			launch_pads: {
				Row: LaunchPad;
				Insert: Omit<LaunchPad, 'location'>;
				Update: Partial<Omit<LaunchPad, 'location'>>;
				Relationships: [
					{
						foreignKeyName: 'launch_pads_location_id_fkey';
						columns: ['location_id'];
						referencedRelation: 'launch_pad_locations';
						referencedColumns: ['id'];
					},
				];
			};
			launch_pad_locations: {
				Row: LaunchPadLocation;
				Insert: LaunchPadLocation;
				Update: Partial<LaunchPadLocation>;
				Relationships: [];
			};
		};
	};
}
