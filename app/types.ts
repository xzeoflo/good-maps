export interface AccessiblePlace {
  id: string;
  name: string;
  lat: number;
  lon: number;
  address: string;
  wheelchair: "yes" | "limited" | "no" | "unknown";
  toiletWheelchair: boolean;
  openingHours?: string;
  phone?: string;
  website?: string;
  type: string;
  tags: Record<string, string>;
}
