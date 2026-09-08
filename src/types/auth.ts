export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Company {
  id: string;
  user_id: string;
  name: string;
  industry: string;
  entity_type:
    | "manufacturer"
    | "recycler"
    | "processor"
    | "logistics"
    | "energy_recovery";
  locality: string;
  location: {
    address: string;
    city: string;
    country: string;
    lat: number;
    lng: number;
  };
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  user: User;
  company: Company;
  access_token: string;
}
