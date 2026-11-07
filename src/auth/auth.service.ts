import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { CreateUserDTO } from 'src/dtos/create-users-dto';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {

    constructor(private jwt: JwtService,
        private userService: UsersService) { }

    // Confere e-mail e senha e devolve o token JWT com os dados do usuário (401 se estiver errado).
    async login(email: string, password: string) {

        const user = await this.validate(email, password);

        if (!user) throw new UnauthorizedException('Credenciais inválidas');
        
        const payload = { sub: user.id, email: user.email, name: user.name, role: user.role };
        return {
            access_token: await this.jwt.signAsync(payload),
            user: payload,
        };
    }
    // Procura o usuário pelo e-mail e compara a senha com o hash; devolve o usuário sem a senha, ou null.
    async validate(email: string, password: string) {
        const user = await this.userService.findByEmail(email);

        if (!user) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        const { passwordHash, ...safe } = user;
        return safe;
    }

    // Cria o usuário e já devolve o token JWT, como no login.
    async register(dto: CreateUserDTO) {
        const user = await this.userService.createUser(dto);
        const payload = { sub: user.id, email: user.email, name: user.name, role: user.role };
        return {
            access_token: await this.jwt.signAsync(payload),
            user: payload,
        };
    }
}