import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger } from '@nestjs/common';



@WebSocketGateway({ cors: { origin: '*' } })
export class KycGateway {
    @WebSocketServer()
    server: Server;
    
    notifyKycStatusUpdated(userId: string, kycStatus: string, kycAttempts?: number, maxAttempts?: number) {
  
        this.server.to(userId).emit('kyc-status-updated', { kycStatus, kycAttempts, maxAttempts });
    }
}