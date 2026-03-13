/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { User } from 'generated/prisma/browser';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtservice: JwtService,
  ) {}

  async register(data: RegisterDto): Promise<Omit<User, 'password'>> {
    const { password, ...userData } = data;
    const hashedPassword = await bcrypt.hash(password, 10);

    Logger.log(`Registering user with email: ${data.email}`);

    try {
      const user = await this.prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword,
        },
      });
      Logger.log(`User registered successfully with email: ${data.email}`);
      return user;
    } catch (error) {
      Logger.error(`Error occurred while registering user: ${error}`);
      throw new Error('Failed to register user');
    }
  }

  async login(data: LoginDto): Promise<{ access_token: string }> {
    const user = await validateUser.call(this, data.email, data.password);
    return signIn.call(this, user);
  }
}

async function validateUser(email: string, password: string): Promise<User> {
  const user = await this.prisma.user.findUnique({ where: { email } });
  if (!user) {
    Logger.warn(`Authentication failed for email: ${email} - user not found`);
    throw new UnauthorizedException('Invalid credentials');
  }
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    Logger.warn(`Authentication failed for email: ${email} - invalid password`);
    throw new UnauthorizedException('Invalid credentials');
  }
  return user;
}

async function signIn(
  user: User,
): Promise<{ access_token: string; userName: string; userEmail: string }> {
  const payload = { sub: user.id, role: user.role };
  Logger.log(`Signing in user with email: ${user.email}`);
  const token = await this.jwtservice.signAsync(payload, { expiresIn: '4h' });
  return {
    access_token: token,
    userName: user.name,
    userEmail: user.email,
  };
}
