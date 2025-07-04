export interface ContactInterface {
  id?: string; 
  name: string;
  email: string;
  phone: string;
  color?: string;
  isGuest?: boolean; //optional field to mark guest users
}

