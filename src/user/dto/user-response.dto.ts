export class UserResponseDto {
  id: string;
  name: string | null;
  lastName: string | null;
  email: string;
  roleId: string;
  verified: boolean;
  active: boolean;
  countryCode: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  role?: {
    id: string;
    name: string;
    level: number;
  };
  information?: {
    phone: string | null;
    dateBirth: string | null;
    address: string | null;
    documentNumber: string | null;
    documentType: string | null;
    postalCode: string | null;
    acceptedTerms: boolean;
    receiveMarketingEmails: boolean;
  };
  country?: {
    country_name: string;
    country_code: string;
  };
}
