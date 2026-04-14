export class BankAccountResponseDto {
  id: string;
  financialInstitutionName: string;
  country: string;
  type: string;
  accountHolderName?: string | null;
  accountHolderId?: string | null;
  accountNumberOrCode?: string | null;
  aliasOrReference?: string | null;
  phoneNumber?: string | null;
  emailAddress?: string | null;
  bankAccountType?: string | null;
  addressOrDetails?: string | null;
  additionalNotes?: string | null;
  currencyCode?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
