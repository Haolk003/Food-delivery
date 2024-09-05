import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { User } from '../entities/user.entity'

export class TokenSender {
    constructor(
        private readonly config: ConfigService,
        private readonly jwt: JwtService,
    ) {}

    public sendToken(user: User) {
        const access_token = this.jwt.sign(
            { id: user.id },
            {
                secret: this.config.get<string>('ACCESS_TOKEN_KEY'),
            },
        )

        const refresh_token = this.jwt.sign(
            { id: user.id },
            { secret: this.config.get<string>('REFRESH_TOKEN_KEY') },
        )

        return { user, access_token, refresh_token }
    }
}
