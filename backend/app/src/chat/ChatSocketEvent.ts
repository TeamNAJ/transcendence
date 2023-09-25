/* eslint-disable max-lines-per-function */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable max-len */
/* eslint-disable max-statements */
import { Server, Socket } from "socket.io";
import Chat from "./Objects/Chat";
import User from "./Objects/User";
import Channel from "./Objects/Channel";

import
{
	ConnectedSocket,
	MessageBody,
	OnGatewayConnection,
	OnGatewayDisconnect,
	OnGatewayInit,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer
}	from "@nestjs/websockets";
import { ChatService } from "./Chat.service";

type	ActionSocket = {
	type: string,
	payload?: any
};

@WebSocketGateway(
{
	cors:
	{
		origin: "*"
	},
})
export class ChatSocketEvents
		implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
	{
		@WebSocketServer()
		server: Server;
		// chat: Chat;

		public	constructor(private readonly chatService: ChatService)
		{
		}

		afterInit(server: any)
		{
		}

		handleConnection(client: Socket)
		{
			const searchUser = this.chatService.searchUser(client.id);
			if (searchUser === undefined)
			{
				const newUser = new User("test", client);
				this.chatService.pushUser(newUser, client.id);
			}
		}

		handleDisconnect(client: Socket)
		{
			const	userIndex = this.chatService.searchUserIndex(client.id);
			const	socketIndex = this.chatService.searchSocketIndex(client.id);
			if (userIndex !== undefined)
				this.chatService.deleteUser(userIndex, socketIndex);
		}

		@SubscribeMessage("channel-info")
		handleChatCreation(
			@MessageBody() data: ActionSocket,
			@ConnectedSocket() client: Socket
		)
		{
			if (data.type === "create-channel")
			{
				const newChannel = new Channel(data.payload.chanName,
					client,
					data.payload.selectedMode,
					data.payload.chanPassword);
				newChannel.chat = this.chatService.getChat();
				this.chatService.addNewChannel(newChannel);
				const	action = {
					type: "add-new-channel",
					payload: newChannel.name
				};
				this.server.emit("display-channels", action);
			}

			if (data.type === "destroy-channel")
			{
				const	searchChannel = this.chatService.searchChannelByName(data.payload.name);
				let isAdmin: boolean;
				if (searchChannel?.isAdmin(client.id) === true)
					isAdmin = true;
				else
					isAdmin = false;
				const	action = {
					type: "destroy-channel",
					payload: {
						name: data.payload.name,
						chanId: data.payload.id,
						isAdmin: isAdmin,
					}
				};
				this.server.emit("display-channels", action);
			}
		}
	}
