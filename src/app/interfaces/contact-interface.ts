export interface ContactInterface {
  id?: string; 
  name: string;
  mail: string;
  phone: string;
  color?: string;
  isGuest?: boolean; //optional field to mark guest users
}

