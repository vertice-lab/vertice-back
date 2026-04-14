import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientService } from 'src/prisma-client/prisma-client.service';
import {
  CreateBankAccountDto,
  UpdateBankAccountDto,
  BankAccountResponseDto,
} from './dto';
import { EncryptService } from 'src/auth/services/encrypt/encrypt.service';

@Injectable()
export class BankAccountService {
  constructor(
    private prisma: PrismaClientService,
    private encryptService: EncryptService,
  ) {}

  async createBankAccount(
    userId: string,
    createBankAccountDto: CreateBankAccountDto,
  ): Promise<{ ok: true; msg: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const accountLenght = await this.prisma.bankAccount.findMany({
      where: {
        userId: userId,
      },
    });

    if (accountLenght.length >= 10) {
      throw new BadRequestException(
        `Lo siento, ha superado el limite de cuentas propias permitidas`,
      );
    }

    const validateData = await this.validateBankAccount(
      userId,
      createBankAccountDto.financialInstitutionName,
      createBankAccountDto.accountNumberOrCode,
    );

    const currencyCode = createBankAccountDto.currencyCode
      ? createBankAccountDto.currencyCode.toUpperCase()
      : null;

    const fieldsToEncrypt: Record<string, string | null> = {
      accountHolderName: createBankAccountDto.accountHolderName || null,
      accountHolderId: createBankAccountDto.accountHolderId || null,
      accountNumberOrCode: validateData.accountNumber || null,
      aliasOrReference: createBankAccountDto.aliasOrReference || null,
      phoneNumber: createBankAccountDto.phoneNumber || null,
      emailAddress: createBankAccountDto.emailAddress || null,
      bankAccountType: createBankAccountDto.bankAccountType || null,
      addressOrDetails: createBankAccountDto.addressOrDetails || null,
      additionalNotes: createBankAccountDto.additionalNotes || null,
    };

    const encryptionPromises: Record<string, Promise<string | null>> = {};
    for (const [key, value] of Object.entries(fieldsToEncrypt)) {
      if (value) {
        encryptionPromises[key] = this.encryptService.encrypt(value);
      } else {
        encryptionPromises[key] = Promise.resolve(null);
      }
    }
    const encryptedData =
      await this.performConcurrentEncryption(encryptionPromises);

    await this.prisma.bankAccount.create({
      data: {
        ...encryptedData,
        userId: userId,
        financialInstitutionName: validateData.financialInstitution || null,
        currencyCode: currencyCode,
        country: createBankAccountDto.country,
        type: createBankAccountDto.type,
        isActive: createBankAccountDto.isActive,
      },
    });

    return {
      ok: true,
      msg: 'Cuenta agregada exitosamente',
    };
  }

