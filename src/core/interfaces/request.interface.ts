import { Usuario } from "src/modules/user/entities/usuario.entity"

export interface UserRequest extends Usuario {
    
}

export interface ExtendedRequest {
    user: UserRequest
}