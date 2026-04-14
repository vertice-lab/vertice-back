export interface SeedOffice {
  country: string;
  city: string;
  address: string;
  openingTime: string;
  closingTime: string;
  isActive: boolean;
}

export const offices: SeedOffice[] = [
  {
    country: 'Argentina',
    city: 'Buenos Aires',
    address: 'Oficina Central - Microcentro',
    openingTime: '09:00',
    closingTime: '18:00',
    isActive: true,
  },
  {
    country: 'Colombia',
    city: 'Bogotá',
    address: 'Oficina Principal - Zona T',
    openingTime: '09:00',
    closingTime: '18:00',
    isActive: true,
  },
  {
    country: 'Venezuela',
    city: 'Caracas',
    address: 'Oficina Principal - Chacao',
    openingTime: '09:00',
    closingTime: '18:00',
    isActive: true,
  },
];
