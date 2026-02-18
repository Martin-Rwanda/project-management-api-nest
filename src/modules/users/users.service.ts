import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from './dto';
import { User } from './entities/user.entity';
import { UserRepository } from './repositories/user.repository';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(createUserDto.email);

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    return this.userRepository.create(createUserDto);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    await this.findById(id);

    const updated = await this.userRepository.update(id, updateUserDto);

    if (!updated) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.userRepository.delete(id);
  }
}
