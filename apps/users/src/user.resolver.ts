import { Args, Mutation, Resolver, Query, Context } from '@nestjs/graphql'
import { UsersService } from './users.service'
import { ActivationDto, LoginDto, RegisterDto } from './dto/user.dto'
import {
    RegisterResponse,
    ActivationResponse,
    LoginResponse,
} from './types/user.type'
import { BadRequestException } from '@nestjs/common'
import { User } from './entities/user.entity'
import { Response } from 'express'

@Resolver('User')
export class UserResolver {
    constructor(private readonly userService: UsersService) {}

    @Mutation(() => RegisterResponse)
    async register(
        @Args('registerInput') registerDto: RegisterDto,
        @Context() context: { res: Response },
    ) {
        if (!registerDto.name || !registerDto.email || !registerDto.password) {
            throw new BadRequestException('Please fill the all fields')
        }

        const { activation_token } = await this.userService.register(
            registerDto,
            context.res,
        )

        return { activation_token }
    }

    @Mutation(() => LoginResponse)
    async login(@Args('loginInput') loginDto: LoginDto) {
        const res = await this.userService.login(loginDto)
        console.log(res)
        return res
    }

    @Mutation(() => ActivationResponse)
    async activeUser(
        @Args('activationInput') activationDto: ActivationDto,
        @Context() context: { res: Response },
    ) {
        const { user } = await this.userService.activateUser(
            activationDto,
            context.res,
        )
        return { user }
    }

    @Query(() => [User])
    async getUsers() {
        return this.userService.getUsers()
    }
}
