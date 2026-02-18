import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto';
import { JwtSignOptions } from '@nestjs/jwt';

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  tokens: Tokens;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.usersService.findByEmail(registerDto.email);

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      tokens,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(loginDto.password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      tokens,
    };
  }

  async refreshTokens(userId: string): Promise<Tokens> {
    const user = await this.usersService.findById(userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Access denied');
    }

    return this.generateTokens(user.id, user.email);
  }

  private async generateTokens(userId: string, email: string): Promise<Tokens> {
    const payload = { sub: userId, email };

    const accessOptions: JwtSignOptions = {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get('jwt.expiresIn'),
    };

    const refreshOptions: JwtSignOptions = {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get('jwt.refreshExpiresIn'),
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, accessOptions),
      this.jwtService.signAsync(payload, refreshOptions),
    ]);

    return { accessToken, refreshToken };
  }
}
