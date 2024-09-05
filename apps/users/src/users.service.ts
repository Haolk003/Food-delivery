import { BadRequestException, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ActivationDto, LoginDto, RegisterDto } from './dto/user.dto'
import { PrismaService } from '../../../prisma/prima.service'
import { Response } from 'express'
import * as bcrypt from 'bcrypt'
import { ConfigService } from '@nestjs/config'
import { EmailService } from './email/email.service'

import { TokenSender } from './utils/sendToken'

interface UserData {
    name: string
    email: string
    password: string
    phone_number: number
}

@Injectable()
export class UsersService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
        private readonly emailService: EmailService,
    ) {}
    getHello(): string {
        return 'Hello World!'
    }

    async register(registerDto: RegisterDto, res: Response) {
        const { name, email, password, phone_number } = registerDto

        const isEmailExist = await this.prisma.user.findFirst({
            where: {
                email,
            },
        })
        if (isEmailExist) {
            throw new BadRequestException('User already exist with this email')
        }
        const phoneNumberToCheck = [phone_number]

        const userWithPhoneNumber = await this.prisma.user.findMany({
            where: {
                phone_number: {
                    not: null,
                    in: phoneNumberToCheck,
                },
            },
        })

        if (userWithPhoneNumber.length > 0) {
            throw new BadRequestException(
                'User already exist with this number!',
            )
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = { name, email, password: hashedPassword, phone_number }

        const { activationCode, token: activation_token } =
            await this.createActiveToken(user)

        await this.emailService.sendEmail({
            email,
            subject: 'Activate your account!',
            template: './activation-email.ejs',
            name,
            activationCode,
        })

        return { activation_token, res }
    }
    async createActiveToken(user: UserData) {
        const activationCode = Math.floor(
            1000 + Math.floor(Math.random() * 9000),
        ).toString()

        const token = await this.jwtService.sign(
            { user, activationCode },
            { secret: this.configService.get<string>('JWT_SECRET') },
        )

        return { token, activationCode }
    }

    async activateUser(activationDto: ActivationDto, response: Response) {
        const { activationCode, activationToken } = activationDto

        const newUser = (await this.jwtService.verify(activationToken, {
            secret: this.configService.get<string>('JWT_SECRET'),
        })) as { user: UserData; activationCode: string }
        console.log(newUser)
        if (newUser.activationCode !== activationCode) {
            throw new BadRequestException('Invalid activation code')
        }

        const existUser = await this.prisma.user.findUnique({
            where: { email: newUser.user.email },
        })
        if (existUser) {
            throw new BadRequestException('User already exist with this email')
        }

        const user = await this.prisma.user.create({
            data: {
                ...newUser.user,
            },
        })

        return { user, response }
    }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto

        const user = await this.prisma.user.findUnique({
            where: { email },
        })

        if (user && (await bcrypt.compare(password, user.password))) {
            const tokenSender = new TokenSender(
                this.configService,
                this.jwtService,
            )
            return tokenSender.sendToken(user)
        } else {
            return {
                user: null,
                access_token: null,
                refresh_token: null,
                error: {
                    message: 'Invalid email or password',
                },
            }
        }
        return { email, password }
    }

    async getUsers() {
        return this.prisma.user.findMany({})
    }
}
