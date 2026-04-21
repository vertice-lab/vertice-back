import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger } from '@nestjs/common';



@WebSocketGateway({ cors: { origin: '*' } })
export class KycGateway {
    @WebSocketServer()
    server: Server;
    private readonly logger = new Logger(KycGateway.name);
    /**
     * Notifica al usuario conectado por Socket que su estado KYC cambió.
     * El móvil escucha el evento 'kyc-status-updated'.
     */
    notifyKycStatusUpdated(userId: string, kycStatus: string) {
        this.logger.log(`📡 Emitiendo kyc-status-updated a userId: ${userId} -> ${kycStatus}`);
        this.server.to(userId).emit('kyc-status-updated', { kycStatus });
    }
}