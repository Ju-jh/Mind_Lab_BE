import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { User } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserInput } from './user.input';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  private handleQueryError(
    methodName: string,
    id: number,
    error: Error,
  ): never {
    this.logger.error(`Error in ${methodName}: ${error.message}`);
    throw new Error(
      `Failed to fetch ${methodName.toLowerCase()} with id ${id}`,
    );
  }

  async findByEmailOrSave(data: UserInput): Promise<User> {
    const isUser = await this.getUser(data.email);
    if (!isUser) {
      const user = this.userRepository.create(data as Partial<User>);
      return await this.userRepository.save(user);
    } else {
      console.log(isUser, '여기가 olduser');
      return isUser;
    }
  }

  async getUser(email: string): Promise<User> {
    try {
      const user = await this.userRepository.findOne({ where: { email } });

      if (!user) {
        throw new NotFoundException(`User with email ${email} not found`);
      }

      return user;
    } catch (error) {
      console.error('Error in getUser:', error);
      throw new NotFoundException(`User with email ${email} not found`);
    }
  }
}
