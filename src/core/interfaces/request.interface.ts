import { Usuario } from "src/modules/user/entities/usuario.entity"

export interface UserRequest {
    id: number;
    nombre: string;
    correo: string;
    rol: string;
    qrCode?: string; // Optional, in case the user has a QR code
}

export interface ExtendedRequest {
    user: UserRequest
}