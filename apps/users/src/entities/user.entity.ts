import { ObjectType, Field, Directive } from '@nestjs/graphql'

@ObjectType()
@Directive('@key(fields:"id")')
export class Avatar {
    @Field()
    id: string

    @Field()
    public_id: string

    @Field()
    url: string

    @Field()
    userId: string
}

@ObjectType()
export class User {
    @Field()
    id: string

    @Field()
    email: string

    @Field()
    name: string

    @Field()
    password: string

    @Field(() => Avatar, { nullable: true })
    avatar?: Avatar | null

    @Field()
    role: string

    @Field({ nullable: true })
    address: string

    @Field({ nullable: true })
    phone_number: number

    @Field()
    createdAt: Date

    @Field()
    updatedAt: Date
}
