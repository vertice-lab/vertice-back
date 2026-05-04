import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import {
  RegisterAuthDto,
  TempRegisterAuthDto,
  LoginAuthDto,
  TokenAuthDto,
  UserEmailAuthDto,
  GoogleCallbackDto,
  UpdatePasswordDto,
} from '../dto/auth.dto';
import { EmailServiceService } from './email-service/email-service.service';
import { PrismaClientService } from 'src/prisma-client/prisma-client.service';
import { generateRandomCode, generateOTP } from 'src/common/utils/random-code';
import { Roles } from '../interfaces/enums/roles';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/services/user/user.service';
import { EncryptService } from './encrypt/encrypt.service';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);
  constructor(
    private emailService: EmailServiceService,
    private prisma: PrismaClientService,
    private jwtService: JwtService,
    private readonly userService: UserService,
    private encryptService: EncryptService,
  ) { }

  async tempRegister(tempRegister: TempRegisterAuthDto) {
    const newToken = generateRandomCode();

    try {
      const [emailExit, userExist] = await Promise.all([
        this.prisma.userTemp.findUnique({
          where: { email: tempRegister.email },
        }),
        this.prisma.user.findUnique({
          where: { email: tempRegister.email },
        }),
      ]);

      if (emailExit) {
        throw new BadRequestException(
          'Lo siento, usuario existente, Revisa tu bandeja de email',
        );
      }

      if (userExist) {
        throw new BadRequestException('Lo siento, Usuario registrado');
      }

      if (tempRegister.email.length <= 2) {
        throw new Error('Email inválido');
      }

      await Promise.all([
        this.prisma.userTemp.create({
          data: {
            email: tempRegister.email,
            token: newToken,
            createdAt: new Date(Date.now() + 1000 * 60 * 60 * 24), //EXPIRA EN 24H
          },
        }),
        this.emailService.sendTempEmail(tempRegister, newToken),
      ]);

      return { ok: true, message: 'Email enviado exitosamente' };
    } catch (error: any) {
      throw new InternalServerErrorException(`Error: ${error.message}`);
    }
  }

  async tempRegisterMobile(tempRegister: TempRegisterAuthDto) {
    const newOtp = generateOTP();

    try {
      const [emailExit, userExist] = await Promise.all([
        this.prisma.userTemp.findUnique({
          where: { email: tempRegister.email },
        }),
        this.prisma.user.findUnique({
          where: { email: tempRegister.email },
        }),
      ]);

      if (userExist) {
        throw new BadRequestException('El usuario ya está registrado.');
      }

      if (tempRegister.email.length <= 2) {
        throw new Error('Email inválido');
      }

      if (emailExit) {
        await this.prisma.userTemp.update({
          where: { email: tempRegister.email },
          data: {
            token: newOtp,
            createdAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
          },
        });
      } else {
        await this.prisma.userTemp.create({
          data: {
            email: tempRegister.email,
            token: newOtp,
            createdAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
          },
        });
      }

      await this.emailService.sendOtpEmail(tempRegister.email, newOtp);

      return { ok: true, message: 'Código de verificación enviado' };
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error: ${error.message}`);
    }
  }

  async register(registerAuthDto: RegisterAuthDto) {
    const {
      name,
      lastName,
      email,
      password,
      dateBirth,
      phone,
      countryCode,
      acceptedTerms,
      receiveMarketingEmails,
    } = registerAuthDto;

    try {
      const userTemp = await this.prisma.userTemp.findUnique({
        where: { email },
      });

      if (userTemp?.email !== email) {
        throw new BadRequestException('Este email no ha sido verificado');
      }

      await this.prisma.userTemp.delete({
        where: {
          email: userTemp.email,
        },
      });

      const [role, country] = await Promise.all([
        this.prisma.role.findUnique({
          where: { name: Roles.client },
        }),
        this.prisma.country.findUnique({
          where: { country_code: countryCode },
        }),
      ]);

      if (!role) {
        throw new NotFoundException('Rol Not Found');
      }

      if (!country) {
        throw new NotFoundException('Country Not Found ');
      }

      const hashedPassword = await argon2.hash(password);

      const user = await this.prisma.user.create({
        data: {
          name: name,
          lastName: lastName,
          email: email,
          password: hashedPassword,
          verified: true,
          active: true,
          role: {
            connect: {
              id: role.id,
            },
          },
          country: {
            connect: {
              country_code: country.country_code,
            },
          },
          information: {
            create: {
              phone,
              dateBirth,
              acceptedTerms,
            },
          },
          notifications: {
            create: {
              maketingEmail: receiveMarketingEmails || false,
            },
          }
        },
        select: {
          id: true,
          name: true,
          lastName: true,
          email: true,
          token: true,
          active: true,
          image: true,
          createdAt: true,
          updatedAt: true,
        }
      });

      return {
        ok: true,
        user,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException();
    }
  }

  async syncGoogleUser(googleData: GoogleCallbackDto) {
    try {

      const existingUser = await this.prisma.user.findUnique({
        where: { email: googleData.email },
        include: { providers: true },
      });

      if (existingUser) {
        const hasGoogleProvider = existingUser.providers.some(p => p.provider === 'google');
        if (!hasGoogleProvider) {
          throw new BadRequestException('El usuario ya está registrado con correo y contraseña');
        }
      }

      const user = await this.prisma.$transaction(async (prisma) => {
        const existingUser = await prisma.user.findUnique({
          where: { email: googleData.email },
          include: {
            role: true,
            country: true,
            providers: true,
          },
        });

        if (existingUser) {
          return existingUser;
        }

        const [role, defaultCountry] = await Promise.all([
          prisma.role.findUnique({ where: { name: Roles.client } }),
          prisma.country.findFirst({ where: { country_code: 'US' } }),
        ]);

        if (!role) {
          throw new NotFoundException('Default role not found');
        }

        const newUser = await prisma.user.create({
          data: {
            name: googleData.name?.split(' ')[0] || '',
            lastName: googleData.name?.split(' ')[1] || '',
            email: googleData.email,
            password: await argon2.hash(this.generateRandomPassword()),
            verified: true,
            active: true,
            image: googleData.image,
            role: { connect: { id: role.id } },
            country: defaultCountry
              ? { connect: { country_code: defaultCountry.country_code } }
              : undefined,
            providers: {
              create: {
                provider: 'google',
                providerId: googleData.googleId,
              },
            },
          },
          include: {
            role: true,
            country: true,
            providers: true,
          },
        });

        return newUser;
      });

      const hasGoogleProvider = user.providers.some(
        (provider) => provider.provider === 'google',
      );

      if (!hasGoogleProvider) {
        await this.prisma.provider.create({
          data: {
            provider: 'google',
            providerId: googleData.googleId,
            userId: user.id,
          },
        });
      }
      const userIdString = String(user.id);

      const encryptedUserId = await this.encryptService.encrypt(userIdString);

      const payload = { sub: encryptedUserId };

      const access_token = await this.jwtService.signAsync(payload, {
        expiresIn: '3d',
      });

      return {
        ok: true,
        access_token,
        user: {
          id: user.id,
          name: user.name,
          lastName: user.lastName,
          email: user.email,
          countryCode: user.countryCode,
          active: user.active,
          online: user.online,
          image: user.image,
        },
      };
    } catch (error) {
      console.error('Google sync error:', error);
      throw new InternalServerErrorException(
        'Error processing Google authentication',
      );
    }
  }

  async login(loginAuthDto: LoginAuthDto) {
    const { email, password } = loginAuthDto;

    try {
      const user = await this.prisma.user.findUnique({
        where: { email: email },
        select: {
          id: true,
          email: true,
          password: true,
          active: true,
        },
      });

      if (!user) {
        throw new NotFoundException('Usuario o contraseña incorrectos');
      }

      if (!user.active) {
        throw new ForbiddenException('ACCOUNT_BLOCKED');
      }

      const credentials = await argon2.verify(user.password, password);

      if (!credentials) {
        throw new UnauthorizedException('Email o Contraseña son incorrectos');
      }

      const userIdString = String(user.id);

      const encryptedUserId = await this.encryptService.encrypt(userIdString);

      const payload = { sub: encryptedUserId };

      return {
        ok: true,
        access_token: await this.jwtService.signAsync(payload, {
          expiresIn: '3d',
        }),
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('Error interno del servidor');
    }
  }

  async sendEmailchangePassword(userEmailAuthDto: UserEmailAuthDto) {
    const newToken = generateRandomCode();
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: userEmailAuthDto.email },
        select: {
          email: true,
        },
      });

      if (!user) {
        throw new NotFoundException('Email no encontrado');
      }

      await this.prisma.user.update({
        where: { email: user.email },
        select: {
          token: true,
        },
        data: {
          token: newToken,
        },
      });

      await this.emailService.sendEmailChangePassword(user.email, newToken);

      return { ok: true, message: 'Revise su bandeja de entrada' };
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Error to send email: ${error.message}`,
      );
    }
  }

  async updateChangePassword(updatePasswordDto: UpdatePasswordDto) {
    const { newPassword, token } = updatePasswordDto;

    try {
      const user = await this.prisma.user.findUnique({
        where: { token },
        select: {
          token: true,
          password: true,
        },
      });

      if (!user) {
        throw new NotFoundException('Token no encontrado');
      }

      const updatedPassword = await argon2.hash(newPassword);

      await this.prisma.user.update({
        where: { token },
        data: {
          token: null,
          password: updatedPassword,
        },
      });

      return {
        ok: true,
        msg: 'Contraseña actualizada',
      };
    } catch (error: any) {
      console.log(error.message);
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException();
    }
  }

  async getProfileClient(@Request() req) {
    try {
      const { sub, iat, exp } = req.user as {
        sub: string;
        iat: number;
        exp: number;
      };
      const user = await this.userService.getUserById(sub, iat, exp);

      return {
        ok: true,
        user: {
          name: user.user.name,
          lastName: user.user.lastName,
          email: user.user.email,
          countryCode: user.user.countryCode,
          image: user.user.image,
          role: user.user.role,
          online: user.user.online,
          information: user.user.information,
          providers: user.user.providers.map((p) => p.provider),
          kycStatus: user.user.kycStatus,
          kycSessionId: user.user.kycSessionId,
        },
        iat: user.iat,
        exp: user.exp,
      };
    } catch (error) { }
  }

  async getProfileAssessor(@Request() req) {
    try {
      const { sub, iat, exp } = req.user as {
        sub: string;
        iat: number;
        exp: number;
      };

      const userAssessor = await this.userService.getUserById(sub, iat, exp);

      if (userAssessor.user.role.name !== Roles.assessor) {
        throw new UnauthorizedException(
          'Unauthorized Access - You need authorization',
        );
      }
      return {
        ok: true,
        user: {
          name: userAssessor.user.name,
          lastName: userAssessor.user.lastName,
          email: userAssessor.user.email,
          active: userAssessor.user.active,
          online: userAssessor.user.online,
          image: userAssessor.user.image,
          role: userAssessor.user.role,
          iat: userAssessor.iat,
          exp: userAssessor.exp,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al obtener el asessor');
    }
  }

  async getProfileAdmin(@Request() req) {
    try {
      const { sub, iat, exp } = req.user as {
        sub: string;
        iat: number;
        exp: number;
      };
      const userAdmin = await this.userService.getUserById(sub, iat, exp);

      if (userAdmin.user.role.name !== Roles.admin) {
        throw new UnauthorizedException(
          'Unauthorized Access - You need authorization',
        );
      }
      return {
        ok: true,
        user: {
          name: userAdmin.user.name,
          lastName: userAdmin.user.lastName,
          email: userAdmin.user.email,
          active: userAdmin.user.active,
          online: userAdmin.user.online,
          image: userAdmin.user.image,
          role: userAdmin.user.role,
          iat: userAdmin.iat,
          exp: userAdmin.exp,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al obtener admin');
    }
  }

  async getProfileManager(@Request() req) {
    try {
      const { sub, iat, exp } = req.user as {
        sub: string;
        iat: number;
        exp: number;
      };

      const userManager = await this.userService.getUserById(sub, iat, exp);

      if (userManager.user.role.name !== Roles.manager) {
        throw new UnauthorizedException(
          'Unauthorized Access - You need authorization',
        );
      }
      return {
        ok: true,
        user: {
          name: userManager.user.name,
          lastName: userManager.user.lastName,
          email: userManager.user.email,
          active: userManager.user.active,
          online: userManager.user.online,
          image: userManager.user.image,
          role: userManager.user.role,
          iat: userManager.iat,
          exp: userManager.exp,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al obtener manager');
    }
  }

  private generateRandomPassword(): string {
    return Math.random().toString(36).slice(-16);
  }

  async isValidTokenTempUser(params: TokenAuthDto) {
    try {
      const existToken = await this.prisma.userTemp.findUnique({
        where: { token: params.token },
        select: {
          email: true,
          token: true,
        },
      });

      if (!existToken?.token) {
        throw new NotFoundException('Token is not exist');
      }

      await this.prisma.userTemp.update({
        where: {
          email: existToken.email,
        },
        data: {
          token: null,
        },
      });

      return {
        ok: true,
        email: existToken.email,
      };
    } catch (error) {
      console.log(error);
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new InternalServerErrorException();
    }
  }

  async isValidTokenAuthUser(params: TokenAuthDto) {
    try {
      const existToken = await this.prisma.user.findUnique({
        where: { token: params.token },
        select: {
          email: true,
          token: true,
        },
      });

      if (!existToken?.token) {
        throw new NotFoundException('Token is not exist');
      }

      return {
        ok: true,
      };
    } catch (error) {
      console.log(error);
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new InternalServerErrorException();
    }
  }

  async verifyOtpMobile(email: string, token: string) {
    try {
      const existToken = await this.prisma.userTemp.findUnique({
        where: { email },
        select: {
          email: true,
          token: true,
        },
      });

      if (!existToken?.token || existToken.token !== token) {
        throw new BadRequestException(
          'El código introducido es incorrecto o ha expirado.',
        );
      }

      await this.prisma.userTemp.update({
        where: {
          email: existToken.email,
        },
        data: {
          token: null,
        },
      });

      return {
        ok: true,
        email: existToken.email,
        message: 'Código verificado correctamente',
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error al verificar código');
    }
  }

  async sendForgotPasswordOtpMobile(userEmailAuthDto: UserEmailAuthDto) {
    const newOtp = generateOTP();
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: userEmailAuthDto.email },
        select: { email: true },
      });

      if (!user) {
        throw new NotFoundException('Email no encontrado');
      }

      await this.prisma.user.update({
        where: { email: user.email },
        data: { token: newOtp },
      });

      await this.emailService.sendOtpForgotPasswordEmail(user.email, newOtp);

      return { ok: true, message: 'Código enviado a tu correo' };
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Error al enviar código: ${error.message}`,
      );
    }
  }

  async verifyForgotPasswordOtp(email: string, token: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: { email: true, token: true },
      });

      if (!user?.token || user.token !== token) {
        throw new BadRequestException(
          'El código introducido es incorrecto o ha expirado.',
        );
      }

      return {
        ok: true,
        email: user.email,
        message: 'Código verificado correctamente',
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error al verificar código');
    }
  }

  async updatePasswordByEmail(email: string, newPassword: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: { email: true, token: true },
      });

      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      const hashedPassword = await argon2.hash(newPassword);

      await this.prisma.user.update({
        where: { email },
        data: {
          token: null,
          password: hashedPassword,
        },
      });

      return { ok: true, message: 'Contraseña actualizada correctamente' };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error al actualizar contraseña');
    }
  }
}
