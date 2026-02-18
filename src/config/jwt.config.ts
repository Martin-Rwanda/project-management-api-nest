import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  expiresIn: parseInt(process.env.JWT_EXPIRES_IN ?? '900', 10), // 15 minutes
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  refreshExpiresIn: parseInt(process.env.JWT_REFRESH_EXPIRES_IN ?? '604800', 10), // 7 days
}));
