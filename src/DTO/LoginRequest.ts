export class LoginRequest {
    tipo_documento: string;
    numero_documento: string;
    contrasena: string;

    constructor(tipo_documento: string, numero_documento: string, contrasena: string) {
        this.tipo_documento = tipo_documento;
        this.numero_documento = numero_documento;
        this.contrasena = contrasena;
    }
}