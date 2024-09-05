import { MailerService } from '@nestjs-modules/mailer'
import { Injectable } from '@nestjs/common'

type mailOptions = {
    subject: string
    email: string
    name: string
    activationCode: string
    template: string
}

@Injectable()
export class EmailService {
    constructor(private mailService: MailerService) {}

    async sendEmail({
        subject,
        activationCode,
        email,
        name,
        template,
    }: mailOptions) {
        console.log({ name, activationCode })

        await this.mailService.sendMail({
            to: email,
            subject,
            template,
            context: { name, activationCode },
        })
    }
}
