import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { GqlExecutionContext } from '@nestjs/graphql'
import { JwtService } from '@nestjs/jwt'
import { Request } from 'express'
import { PrismaService } from '../../../../prisma/prisma.service'

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
        private readonly config: ConfigService,
    ) {}
    async canActivate(context: ExecutionContext) {
        const gqlContext = GqlExecutionContext.create(context)
        const { req } = gqlContext.getContext()

        const accessToken = req.headers.accesstoken as string
        const refreshToken = req.headers.refreshtoken as string

        if (!accessToken || !refreshToken) {
            throw new UnauthorizedException(
                'Please login to access this resource',
            )
        }
        try {
            this.jwtService.verify(accessToken, {
                secret: this.config.get<string>('ACCESS_TOKEN_KEY'),
            })

            return true
        } catch (error) {
            if ((error.name = 'TokenExpiredError')) {
                console.log('b')
                await this.updateAccessToken(req)
                return true
            }

            throw new UnauthorizedException('Invalid or expried access token')
        }
    }

    private async updateAccessToken(req: Request): Promise<void> {
        try {
            const refreshtoken = req.headers.refreshtoken as string

            const decodedRefreshToken = this.jwtService.verify(refreshtoken, {
                secret: this.config.get<string>('REFRESH_TOKEN_KEY'),
            })

            if (decodedRefreshToken.exp * 1000 < Date.now()) {
                throw new UnauthorizedException(
                    'Refresh token expired, please login agains',
                )
            }

            const user = await this.prisma.user.findUnique({
                where: { id: decodedRefreshToken.id },
            })

            if (!user) {
                throw new UnauthorizedException('User not found')
            }

            const accessToken = this.jwtService.sign(
                { id: user.id },
                {
                    secret: this.config.get<string>('ACCESS_TOKEN_KEY'),
                    expiresIn: '5m',
                },
            )

            let newRefreshToken = refreshtoken
            if (
                decodedRefreshToken.exp * 1000 <
                Date.now() + 24 * 60 * 60 * 1000
            ) {
                newRefreshToken = this.jwtService.sign(
                    { id: user.id },
                    {
                        secret: this.config.get<string>('REFRESH_TOKEN_KEY'),
                        expiresIn: '2d',
                    },
                )
            }

            req.accesstoken = accessToken
            req.refreshtoken = newRefreshToken
            req.user = user
        } catch (err) {
            throw new UnauthorizedException(err.message)
        }
    }
}
