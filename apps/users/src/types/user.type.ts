import { ObjectType, Field } from '@nestjs/graphql'
import { User } from '../entities/user.entity'

@ObjectType()
export class ErrorType {
    @Field()
    message: string

    @Field({ nullable: true })
    code?: string
}

@ObjectType()
export class RegisterResponse {
    @Field()
    activation_token: string

    @Field(() => ErrorType, { nullable: true })
    error?: ErrorType
}

@ObjectType()
export class ActivationResponse {
    @Field(() => User, { nullable: true })
    user?: User | null

    @Field(() => ErrorType, { nullable: true })
    error?: ErrorType
}

@ObjectType()
export class LoginResponse {
    @Field(() => User, { nullable: true })
    user?: User | null

    @Field({ nullable: true })
    access_token?: string | null

    @Field({ nullable: true })
    refresh_token?: string | null

    @Field(() => ErrorType, { nullable: true })
    error?: ErrorType
}
