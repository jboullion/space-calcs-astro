export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export interface Database {
    public: {
        Tables: {
            calculators: {
                Row: {
                    calculator_id: string | null;
                    created_at: string;
                    data: Json | null;
                    id: number;
                    name: string | null;
                    user_id: string | null;
                };
                Insert: {
                    calculator_id?: string | null;
                    created_at?: string;
                    data?: Json | null;
                    id?: number;
                    name?: string | null;
                    user_id?: string | null;
                };
                Update: {
                    calculator_id?: string | null;
                    created_at?: string;
                    data?: Json | null;
                    id?: number;
                    name?: string | null;
                    user_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'calculators_user_id_fkey';
                        columns: ['user_id'];
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
}

export type FlyWheelRow = {
    calculator_id: string | null;
    created_at: string;
    data: any; // IFlyWheelForm JSON field
    id: number;
    name: string | null;
    user_id: string | null;
};