  async getUserBankAccounts(
    userId: string,
  ): Promise<{ ok: true; data: BankAccountResponseDto[] }> {
    const bankAccounts = await this.prisma.bankAccount.findMany({
      where: { userId },
      select: {
        id: true,
        financialInstitutionName: true,
        country: true,
        type: true,
        accountHolderName: true,
        accountHolderId: true,
        accountNumberOrCode: true,
        aliasOrReference: true,
        phoneNumber: true,
        emailAddress: true,
        bankAccountType: true,
        addressOrDetails: true,
        additionalNotes: true,
        currencyCode: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const decryptionPromises = bankAccounts.map((account) =>
      this.performConcurrentDecryption(account),
    );

    const decryptedBankAccounts = await Promise.all(decryptionPromises);

    return {
      ok: true,
      data: decryptedBankAccounts,
    };
  }

  async getBankAccountById(
    userId: string,
    bankAccountId: string,
  ): Promise<{ ok: true; data: BankAccountResponseDto }> {
    const bankAccount = await this.prisma.bankAccount.findFirst({
      where: {
        id: bankAccountId,
        userId,
      },
    });

    if (!bankAccount) {
      throw new NotFoundException('Cuenta bancaria no encontrada');
    }

    const decryptedAccount =
      await this.performConcurrentDecryption(bankAccount);

    return {
      ok: true,
      data: decryptedAccount,
    };
  }

  async updateBankAccount(
    userId: string,
    bankAccountId: string,
    updateBankAccountDto: UpdateBankAccountDto,
  ): Promise<{ ok: true; msg: string }> {
    const existingAccount = await this.prisma.bankAccount.findUnique({
      where: {
        id: bankAccountId,
        userId,
      },
    });

    if (!existingAccount) {
      throw new NotFoundException('Cuenta bancaria no encontrada');
    }

    const dataToUpdate: Record<string, any> = {};
    const encryptionPromises: Record<string, Promise<string | null>> = {};

    const encryptedFields = [
      'accountHolderName',
      'accountHolderId',
      'accountNumberOrCode',
      'aliasOrReference',
      'phoneNumber',
      'emailAddress',
      'bankAccountType',
      'addressOrDetails',
      'additionalNotes',
    ];

    for (const key of Object.keys(updateBankAccountDto)) {
      const value = updateBankAccountDto[key];

      if (key === 'currencyCode' && value) {
        dataToUpdate[key] = value.toUpperCase();
      } else if (
        key === 'financialInstitutionName' &&
        typeof value === 'string' &&
        value.length > 0
      ) {
        dataToUpdate[key] = value.toLowerCase().trim();
      } else if (
        encryptedFields.includes(key) &&
        typeof value === 'string' &&
        value.length > 0
      ) {
        encryptionPromises[key] = this.encryptService.encrypt(value);
      } else if (!encryptedFields.includes(key)) {
        dataToUpdate[key] = value;
      }
    }

    const encryptedUpdates =
      await this.performConcurrentEncryption(encryptionPromises);

    const finalUpdateData = { ...dataToUpdate, ...encryptedUpdates };

    const updatedBankAccount = await this.prisma.bankAccount.update({
      where: { id: bankAccountId },
      data: finalUpdateData,
    });

    await this.performConcurrentDecryption(updatedBankAccount);

    return {
      ok: true,
      msg: 'Cuenta bancaria actualizada exitosamente',
    };
  }

  async deleteBankAccount(
    userId: string,
    bankAccountId: string,
  ): Promise<{ ok: true; msg: string }> {
    const existingAccount = await this.prisma.bankAccount.findFirst({
      where: {
        id: bankAccountId,
        userId,
      },
    });

    if (!existingAccount) {
      throw new NotFoundException('Cuenta bancaria no encontrada');
    }

    await this.prisma.bankAccount.delete({
      where: { id: bankAccountId },
    });

    return {
      ok: true,
      msg: 'Cuenta bancaria eliminada exitosamente',
    };
  }

  async toggleBankAccountStatus(
    userId: string,
    bankAccountId: string,
  ): Promise<{ ok: true; data: BankAccountResponseDto; msg: string }> {
    const existingAccount = await this.prisma.bankAccount.findFirst({
      where: {
        id: bankAccountId,
        userId,
      },
    });

    if (!existingAccount) {
      throw new NotFoundException('Cuenta bancaria no encontrada');
    }

    const updatedAccount = await this.prisma.bankAccount.update({
      where: { id: bankAccountId },
      data: { isActive: !existingAccount.isActive },
    });

    return {
      ok: true,
      data: updatedAccount,
      msg: `Cuenta bancaria ${updatedAccount.isActive ? 'activada' : 'desactivada'} exitosamente`,
    };
  }

  async findBankAccountsByCurrency(
    userId: string,
    currencyCode: string,
  ): Promise<{ ok: true; data: BankAccountResponseDto[] }> {
    const normalizedCurrency = currencyCode.toUpperCase();

    const bankAccounts = await this.prisma.bankAccount.findMany({
      where: {
        userId,
        currencyCode: normalizedCurrency,

        isActive: true,
      },
      select: {
        id: true,
        financialInstitutionName: true,
        country: true,
        type: true,
        accountHolderName: true,
        accountHolderId: true,
        accountNumberOrCode: true,
        aliasOrReference: true,
        phoneNumber: true,
        emailAddress: true,
        bankAccountType: true,
        addressOrDetails: true,
        additionalNotes: true,
        currencyCode: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const decryptionPromises = bankAccounts.map((account) =>
      this.performConcurrentDecryption(account),
    );

    const decryptedBankAccounts = await Promise.all(decryptionPromises);

    return {
      ok: true,
      data: decryptedBankAccounts,
    };
  }

  //helpers
  private async validateBankAccount(
    userId: string,
    financialInstitutionName?: string,
    accountNumberOrCode?: string,
  ): Promise<{
    financialInstitution?: string;
    accountNumber?: string;
  }> {
    const validatedData: {
      financialInstitution?: string;
      accountNumber?: string;
    } = {};

    try {
      if (financialInstitutionName && financialInstitutionName.length > 1) {
        const cleanInstitutionName = financialInstitutionName
          .toLowerCase()
          .trim();

        const isExistFinancialInstitutionName =
          await this.prisma.bankAccount.findFirst({
            where: {
              financialInstitutionName: cleanInstitutionName,
              userId: userId,
            },
            select: {
              id: true,
            },
          });

        if (isExistFinancialInstitutionName) {
          throw new BadRequestException(
            `Lo siento, ya posees una cuenta registrada para la institución: ${financialInstitutionName}.`,
          );
        }

        validatedData.financialInstitution = cleanInstitutionName;
      }

      if (accountNumberOrCode && accountNumberOrCode.length > 1) {
        const cleanAccountNumber = accountNumberOrCode.trim();

        const isExistAccountNumber = await this.prisma.bankAccount.findFirst({
          where: {
            accountNumberOrCode: cleanAccountNumber,
            userId: userId,
          },
          select: {
            id: true,
          },
        });

        if (isExistAccountNumber) {
          throw new BadRequestException(
            `Ya tienes registrada la cuenta/código: ${accountNumberOrCode}.`,
          );
        }

        validatedData.accountNumber = cleanAccountNumber;
      }

      return validatedData;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Something is wrong...');
    }
  }

  private async performConcurrentEncryption(
    promises: Record<string, Promise<string | null>>,
  ): Promise<any> {
    const keys = Object.keys(promises);
    const results = await Promise.all(Object.values(promises));

    return keys.reduce((acc, key, index) => {
      acc[key] = results[index];
      return acc;
    }, {});
  }

  private async performConcurrentDecryption(bankAccount: any): Promise<any> {
    const decryptedData: Record<string, any> = {};
    const decryptionPromises: Record<string, Promise<string | null>> = {};

    const encryptedKeys = [
      'accountHolderName',
      'accountHolderId',
      'accountNumberOrCode',
      'aliasOrReference',
      'phoneNumber',
      'emailAddress',
      'bankAccountType',
      'addressOrDetails',
      'additionalNotes',
    ];

    for (const key of encryptedKeys) {
      const value = bankAccount[key];
      if (value) {
        decryptionPromises[key] = this.encryptService.decrypt(value);
      } else {
        decryptionPromises[key] = Promise.resolve(null);
      }
    }

    const results = await this.performConcurrentEncryption(decryptionPromises);

    for (const key of Object.keys(bankAccount)) {
      if (encryptedKeys.includes(key)) {
        decryptedData[key] = results[key];
      } else {
        decryptedData[key] = bankAccount[key];
      }
    }

    return decryptedData as BankAccountResponseDto;
  }
}
