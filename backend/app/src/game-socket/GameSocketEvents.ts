/* eslint-disable max-depth */
/* eslint-disable max-len */
/* eslint-disable curly */
/* eslint-disable max-statements */
/* eslint-disable max-lines-per-function */

// eslint-disable-next-line max-classes-per-file
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
} from "@nestjs/websockets";
import * as jwt from "jsonwebtoken";
import { Server, Socket } from "socket.io";
import GameServe from "./Objects/GameServe";
import { GameService } from "./Game.service";
import { Logger } from "@nestjs/common";
import { UserService } from "../user/user.service";
import { NodeAnimationFrame } from "./NodeAnimationFrame";
import e from "express";
import { ContentAndApprovalsPage } from "twilio/lib/rest/content/v1/contentAndApprovals";
import { disconnect } from "process";
import { profileEnd } from "console";

import	* as roomNameArray from "./assets/roomName.json";

type	ActionSocket = {
	type: string,
	payload?: any
};

type	HandShakeModel = {
	isValid: boolean,
	gameMode: string,
	friendId?: string,
};

type	FilteredArrayModel = {
	filtered: {
		undefined: GameServe[];
		disconnected: GameServe[];
		invited: GameServe[];
		revoked: GameServe[];
	}
};

@WebSocketGateway(
{
	path: "/socket-game/random",
	cors:
	{
		origin: "*"
	},
})
export class GameSocketEvents
	implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
	@WebSocketServer()
	server				: Server;
	private readonly	logger = new Logger("game-socket-event");
	printPerformance	: (timestamp: number, frame: number, instance: GameServe) => void;
	update				: (instance: GameServe) => void;

	afterInit(server: Server)
	{
		this.server = server;
		this.gameService.setUsers(0);
		this.gameService.setTotalUsers(0);
	}

	public	constructor(
		private readonly gameService: GameService,
		private readonly userService: UserService
	)
	{
		this.gameService.setUserReadyNumber(0);
		this.update = (instance: GameServe) =>
		{
			instance.playerOne.updatePlayerPosition();
			instance.playerTwo.updatePlayerPosition();

			instance.ball.update();
			if (instance.gameMode === "upside-down")
			{
				const	actualFace = instance.face;
				const	switchRate = 5;

				if (instance.paddleCount === 0)
					return ;
				if (instance.paddleCount % switchRate === 0 && instance.triggeredPaddleCount !== instance.paddleCount)
				{
					if (instance.face === "up" && instance.faceDirection === "up")
					{
						instance.faceDirection = "down";
						instance.triggeredPaddleCount = instance.paddleCount;
					}
					if (instance.face === "down" && instance.faceDirection === "down")
					{
						instance.faceDirection = "up";
						instance.triggeredPaddleCount = instance.paddleCount;
					}
				}
				if (instance.face === "up" && instance.faceDirection === "down")
				{
					if (instance.faceRotation !== 180)
						instance.faceRotation += 3;
					else
						instance.face = "down";
				}
				if(instance.face === "down" && instance.faceDirection === "up")
				{
					if (instance.faceRotation !== 0)
						instance.faceRotation -= 3;
					else
						instance.face = "up";
				}
				
			}
		};

		this.printPerformance = (timestamp: number, frame: number, instance: GameServe) =>
		{
			if (instance.loop && instance.loop.gameActive === false)
				return ;
			this.update(instance);

			const	scorePlayerOne = instance.playerOne.score;
			const	scorePlayerTwo = instance.playerTwo.score;
			if (scorePlayerOne === instance.scoreLimit || scorePlayerTwo === instance.scoreLimit)
			{
				this.gameService.recordMatchHistory(instance);
				const	playerOneSocket = instance.playerOne.socketId;
				const	playerTwoSocket = instance.playerTwo.socketId;

				const isPlayerOneActiveSocket = this.gameService.socketIdUsers
					.findIndex((elem) =>
					{
						return (elem.socketId === playerOneSocket);
					});
				if (isPlayerOneActiveSocket !== -1)
				{
					this.server.to(instance.roomName).emit("matchmaking-state", {type: "the-end"});
				}
				const isPlayerTwoActiveSocket = this.gameService.socketIdUsers
					.findIndex((elem) =>
					{
						return (elem.socketId === playerTwoSocket);
					});
				if (isPlayerTwoActiveSocket !== -1)
				{
					this.server.to(instance.roomName).emit("matchmaking-state", {type: "the-end"});
				}
			}
			// upside = 0, down = 180
			const gameFace = instance.face === "up" ? 0 : 180;

			const action = {
				type: "game-data",
				payload:
				{
					frameNumber: frame,
					ballPos: {
						x: instance.ball.pos.x,
						y: instance.ball.pos.y,
					},
					playerOne:
					{
						pos: {
							x: instance.playerOne.pos.x,
							y: instance.playerOne.pos.y,
						}
					},
					playerTwo:
					{
						pos: {
							x: instance.playerTwo.pos.x,
							y: instance.playerTwo.pos.y,
						}
					},
					plOneScore: instance.playerOne.score,
					plTwoScore: instance.playerTwo.score,
					whichFace: instance.faceRotation,
				}
			};
			this.server.to(instance.roomName).emit("game-event", action);
			if (instance.loop && (instance.playerOne.score === instance.scoreLimit
				|| instance.playerTwo.score === instance.scoreLimit))
			{
				const	gameActive = {
					type: "desactivate",
					payload: {
						gameActive: false
					}
				};
				this.server.to(instance.roomName).emit("game-active", gameActive);
				instance.loop.gameActive = false;
			}
		};
	}

	private isGameModeValid(gameMode: string): boolean
	{
		switch (gameMode)
		{
			case "classical":
			case "upside-down":
			case "friend":
				return (true);
				break ;
			default:
				return false;
		}
	}

	private	isTokenValid(inputToken: string)
		: {
			isValid: boolean,
			profileId: string
		}
	{
		const	secret = this.userService.getSecret();
		const	bearerToken = inputToken;
		const	token = bearerToken.split("Bearer ");
		const	result = {
			isValid: false,
			profileId: ""
		};
		if (token.length !== 2)
			return (result);
		try
		{
			const	decodedToken = jwt.verify(token[1], secret) as jwt.JwtPayload;
			result.profileId = decodedToken.id;
			result.isValid = true;
		}
		catch (error)
		{
			result.isValid = false;
			if (error instanceof jwt.JsonWebTokenError)
			{
			}
			return (result);
		}
		return (result);
	}

	private	isHandshakeValid(client: Socket)
		: HandShakeModel
	{
		const	result: HandShakeModel= {
			isValid: false,
			gameMode: "classical",
			friendId: undefined
		};

		if (client.handshake.auth)
		{
			if (client.handshake.auth.mode)
			{
				result.isValid = this.isGameModeValid(client.handshake.auth.mode);
				result.gameMode = client.handshake.auth.mode;
				if (result.gameMode === "friend" && client.handshake.auth.friendId)
					result.friendId = client.handshake.auth.friendId;
				else if (result.gameMode === "friend" && client.handshake.auth.friendId === undefined)
					result.isValid = false;
			}
			else
			{
				result.isValid = false;
				return (result);
			}
		}
		else
		{
			result.isValid = false;
			return (result);
		}
		return (result);
	}

	// please send a notification on disconnect 
	public	doRenewSocketIfDisconnected(client: Socket, profileId: string, indexOldSocketId: number)
	{
		// expected unique instance
		const	indexGameInstance = this.gameService.gameInstances.findIndex((instance) =>
		{
			return (
				instance.playerOne.profileId === profileId
				|| instance.playerTwo.profileId === profileId
			);
		});
		if (indexGameInstance === -1)
		{
			// at this step we are shure socket id is present
			// cf: this.gameService.pushClientIdIntoSocketIdUsers(client.id, profileId);
			client.disconnect();
			return ;
		}
		if (this.gameService.gameInstances[indexGameInstance].playerOne.profileId === profileId)
		{
			if (this.gameService.gameInstances[indexGameInstance].playerOne.socketId === "disconnected")
			{
				// accept the renew connection
				this.gameService.socketIdUsers[indexOldSocketId].socketId = client.id;
				this.gameService.gameInstances[indexGameInstance].playerOne.socketId = client.id;
				this.gameService.gameInstances[indexGameInstance].userConnected += 1;
			}
			else
			{
				// disconnect
				client.disconnect();
				return ;
			}
		}
		if (this.gameService.gameInstances[indexGameInstance].playerTwo.profileId === profileId)
		{
			if (this.gameService.gameInstances[indexGameInstance].playerTwo.socketId === "disconnected")
			{
				// accept the renew connection
				this.gameService.socketIdUsers[indexOldSocketId].socketId = client.id;
				this.gameService.gameInstances[indexGameInstance].playerTwo.socketId = client.id;
				this.gameService.gameInstances[indexGameInstance].userConnected += 1;
			}
			else
			{
				// disconnect
				client.disconnect();
				return ;
			}
		}
	}

	public	createNewRoomIfNoGameInstance()
	{
		console.log("unimplemented");
	}

	public doHandShake(client: Socket)
	{
		const	handShake: HandShakeModel = this.isHandshakeValid(client);
		if (handShake.isValid === false)
		{
			client.disconnect();
			return ({error: true});
		}
		const token = this.isTokenValid(client.handshake.auth.token);
		if (token.isValid === false)
		{
			console.log(token);
			client.disconnect();
			return ({error: true});
		}
		return ({
			handShake: handShake,
			token: token,
			error: false,
		});
	}

	public	doesClientHaveActiveConnection(profileId: string)
	{
		const	indexSocketId = this.gameService
			.findIndexSocketIdUserByProfileId(profileId);
		if (indexSocketId === -1)
			return (false);
		return (true);
	}

	public	filterGameByProfileIdAndGameMode(profileId: string, gameMode: string)
	{
		const	filteredGame = this.gameService.gameInstances.filter((instance) =>
		{
			return (
				instance.playerOne.profileId === profileId
				|| instance.playerTwo.profileId === profileId
			);
		});
		const	filteredGameByGameMode = filteredGame.filter((instance) =>
		{
			return (instance.gameMode === gameMode);
		});
		return (filteredGameByGameMode);
	}

	public	getUuidGameFromFilteredGame(game: GameServe[], profileId: string)
	{
		const	uuidGame: string[] = [];

		for (const instance of game)
		{
			if (instance.playerOne.profileId === profileId)
			{
				if (instance.playerOne.socketId !== "disconnected"
					&& instance.playerOne.socketId !== "undefined"
					&& instance.playerOne.socketId !== "invitation"
					&& instance.playerOne.socketId !== "revoked")
					uuidGame.push(instance.uuid as string);
			}
			else if (instance.playerTwo.profileId === profileId)
			{
				if (instance.playerTwo.socketId !== "disconnected"
					&& instance.playerTwo.socketId !== "undefined"
					&& instance.playerTwo.socketId !== "invitation"
					&& instance.playerTwo.socketId !== "revoked")
					uuidGame.push(instance.uuid as string);
			}
		}
		return (uuidGame);
	}

	/**
	 * @deprecated
	 * @param client 
	 * @param gameMode 
	 * @param arrayGameFiltered 
	 * @returns 
	 */
	public	randomGameRefreshed(client: Socket, gameMode: string, arrayGameFiltered: GameServe[])
	{
		const	keywordSelector = "disconnected";

		if (gameMode === "friend")
		{
			this.logger.error("Error: This function does not handle friend game mode");
			return ;
		}
		else
		{
			if (arrayGameFiltered.length === 0)
			{
				this.logger.verbose("Info: no game pause (" + gameMode + ")- no renewal");
				return ;
			}
			if (arrayGameFiltered.length > 1)
			{
				this.logger.error("Error: more than one instance in this game mode: ", gameMode);
				return ;
			}
		}
	}

	public	filterGameArrayBySocketState(profileId: string, arrayGameMode: GameServe[])
		: FilteredArrayModel
	{
		// the socketState of a user disconnected
		const	disconnectedArray = arrayGameMode.filter((instance) =>
		{
			const	socketPlayerOne = instance.playerOne.socketId;
			const	socketPlayerTwo = instance.playerTwo.socketId;

			const	profileIdPlayerOne = instance.playerOne.profileId;
			const	profileIdPlayerTwo = instance.playerTwo.profileId;

			if (profileIdPlayerOne === profileId)
				if (socketPlayerOne === "disconnected")
					return (true);
			if (profileIdPlayerTwo === profileId)
				if (socketPlayerTwo === "disconnected")
					return (true);
			return (false);
		});

		// the basic socketState of a random game (never connected)
		const	undefinedArray = arrayGameMode.filter((instance) =>
		{
			const	socketPlayerOne = instance.playerOne.socketId;
			const	socketPlayerTwo = instance.playerTwo.socketId;

			const	profileIdPlayerOne = instance.playerOne.profileId;
			const	profileIdPlayerTwo = instance.playerTwo.profileId;

			if (profileIdPlayerOne === profileId)
				if (socketPlayerOne === "undefined")
					return (true);
			if (profileIdPlayerTwo === profileId)
				if (socketPlayerTwo === "undefined")
					return (true);
			return (false);
		});

		// the basic socketState of a friend games 
		const	invitedArray = arrayGameMode.filter((instance) =>
		{
			const	socketPlayerOne = instance.playerOne.socketId;
			const	socketPlayerTwo = instance.playerTwo.socketId;

			const	profileIdPlayerOne = instance.playerOne.profileId;
			const	profileIdPlayerTwo = instance.playerTwo.profileId;

			if (profileIdPlayerOne === profileId)
				if (socketPlayerOne === "invited")
					return (true);
			if (profileIdPlayerTwo === profileId)
				if (socketPlayerTwo === "invited")
					return (true);
			return (false);
		});

		// the socket state of friend abandoned
		const	revokedArray = arrayGameMode.filter((instance) =>
		{
			const	socketPlayerOne = instance.playerOne.socketId;
			const	socketPlayerTwo = instance.playerTwo.socketId;

			const	profileIdPlayerOne = instance.playerOne.profileId;
			const	profileIdPlayerTwo = instance.playerTwo.profileId;

			if (profileIdPlayerOne === profileId)
				if (socketPlayerOne === "revoked")
					return (true);
			if (profileIdPlayerTwo === profileId)
				if (socketPlayerTwo === "revoked")
					return (true);
			return (false);
		});

		return ({
			filtered:
			{
				undefined: undefinedArray,
				disconnected: disconnectedArray,
				invited: invitedArray,
				revoked: revokedArray
			}
		});
	}

	async handleConnection(client: Socket)
	{
		let		roomName: string;

		const { handShake, token, error} = this.doHandShake(client);
		if (error === true || token === undefined || handShake === undefined)
			return ;
		const	profileId = token.profileId;
		const	gameModeRequest = handShake.gameMode;

		const	isActiveConnection = this.doesClientHaveActiveConnection(profileId);
		const	friendModeGame = this.filterGameByProfileIdAndGameMode(profileId, "friend");
		const	classicalGameMode = this.filterGameByProfileIdAndGameMode(profileId, "classical");
		const	upsideDownGameMode = this.filterGameByProfileIdAndGameMode(profileId, "upside-down");

		if (isActiveConnection === true)
		{
			this.logger.verbose("User disconnected: already have a connection");
			client.emit("matchmaking-state", {type: "already-connected"});
			client.disconnect();
			return ;
		}
		const	friendArray = this.filterGameArrayBySocketState(profileId, friendModeGame);
		const	classicalArray = this.filterGameArrayBySocketState(profileId, classicalGameMode);
		const	upsideDownArray = this.filterGameArrayBySocketState(profileId, upsideDownGameMode);
		this.gameService.pushClientIdIntoSocketIdUsers(client.id, profileId);
		//	A/ id friend not checked yet :
		//		-- check:
		//			if player (Two || One) is the friend profile id => PartB (the game has be created by api)
		// 			else: reject (may not have invited, game don't exist)
		//	
		//	B/ socketState:
		//		- disconnect: okay && renew socket
		//		- invited: okay && renew socket
		//		- revoked: refuse connection
		//		- undefined: must never
		if (gameModeRequest === "friend")
		{
			if (friendArray.filtered.disconnected.length === 0)
			{
				this.logger.verbose("\tThe user has no pending games");
			}
			if (friendArray.filtered.invited.length === 0)
			{
				this.logger.verbose("\tThe user has no invite games");
			}
			if (friendArray.filtered.revoked.length === 0)
			{
				this.logger.verbose("\tThe user has no revoked games");
			}
			if (friendArray.filtered.undefined.length === 0)
			{
				this.logger.verbose("\tThe user as no undefined games");
			}
		}

		//	[V]disconnected: user has pausing her game and other player is here : renew
		//	[X]invited: must never be exist in this gameMode
		//	[X]revoked: user abandon the game
		//		-- this one: the game must reject 2 players at setter and game deleted
		//	[X]/!\ undefined: the user never play the game
		//		but this one nerver trigger here undefined is after search a game and setted at player Two
		else if (gameModeRequest === "classical")
		{
			if (classicalArray.filtered.disconnected.length === 0)
			{
			}
			else
			{
				const	indexClassicalDisconnected = this.gameService
					.gameInstances.findIndex((instance) =>
					{
						return (
							(
								instance.playerOne.profileId === profileId
								|| instance.playerTwo.profileId === profileId
							) && instance.gameMode === "classical"
						);
					});
				if (indexClassicalDisconnected === -1)
				{
				}
				else
				{
					if (this.gameService.gameInstances[indexClassicalDisconnected].playerOne.profileId === profileId)
					{
						if (this.gameService.gameInstances[indexClassicalDisconnected].playerOne.socketId === "disconnected")
						{
							this.gameService.gameInstances[indexClassicalDisconnected]
								.playerOne.socketId = client.id;
							this.gameService.gameInstances[indexClassicalDisconnected]
								.userConnected += 1;
							roomName = this.gameService.gameInstances[indexClassicalDisconnected]
								.roomName;
							await client.join(roomName);
							return ;
						}
						else
						{
							client.disconnect();
							return ;
						}
					}
					if (this.gameService.gameInstances[indexClassicalDisconnected].playerTwo.profileId === profileId)
					{
						if (this.gameService.gameInstances[indexClassicalDisconnected].playerTwo.socketId === "disconnected")
						{
							this.gameService.gameInstances[indexClassicalDisconnected]
								.playerTwo.socketId = client.id;
							this.gameService.gameInstances[indexClassicalDisconnected]
								.userConnected += 1;
							roomName = this.gameService.gameInstances[indexClassicalDisconnected]
								.roomName;
							await client.join(roomName);
							return ;
						}
						else
						{
							client.disconnect();
							return ;
						}
					}
				}
			}
			if (classicalArray.filtered.invited.length === 0)
			{
			}
			if (classicalArray.filtered.revoked.length === 0)
			{
			}
			if (classicalArray.filtered.undefined.length === 0)
			{
				const	indexClassicalAlone = this.gameService
					.findIndexGameInstanceAloneByGameMode("classical");
				if (indexClassicalAlone === -1)
				{
					this.gameService.increaseRoomCount();
					// can put length of room dynamically to reject connection if liimiit trigger
					// roomNameArray.length < roomCount : reject busy server
					roomName = "room "
						+ roomNameArray [
							this.gameService.getRoomCount()
						];
					await client.join(roomName);
					const	newRoom = new GameServe(roomName);
					newRoom.gameMode = "classical";
					newRoom.ball.game = newRoom;
					newRoom.board.game = newRoom;
					newRoom.net.game = newRoom;
					newRoom.playerOne.socketId = client.id;
					newRoom.playerOne.profileId = profileId;
					newRoom.userConnected += 1;
					newRoom.board.init();
					newRoom.loop = new NodeAnimationFrame();
					newRoom.loop.game = newRoom;
					newRoom.loop.callbackFunction = this.printPerformance;
					newRoom.loop.update(performance.now());
					this.gameService.pushGameServeToGameInstance(newRoom);
				}
				else
				{
					if (this.gameService.gameInstances[indexClassicalAlone].playerOne.socketId === "undefined")
					{
						this.gameService.gameInstances[indexClassicalAlone].playerOne.socketId = client.id;
						this.gameService.gameInstances[indexClassicalAlone].playerOne.profileId = profileId;
					}
					else
					{
						this.gameService.gameInstances[indexClassicalAlone].playerTwo.socketId = client.id;
						this.gameService.gameInstances[indexClassicalAlone].playerTwo.profileId = profileId;
					}
					this.gameService.gameInstances[indexClassicalAlone].userConnected += 1;
					roomName = this.gameService.gameInstances[indexClassicalAlone].roomName;
					await client.join(roomName);
				}
			}
		}

		//	disconnected: user has pausing her game and other player is here
		//	invited: must never be exist in this gameMode
		//	revoked: user abandon the game
		//		-- this one: the game must reject 2 players at setter and game deleted
		//	/!\ undefined: the user never play the game
		//		but this one nerver trigger here undefined is after search a game and setted at player Two
		if (gameModeRequest === "upside-down")
		{
			if (upsideDownArray.filtered.disconnected.length === 0)
			{
			}
			else
			{
				const	indexUpsideDownDisconnected = this.gameService
					.gameInstances.findIndex((instance) =>
					{
						return (
							(
								instance.playerOne.profileId === profileId
								|| instance.playerTwo.profileId === profileId
							) && instance.gameMode === "upside-down"
						);
					});
				if (indexUpsideDownDisconnected === -1)
				{
				}
				else
				{
					if (this.gameService.gameInstances[indexUpsideDownDisconnected].playerOne.profileId === profileId)
					{
						if (this.gameService.gameInstances[indexUpsideDownDisconnected].playerOne.socketId === "disconnected")
						{
							this.gameService.gameInstances[indexUpsideDownDisconnected]
								.playerOne.socketId = client.id;
							this.gameService.gameInstances[indexUpsideDownDisconnected]
								.userConnected += 1;
							roomName = this.gameService.gameInstances[indexUpsideDownDisconnected]
								.roomName;
							await client.join(roomName);
							return ;
						}
						else
						{
							client.disconnect();
							return ;
						}
					}
					if (this.gameService.gameInstances[indexUpsideDownDisconnected].playerTwo.profileId === profileId)
					{
						if (this.gameService.gameInstances[indexUpsideDownDisconnected].playerTwo.socketId === "disconnected")
						{
							this.gameService.gameInstances[indexUpsideDownDisconnected]
								.playerTwo.socketId = client.id;
							this.gameService.gameInstances[indexUpsideDownDisconnected]
								.userConnected += 1;
							roomName = this.gameService.gameInstances[indexUpsideDownDisconnected]
								.roomName;
							await client.join(roomName);
							return ;
						}
						else
						{
							client.disconnect();
							return ;
						}
					}
				}
			}
			if (upsideDownArray.filtered.invited.length === 0)
			{
				this.logger.verbose("\tThe user has no invite games");
			}
			if (upsideDownArray.filtered.revoked.length === 0)
			{
				this.logger.verbose("\tThe user has no revoked games");
			}
			if (upsideDownArray.filtered.undefined.length === 0)
			{
				this.logger.verbose("\tThe user as no undefined games");
				this.logger.debug("Search a game with player two as undefined");
				const	indexUpsideDownAlone = this.gameService
					.findIndexGameInstanceAloneByGameMode("upside-down");
				if (indexUpsideDownAlone === -1)
				{
					this.logger.debug("\tNo player Alone in this gameMode");
					this.logger.verbose("Creating game, the user will be player one");
					this.gameService.increaseRoomCount();
					// can put length of room dynamically to reject connection if liimiit trigger
					// roomNameArray.length < roomCount : reject busy server
					roomName = "room "
						+ roomNameArray [
							this.gameService.getRoomCount()
						];
					this.logger.verbose("\tRoom name: " + roomName);
					await client.join(roomName);
					const	newRoom = new GameServe(roomName);
					newRoom.gameMode = "upside-down";
					newRoom.ball.game = newRoom;
					newRoom.board.game = newRoom;
					newRoom.net.game = newRoom;
					newRoom.playerOne.socketId = client.id;
					newRoom.playerOne.profileId = profileId;
					newRoom.userConnected += 1;
					newRoom.board.init();
					newRoom.loop = new NodeAnimationFrame();
					newRoom.loop.game = newRoom;
					newRoom.loop.callbackFunction = this.printPerformance;
					newRoom.loop.update(performance.now());
					this.gameService.pushGameServeToGameInstance(newRoom);
					this.logger.verbose("Game is created");
				}
				else
				{
					if (this.gameService.gameInstances[indexUpsideDownAlone].playerOne.socketId === "undefined")
					{
						this.gameService.gameInstances[indexUpsideDownAlone].playerOne.socketId = client.id;
						this.gameService.gameInstances[indexUpsideDownAlone].playerOne.profileId = profileId;
						this.logger.verbose("Joining game, the user will be player One");
					}
					else
					{
						this.gameService.gameInstances[indexUpsideDownAlone].playerTwo.socketId = client.id;
						this.gameService.gameInstances[indexUpsideDownAlone].playerTwo.profileId = profileId;
						this.logger.verbose("Joining game, the user will be player Two");
					}
					this.gameService.gameInstances[indexUpsideDownAlone].userConnected += 1;
					roomName = this.gameService.gameInstances[indexUpsideDownAlone].roomName;
					this.logger.verbose("\tRoom name: " + roomName);
					await client.join(roomName);
					this.logger.verbose("Joined the game");
				}
			}
		}
		this.logger.verbose("The user request game mode " + gameModeRequest);
		return ;
	}

	handleDisconnect(client: Socket)
	{
		// set pause if client id is in a game
		const	profileId = this.gameService.findProfileIdFromSocketId(client.id)?.profileId;
		if (profileId === undefined)
			this.logger.error("Profile id not found");
		const	indexInstance = this.gameService.findIndexGameInstanceWithClientId(client.id);
		if (indexInstance === -1)
			this.logger.error("game instance not fouded for disconnect user");
		if (this.gameService.isProfileIdUserOne(indexInstance, profileId as string))
			this.gameService.gameInstances[indexInstance].playerOne.socketId = "disconnected";
		if (this.gameService.isProfileIdUserTwo(indexInstance, profileId as string))
			this.gameService.gameInstances[indexInstance].playerTwo.socketId = "disconnected";


		// At the end PLZ
		this.gameService.setGameActiveToFalse(indexInstance);
		// // remove the user from the list of users
		const userIndex = this.gameService.findIndexSocketIdUserByClientId(client.id);
		this.gameService.removeOneSocketIdUserWithIndex(userIndex);
		// this.gameService.decreaseUsers();

		// // remove the user from the list of users ready
		// const	wasReadyIndex = this.gameService
		// 	.findIndexSocketIdReadyWithSocketId(client.id);
		// if (wasReadyIndex !== -1)
		// {
		// 	this.gameService.removeOneSocketIdReadyWithIndex(wasReadyIndex);
		// 	this.gameService.decreaseUserReadyNumber();
		// }

		// // send the new number of users and users ready
		// const	action = {
		// 	type: "disconnect",
		// 	payload: {
		// 		numberUsers: this.gameService.getUsers(),
		// 		userReadyCount: this.gameService.getUserReadyNumber()
		// 	}
		// };
		// this.logger.error("User with id: " + client.id + " is quitting pprofile id is: " + profileId);

		// const indexGameInstance = this.gameService.findIndexGameInstanceWithProfileId(profileId as string);
		// if (indexGameInstance === -1)
		// 	this.logger.error("Index game instance failure ");
		// else
		// {
		// 	this.gameService.gameInstances[indexGameInstance].userConnected -= 1;
		// 	if (this.gameService.gameInstances[indexGameInstance].userConnected === 0)
		// 	{
		// 		this.gameService.removeGameInstance(indexGameInstance);
		// 		if (this.gameService.gameInstances.length === 0)
		// 		{
		// 			this.gameService.roomCount = 0;
		// 		}
		// 	}
		// }
		// const instance = this.gameService.findGameInstanceWithClientId(client.id);
		// if (instance)
		// {
		// 	this.logger.error("Test deeead code");
		// 	this.server.to(instance.roomName).emit("player-info", action);
		// }
	}

	@SubscribeMessage("info")
	handleInfo(
		@MessageBody() data: ActionSocket,
		@ConnectedSocket() client: Socket
	)
	{
		let		actionType: string;
		const	instance = this.gameService
			.getGameInstances()
			.find((instance) =>
			{
				return (instance.playerOne.socketId === client.id
					|| instance.playerTwo.socketId === client.id);
			});
		if (instance)
		{
			if (data.type === "GET_BOARD_SIZE")
				actionType = "serverBoard_info";
			else if (data.type === "resize")
				actionType = "reset_your_scale";
			else
				actionType = "";
			if (actionType !== "")
			{
				const	action = {
					type: actionType,
					payload:
					{
						serverBoardDim:
						{
							width: instance.board.dim.width,
							height: instance.board.dim.height
						}
					}
				};
				client.emit("info", action);
			}
		}
	}

	@SubscribeMessage("game-event")
	handleGameEvent(
		@MessageBody() data: ActionSocket,
		@ConnectedSocket() client: Socket
	)
	{
		let	userRoom: string;
		userRoom = "";
		this.server.sockets.adapter.rooms.forEach((room, roomName) =>
		{
			// Check if the socket ID is in the room
			if (room.has(client.id) && roomName !== client.id)
				userRoom = roomName;
		});
		if (!userRoom)
		{
			console.log("An error occured with socket.io");
			return ;
		}
		const roomInfo = this.server.sockets.adapter.rooms.get(userRoom);
		if (!roomInfo)
		{
			console.log("An error occured with socket.io");
			return ;
		}
		const socketIdsInRoom = Array.from(roomInfo.keys());

		if (data.type === "ready")
		{
			const	search = this.gameService.findSocketIdReadyWithSocketId(client.id);
			if (search === undefined)
			{
				const	profileId = this.gameService.findProfileIdFromSocketId(client.id)?.profileId as string;
				this.gameService.pushClientIdIntoSocketIdReady(client.id, profileId);
				this.gameService.increaseUserReadyNumber();

				// check and add the user to the ready list

				let	countReadyInRoom: number;
				countReadyInRoom = 0;
				for (const socketId of socketIdsInRoom)
				{
					const	searchReady = this.gameService
						.findSocketIdReadyWithSocketId(socketId);
					if (searchReady !== undefined)
						countReadyInRoom++;
				}

				const	action = {
					type: "ready-player",
					payload: {
						userReadyCount: this.gameService.getUserReadyNumber(),
						gameActive: true
					}
				};

				this.server.to(userRoom).emit("player-info", action);

				if (countReadyInRoom === 2)
				{
					this.server.to(userRoom).emit("game-active", action);
					for (const instance of this.gameService.getGameInstances())
					{
						if (instance.loop && (instance.playerOne.socketId === client.id
							|| instance.playerTwo.socketId === client.id))
							instance.loop.gameActive = true;
					}
				}
			}
		}

		// Determine whether the player is right or left player
		let	playerIndex: number;
		playerIndex = 0;
		for (const socketId of socketIdsInRoom)
		{
			if (socketId === client.id)
				playerIndex = 1;
			else
				playerIndex = 2;
			break ;
		}

		for (const instance of this.gameService.getGameInstances())
		{
			if (instance.roomName === userRoom)
			{
				if (data.type === "arrow-up")
				{
					if (playerIndex === 1)
						instance.actionKeyPress = 38;
					else if (playerIndex === 2)
						instance.actionKeyPress = 87;
				}
				if (data.type === "arrow-down")
				{
					if (playerIndex === 1)
						instance.actionKeyPress = 40;
					else if (playerIndex === 2)
						instance.actionKeyPress = 83;
				}
				if (data.type === "stop-key")
					instance.actionKeyPress = -1;
			}
		}
	}
}
