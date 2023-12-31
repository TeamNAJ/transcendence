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
import { constrainedMemory, disconnect } from "process";
import { profileEnd } from "console";
import	* as roomNameArray from "./assets/roomName.json";
import FileConfig from "src/user/Object/FileConfig";
import { UserModel } from "../user/user.interface";

type	ActionSocket = {
	type: string,
	payload?: any
};

type	HandShakeModel = {
	isValid: boolean,
	gameMode: string,
	uuid?: string,
};

export type	FilteredArrayModel = {
	filtered: {
		undefined: GameServe[];
		disconnected: GameServe[];
		invited: GameServe[];
		revoked: GameServe[];
		connected: GameServe[];
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
		this.logger.verbose("Started instance of game socket event with id : " + this.userService.getUuidInstance());
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
			if (instance.revoked === true)
			{
				instance.revoked = false;
				this.logger.debug("instance not killed");
				if (frame === 0)
				{
					this.server.to(instance.roomName).emit("matchmaking-state", {type: "abandon"});
				}
				else
				{
					this.server.to(instance.roomName).emit("matchmaking-state", {type: "abandon"});
				}
				return ;
			}
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
				console.error("Error: JsonWebTokenError", error);
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
			uuid: undefined
		};

		if (client.handshake.auth)
		{
			if (client.handshake.auth.mode)
			{
				result.isValid = this.isGameModeValid(client.handshake.auth.mode);
				result.gameMode = client.handshake.auth.mode;
				if (result.gameMode === "friend" && client.handshake.auth.uuid)
					result.uuid = client.handshake.auth.uuid;
				else if (result.gameMode === "friend" && client.handshake.auth.uuid === undefined)
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

	/**
	 * 	A/ id friend not checked yet :
	 * 			-- check:
	 *				if player (Two || One) is the friend profile id => PartB (the game has be created by api)
	 *				else: reject (may not have invited, game don't exist)
	 *		
	 *	B/ socketState:
	 *			- disconnect: okay && renew socket
	 *			- invited: okay && renew socket
	 *			- revoked: refuse connection
	 *			- undefined: must never
	 **/
	public async	dispatchMatchmakingFriend(profileId: string, client: Socket, uuid: string)

	{
		const	friendModeGame = this.gameService.filterGameArrayByGameUUID(profileId, uuid);
		const	friendArray = this.gameService.filterGameArrayBySocketState(profileId, friendModeGame);
		let		instance: GameServe;

		this.logger.verbose("client request game with uuid:" + uuid);
		this.logger.debug("Checking socket state for state of friend games");

		if (friendArray.filtered.disconnected.length === 0)
		{
			this.logger.verbose("\tThe user has no pending games");
		}
		else
		{
			instance = friendArray.filtered.disconnected[0];
			if (instance.playerOne.profileId === profileId)
			{
				instance.playerOne.socketId = client.id;
			}
			if (instance.playerTwo.profileId === profileId)
			{
				instance.playerTwo.socketId = client.id;
			}
			instance.userConnected += 1;
			await client.join(instance.roomName);
			this.logger.verbose("\tThe user is connected to the game.");
			return (instance.roomName);
		}
		if (friendArray.filtered.invited.length === 0)
		{
			this.logger.verbose("\tThe user has no invite games");
		}
		else
		{
			this.logger.verbose("\tThe user has invitation...");
			this.logger.debug("\t\tSearchin the uuid of the game...");
			instance = friendArray.filtered.invited[0];
			if (instance.playerOne.socketId === "invited" && instance.playerTwo.socketId === "invited")
			{
				this.logger.debug("\t\tInstance loop");
				if (instance.loop)
				{
					instance.loop.callbackFunction = this.printPerformance;
					instance.loop.update(performance.now());
				}
			}
			if (instance.playerOne.profileId === profileId)
			{
				instance.playerOne.socketId = client.id;
			}
			if (instance.playerTwo.profileId === profileId)
			{
				instance.playerTwo.socketId = client.id;
			}
			instance.userConnected += 1;
			await client.join(instance.roomName);
			this.logger.verbose("\tThe user is connected to the game.");
			return (instance.roomName);
		}
		if (friendArray.filtered.revoked.length === 0)
		{
			this.logger.verbose("\tThe user has no revoked games");
		}
		if (friendArray.filtered.undefined.length === 0)
		{
			this.logger.verbose("\tThe user as no undefined games");
		}
		this.logger.error("not in condition to join the game");
		client.disconnect();
		return ("The void");
	}

	/**
	 *	[V]disconnected: user has pausing her game and other player is here : renew
	 *	[X]invited: must never be exist in this gameMode
	 *	[X]revoked: user abandon the game
	 *		-- this one: the game must reject 2 players at setter and game deleted
	 *	[X]/!\ undefined: the user never play the game
	 *		but this one nerver trigger here undefined is after search a game and setted at player Two
	 * @param profileId 
	 * @param client 
	 * @returns 
	 */
	public async	dispatchMatchmakingClassical(profileId: string, client: Socket)
		: Promise<string>
	{
		const	classicalGameMode = this.gameService.filterGameByProfileIdAndGameMode(profileId, "classical");
		const	classicalArray = this.gameService.filterGameArrayBySocketState(profileId, classicalGameMode);
		let		roomName: string;

		if (classicalArray.filtered.disconnected.length === 0)
		{
			this.logger.verbose("\tThe user has no pending games");
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
						)
						&& instance.gameMode === "classical"
					);
				});
			if (indexClassicalDisconnected === -1)
			{
				this.logger.error("The user must not be in this conditions !!");
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
						this.logger.verbose("The user is reconnected as player one!");
						return (roomName);
					}
					else
					{
						this.logger.error("Must not be in this conditions");
						client.disconnect();
						return ("The void");
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
						this.logger.verbose("The user is reconnected as player Two!");
						return (roomName);
					}
					else
					{
						this.logger.error("Must not be in this conditions");
						client.disconnect();
						return ("The void");
					}
				}
			}
		}
		if (classicalArray.filtered.invited.length !== 0)
		{
			this.logger.error("\tThis mode does not accept invite");
		}
		if (classicalArray.filtered.revoked.length === 0)
		{
			this.logger.verbose("\tThe user revoked a connection");
		}
		if (classicalArray.filtered.undefined.length === 0)
		{
			this.logger.verbose("\tThe user as no undefined games");
			this.logger.debug("Search a game ");
			const	indexClassicalAlone = this.gameService
				.findIndexGameInstanceAloneByGameMode("classical");
			if (indexClassicalAlone === -1)
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
				this.logger.verbose("Game is created");
			}
			else
			{
				if (this.gameService.gameInstances[indexClassicalAlone].playerOne.socketId === "undefined")
				{
					this.gameService.gameInstances[indexClassicalAlone].playerOne.socketId = client.id;
					this.gameService.gameInstances[indexClassicalAlone].playerOne.profileId = profileId;
					this.logger.verbose("Joining game, the user will be player One");
				}
				else
				{
					this.gameService.gameInstances[indexClassicalAlone].playerTwo.socketId = client.id;
					this.gameService.gameInstances[indexClassicalAlone].playerTwo.profileId = profileId;
					this.logger.verbose("Joining game, the user will be player Two");
				}
				this.gameService.gameInstances[indexClassicalAlone].userConnected += 1;
				roomName = this.gameService.gameInstances[indexClassicalAlone].roomName;
				this.logger.verbose("\tRoom name: " + roomName);
				await client.join(roomName);
				this.logger.verbose("Joined the game");
			}
			return (roomName);
		}
		return ("The void");
	}

	public async	dispatchMatchmakingUpsideDown(profileId: string, client: Socket)
		: Promise<string>
	{
		const	upsideDownGameMode = this.gameService.filterGameByProfileIdAndGameMode(profileId, "upside-down");
		const	upsideDownArray = this.gameService.filterGameArrayBySocketState(profileId, upsideDownGameMode);
		let		roomName: string;

		this.logger.debug("Checking socket state for state of upsideDown games");
		if (upsideDownArray.filtered.disconnected.length === 0)
		{
			this.logger.verbose("\tThe user has no pending games");
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
				this.logger.error("The user must not be in this conditions !!");
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
						this.logger.verbose("The user is reconnected as player one!");
						return (roomName);
					}
					else
					{
						this.logger.error("Must not be in this conditions");
						client.disconnect();
						return ("The void");
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
						this.logger.verbose("The user is reconnected as player Two!");
						return (roomName);
					}
					else
					{
						this.logger.error("Must not be in this conditions");
						client.disconnect();
						return ("The void");
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
			return (roomName);
		}
		this.logger.error("/!\\ this part of code must not be executed");
		return ("The void");
	}

	async handleConnection(client: Socket)
	{
		let		roomName: string;

		const { handShake, token, error} = this.doHandShake(client);
		if (error === true || token === undefined || handShake === undefined)
			return ;
		const	profileId = token.profileId;
		const	gameModeRequest = handShake.gameMode;
		const	uuid = handShake.uuid;

		const	isActiveConnection = this.doesClientHaveActiveConnection(profileId);
		if (isActiveConnection === true)
		{
			this.logger.verbose("User disconnected: already have a connection");
			client.emit("matchmaking-state", {type: "already-connected"});
			client.disconnect();
			return ;
		}
		this.gameService.pushClientIdIntoSocketIdUsers(client.id, profileId);

		// The void equals error in this logic, just for fun @code
		roomName = "The void";
		switch (gameModeRequest)
		{
			case "friend":
				roomName = await this.dispatchMatchmakingFriend(profileId, client, uuid as string);
				break;
			case "classical":
				roomName = await this.dispatchMatchmakingClassical(profileId, client);
				break ;
			case "upside-down":
				roomName = await this.dispatchMatchmakingUpsideDown(profileId, client);
				break ;
			default:
				this.logger.error("Oops !!!");
				break;
		}
		if (roomName === "The void")
			return ;
		const indexUser = this.userService.user.findIndex((user) =>
		{
			return (user.id.toString() === profileId.toString());
		});
		if (indexUser !== -1)
		{
			const fileCfg = new FileConfig();
			this.userService.user[indexUser]
				.statusGameIcon = fileCfg.getAssetsConfig().statusGameOnline;
		}
		const	roomInfo = this.server.sockets.adapter.rooms.get(roomName);
		if (roomInfo)
		{
			const	userMessage: ActionSocket = {
				type: "",
				payload: {
					roomName: roomName,
					roomSize: roomInfo.size
				}
			};
			const indexInstance = this.gameService.findIndexGameInstanceByRoomName(roomName);
			if (this.gameService.isProfileIdUserOne(indexInstance, profileId))
				userMessage.type = "player-one";
			else
				userMessage.type = "player-two";
			client.emit("init-message", userMessage);
			const	instance = this.gameService.gameInstances[indexInstance];
			let	playerOnePicture: string;
				let	playerTwoPicture: string;
			const	userOne = this.userService.getUserById(instance.playerOne.profileId);
			if (userOne === undefined)
				playerOnePicture = "undefined";
			else
				playerOnePicture = userOne.avatar;
			const	userTwo = this.userService.getUserById(instance.playerTwo.profileId);
			if (userTwo === undefined)
				playerTwoPicture = "undefined";
			else
				playerTwoPicture = userTwo.avatar;
			const	action = {
				type: "connect",
				payload: {
					numberUsers: instance.userConnected,
					userReadyCount: instance.userReady,
					socketId: client.id,
					playerOneProfileId: instance.playerOne.profileId,
					playerTwoProfileId: instance.playerTwo.profileId,
					playerOnePicture: playerOnePicture,
					playerTwoPicture: playerTwoPicture
				}
			};
			this.server.to(roomName).emit("player-info", action);
		}
		else
		{
			this.logger.error("An error occured due to room info");
			// maybe disconnect
			return ;
		}
		this.logger.verbose("The user request game mode " + gameModeRequest);
	}

	handleDisconnect(client: Socket)
	{
		const	profileId = this.gameService.findProfileIdFromSocketId(client.id)?.profileId;
		if (profileId === undefined)
			this.logger.error("Profile id not found");
		const	userIndexState = this.userService.user.findIndex((elem: UserModel) =>
		{
			return (elem.id.toString() === profileId?.toString());
		});
		if (userIndexState !== -1)
		{
			const fileCfg = new FileConfig();
			this.userService.user[userIndexState].statusGameIcon = fileCfg.getAssetsConfig().statusGameOffline;
		}
		const	indexInstance = this.gameService.findIndexGameInstanceWithClientId(client.id);
		if (indexInstance === -1)
			this.logger.error("game instance not found for disconnect user");
		const	instance = this.gameService.gameInstances[indexInstance];
		if (instance.playerOne.socketId === client.id)
		{
			if (instance.playerOne.isReady === true)
			{
				instance.userReady -= 1;
				instance.playerOne.isReady = false;
			}
		}
		if (instance.playerTwo.socketId === client.id)
		{
			if (instance.playerTwo.isReady === true)
			{
				instance.userReady -= 1;
				instance.playerTwo.isReady = false;
			}
		}
		if (this.gameService.isProfileIdUserOne(indexInstance, profileId as string))
			this.gameService.gameInstances[indexInstance].playerOne.socketId = "disconnected";
		if (this.gameService.isProfileIdUserTwo(indexInstance, profileId as string))
			this.gameService.gameInstances[indexInstance].playerTwo.socketId = "disconnected";

		this.gameService.setGameActiveToFalse(indexInstance);
		instance.userConnected -= 1;
		// send the new number of users and users ready
		const	action = {
			type: "disconnect",
			payload: {
				numberUsers: instance.userConnected,
				userReadyCount: instance.userReady
			}
		};
		const	gameMode = instance.gameMode;
		if (gameMode === "classical" || gameMode === "upside-down" || gameMode === "friend")
		{
			const	playerOne = instance.playerOne;
			const	playerTwo = instance.playerTwo;
			if ((playerOne.socketId === "undefined" || playerOne.socketId === "disconnected")
				&& (playerTwo.socketId === "undefined" || playerTwo.socketId === "disconnected"))
			{
				this.logger.verbose("The game will be destroyed");
				const id = this.gameService.gameInstances.findIndex((game) =>
				{
					return (game.uuid === instance.uuid);
				});
				this.gameService.removeGameInstance(id);
				if (this.gameService.gameInstances.length === 0)
				{
					this.gameService.roomCount = 0;
				}
			}
		}
		if (instance.revoked)
		{
			// before data is erased 
			if (instance.userConnected === 0)
			{
				instance.revoked = false;
				const	idToErase = this.gameService.gameInstances.findIndex((game) =>
				{
					return (game.uuid === instance.uuid);
				});
				if (idToErase !== -1)
					this.gameService.gameInstances.splice(idToErase, 1);
				if (this.gameService.gameInstances.length === 0)
				{
					this.gameService.roomCount = 0;
				}
			}
		}

		const userIndex = this.gameService.findIndexSocketIdUserByClientId(client.id);
		this.gameService.removeOneSocketIdUserWithIndex(userIndex);
		const	idSocketReady = this.gameService.findIndexSocketIdReadyWithSocketId(client.id);
		this.gameService.removeOneSocketIdReadyWithIndex(idSocketReady);
		const game = this.gameService.findGameInstanceWithClientId(client.id);
		if (game)
		{
			this.logger.error("Test deeead code");
			this.server.to(game.roomName).emit("player-info", action);
		}
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
			return ;
		}
		const roomInfo = this.server.sockets.adapter.rooms.get(userRoom);
		if (!roomInfo)
		{
			return ;
		}
		const socketIdsInRoom = Array.from(roomInfo.keys());

		if (data.type === "ready")
		{
			const	search = this.gameService.findSocketIdReadyWithSocketId(client.id);
			if (search === undefined)
			{
				const	profileId = this.gameService.findProfileIdFromSocketId(client.id)?.profileId as string;
				const	indexInstance = this.gameService.gameInstances.findIndex((instance) =>
				{
					return (instance.playerOne.socketId === client.id || instance.playerTwo.socketId === client.id);
				});
				if (indexInstance === -1)
				{
					this.logger.error("ready state error");
				}
				else
				{
					const	instance = this.gameService.gameInstances[indexInstance];
					if (instance.playerOne.profileId === profileId && instance.playerOne.isReady === false)
					{
						instance.playerOne.isReady = true;
						instance.userReady += 1;
						this.gameService.pushClientIdIntoSocketIdReady(client.id, profileId);
						this.gameService.increaseUserReadyNumber();
					}
					if (instance.playerTwo.profileId === profileId && instance.playerTwo.isReady === false)
					{
						instance.playerTwo.isReady = true;
						instance.userReady += 1;
						this.gameService.pushClientIdIntoSocketIdReady(client.id, profileId);
						this.gameService.increaseUserReadyNumber();
					}
					const gameActive = (instance.userReady === 2) ? true : false;
					if (gameActive)
					{
						if (instance.loop)
							instance.loop.gameActive = true;
					}
					const	action = {
						type: "ready-player",
						payload: {
							userReadyCount: instance.userReady,
							gameActive: gameActive
						}
					};
					this.server.to(userRoom).emit("player-info", action);
					this.server.to(userRoom).emit("game-active", action);
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
