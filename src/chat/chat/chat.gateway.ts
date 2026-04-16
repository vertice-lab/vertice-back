import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { ChatService } from '../chat.service';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EncryptService } from 'src/auth/services/encrypt/encrypt.service';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/services/user/user.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('ChatGateway');

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly encryptService: EncryptService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;

      if (!token) {
        this.logger.error(`Cliente ${client.id} sin token - Desconectando`);
        return client.disconnect();
      }

      const payload = await this.jwtService.verifyAsync(token);

      if (!payload.sub) {
        this.logger.error('Token válido pero sin identificador');
        return client.disconnect();
      }

      const decryptUserId = await this.encryptService.decrypt(payload.sub);

      await this.userService.isOnlineUser(decryptUserId);
      client.data.userId = decryptUserId;
      client.join(decryptUserId);
      this.logger.log(`Client Connected: ${client.data.userId}`);
    } catch (error) {
      client.disconnect();
    }
  }
  //NestJS busca específicamente el método llamado handleDisconnect
  //Al escribir implements OnGatewayDisconnect, le estás diciendo a NestJS: "Este Gateway tiene la capacidad de reaccionar a desconexiones".
  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id} aqui`);
    const token = client.handshake.auth?.token;

    const payload = await this.jwtService.verifyAsync(token);

    if (!payload.sub) {
      this.logger.error('Token válido pero sin identificador');
      return client.disconnect();
    }

    const decryptUserId = await this.encryptService.decrypt(payload.sub);
    await this.userService.isOffOnlineUser(decryptUserId);
  }

  @SubscribeMessage('check-ticket-status')
  async handleCheckStatus(
    @MessageBody() data: { ticketNumber: string },
    @ConnectedSocket() client: Socket,
  ) {
    await client.join(data.ticketNumber);

    this.logger.log(`Cliente unido a la sala del ticket: ${data.ticketNumber}`);

    const userId = client.data.userId;
    const result = await this.chatService.getTicketChatStatus(
      data.ticketNumber,
      userId
    );
    client.emit('ticket-status-response', result);

    if (result.canOpenChat) {
      const welcomeMessage = await this.chatService.sendWelcomeMessage(
        data.ticketNumber,
      );
      if (welcomeMessage) {
        this.server
          .to(data.ticketNumber)
          .emit('mensaje-desde-servidor', welcomeMessage);
      }
    }
  }

  @SubscribeMessage('mensaje-desde-cliente')
  async handleSendMessage(
    @MessageBody()
    data: {
      ticketNumber: string;
      texto?: string;
      fileUrl?: string;
      fileType?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;

    try {
      const savedMessage = await this.chatService.saveMessage(
        data.ticketNumber,
        userId,
        data.texto,
        data.fileUrl,
        data.fileType,
      );

      this.server
        .to(data.ticketNumber)
        .emit('mensaje-desde-servidor', savedMessage);
    } catch (error) {
      this.logger.error(`Error procesando mensaje: ${error.message}`);
    }
  }

  // Eventos de comprobante de pago
  notifyTicketReceiptCreated(managerId: string, payload: any) {
    this.server.to(managerId).emit('ticket-receipt-created', payload);
  }

  notifyTicketReceiptUpdated(assessorId: string, payload: any) {
    this.server.to(assessorId).emit('ticket-receipt-updated', payload);
  }

  @SubscribeMessage('user-typing')
  async handleUserTyping(
    @MessageBody() data: { ticketNumber: string; typing: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    this.server
      .to(data.ticketNumber)
      .except(client.id)
      .emit('user-typing', data);
  }

  @SubscribeMessage('set-ticket-timer')
  async handleSetTicketTimer(
    @MessageBody()
    data: { ticketNumber: string; minutes: number; isInitial: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;
    const { ticketNumber, minutes, isInitial } = data;

    const label =
      minutes < 60
        ? `${minutes} minutos`
        : minutes === 60
          ? '1 hora'
          : minutes % 60 === 0
            ? `${minutes / 60} horas`
            : `${Math.floor(minutes / 60)}h ${minutes % 60}min`;

    const messageText = isInitial
      ? `⏱ Su ticket será cerrado en aproximadamente ${label}. Si tiene algún inconveniente y necesita más tiempo, por favor indíqueselo al asesor para que pueda ajustar el tiempo de espera.`
      : `🔄 El asesor modificó el tiempo de cierre del ticket a ${label}.`;

    try {
      const savedMessage = await this.chatService.saveMessage(
        ticketNumber,
        userId,
        messageText,
      );
      this.server.to(ticketNumber).emit('mensaje-desde-servidor', savedMessage);
    } catch (error) {
      this.logger.error(`Error saving timer message: ${error.message}`);
    }

    // Broadcast timer info so all participants can show the countdown
    this.server.to(ticketNumber).emit('ticket-timer-updated', {
      minutes,
      startedAt: new Date().toISOString(),
    });

    // Handle timer at the backend memory too
    setTimeout(async () => {
      try {
        const finalized = await this.chatService.autoFinalizeTicket(ticketNumber);
        if (finalized) {
          this.server.to(ticketNumber).emit('ticket-finalized', {
            ticketNumber: finalized.ticketNumber,
            status: finalized.status,
          });
        }
      } catch (error) {
        this.logger.error(`Error auto-finalizing ticket on timeout: ${error.message}`);
      }
    }, minutes * 60 * 1000);
  }

  notifyTicketRejected(
    ticketNumber: string,
    payload: { ticketNumber: string; status: string; message: string },
  ) {
    this.server.to(ticketNumber).emit('ticket-rejected', payload);
  }
}
