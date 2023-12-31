/* eslint-disable curly */
/* eslint-disable no-dupe-class-members */
/* eslint-disable @typescript-eslint/adjacent-overload-signatures */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable init-declarations */
/* eslint-disable max-len */
/* eslint-disable max-lines-per-function */
/* eslint-disable max-statements */
/* eslint-disable max-classes-per-file */

import { Body, Controller, ForbiddenException, Get, HttpException, HttpStatus, Logger, Post, Req, Res, UnauthorizedException, UseGuards } from "@nestjs/common";
import { UserService } from "./user.service";
import { IsBoolean, IsEmail, IsNotEmpty } from "class-validator";
import { Request, Response } from "express";
import	Api from "../Api";
import { ApplicationUserModel, BackUserModel, ChatUserModel, UserLoginResponseModel, UserModel, UserPublicResponseModel, UserVerifyTokenResModel } from "./user.interface";
import { UserAuthorizationGuard } from "./user.authorizationGuard";
import * as dotenv from "dotenv";
import * as busboy from "busboy";
import * as fs from "fs";
import internal from "stream";
import FileConfig from "./Object/FileConfig";
import * as twilio from "twilio";
import Configuration from "src/Configuration";
import { ChatService } from "src/chat/Chat.service";
import { GameService, MatchHistoryModel } from "src/game-socket/Game.service";
import User from "src/chat/Objects/User";

type	ResponseRow = {
	id: number;
	date: string;
	gameMode: string,
	adversaire: string,
	myScore: string,
	advScore: string,
	elapsedTime: string,
	adversaireAvatar: string,
	myAvatar: string,
};

export class	RegisterStepOneDto
{
	@IsEmail()
	@IsNotEmpty()
	emailAddress: string;

	// minmax
	@IsNotEmpty()
	firstName: string;
	@IsNotEmpty()
	lastName: string;
	@IsNotEmpty()
	password: string;
	@IsNotEmpty()
	passwordConfirm: string;
	@IsNotEmpty()
	uniquenessPassword: "AgreeWithUniquenessOfPassword";
	@IsNotEmpty()
	username: string;
	@IsBoolean()
	ft: boolean;
}

class	RegisterDto
{
	@IsNotEmpty()
	code: string;
}

class	UserDoubleAuthDto
{
	// @IsNumberString()
	@IsNotEmpty()
	numero: string;
}
class UserLoginDto
{
	@IsNotEmpty()
	username: string;
	@IsNotEmpty()
	password: string;
}


class UserUploadPhotoDto
{
	@IsNotEmpty()
	image: any;
}


class	TwilioResponseDto
{
	@IsNotEmpty()
	// numero format +33
	To: string;
	// Channel = sms
	Channel: string;
}

@Controller("user")
export class UserController
{
	private	readonly logger;
	private	readonly env;

	constructor(
		private readonly userService: UserService,
		private readonly gameService: GameService,
		private	readonly chatService: ChatService
	)
	{
		this.logger = new Logger("user-controller");
		this.logger.log("instance UserService loaded with the instance id: " + this.userService.getUuidInstance());
		this.logger.log("instance ChatService loaded with the instance id: " + this.chatService.getChatInstanceId());
		this.env = dotenv.config();
		this.logger.log("instance GameService loaded with instance if : " + this.gameService.getInstanceId());
	}

	/**
	 * @deprecated
	 * @returns 
	 */
	@Get("all-user-Raw")
	getAllUsersRaw()
	{
		return (this.userService.getAllUserRaw());
	}

	@Post("register/step-one")
	@UseGuards(UserAuthorizationGuard)
	async getUserRegisterStepOne(
		@Body() body: RegisterStepOneDto,
		@Req() req: any,
		@Res() res: Response)
	{
		this.logger.verbose("Next information is the previous user");
		const	unauthorized = (errCode: number, info: string) =>
		{
			res.status(errCode).json(
				{
					message: "Unauthorized",
					info: info,
					error: true
				});
		};
		this.logger.verbose("Next information is the updated user");
		if (body.password !== body.passwordConfirm)
			return (unauthorized(401, "You are an hacker go off"), void(0));
		this.logger.verbose("password okay and are the same");
		const count = this.userService
			.getNumberOfUserWithUsername(body.username, req.user);
		if (count > 1)
			return (unauthorized(401, "Username already taken"), void(0));
		this.logger.verbose("username count okay");
		const user = req.user;
		if (body.ft && (body.emailAddress !== user.email
			|| body.firstName !== user.firstName
			|| body.lastName !== user.lastName))
			return (unauthorized(401, "You are an hacker go off"), void(0));
		this.logger.verbose("verification okay");
		this.logger.debug("Number of user with this username: " + count);
		const	update = await this.userService.updateUser(user.id, body, true);
		if (update === "ERROR")
			return (unauthorized(500, "try again later"), void(0));
		res.status(200).json({message: "okay"});
		const	updatedUser = this.userService.user
			.find((elem) =>
			{
				return (elem.id === user.id);
			});
		if (updatedUser !== undefined)
			this.userService.updateUserToDatabase(updatedUser);
		return (void(0));
	}

	@Post("register")
	getUserRegister(
		@Req() req: Request,
		@Body() body: RegisterDto,
		@Res() res: Response)
	{
		this.logger.log("A User want to register");
		if (!this.env)
			throw new Error(".env not found");
		if (!this.env.parsed)
			throw new Error(".env not parsed");
		if (!this.env.parsed.FT_UID
			|| !this.env.parsed.FT_SECRET)
			throw new Error("ft env var not found");
		let	retValue;
		let	userObject: UserModel;
		const	file = new Configuration();
		const	users = this.userService.getUserArray();
		const	dataAPI = new FormData();
		dataAPI.append("grant_type", "authorization_code");
		dataAPI.append("code", body.code);
		dataAPI.append("client_id", this.env.parsed.FT_UID);
		dataAPI.append("client_secret", this.env.parsed.FT_SECRET);
		dataAPI.append("redirect_uri", file.getRedirectURI());
		const config = {
			method: "post",
			maxBodyLength: Infinity,
			url: "https://api.intra.42.fr/oauth/token",
			data: dataAPI
		};
		Api()
			.request(config)
			.then((res) =>
			{
				const	data = res.data;
				const	newObject: ApplicationUserModel = {
					accessToken: data.access_token,
					tokenType: data.token_type,
					expiresIn: data.expires_in,
					refreshToken: data.refresh_token,
					scope: data.scope,
					createdAt: data.created_at,
					secretValidUntil: data.secret_valid_until
				};
				return (newObject);
			})
			.then((newObject : any) =>
			{
				const config = {
					method: "get",
					maxBodyLength: Infinity,
					url: "https://api.intra.42.fr/v2/me",
					headers: {
						"Authorization": "Bearer " + newObject.accessToken,
					}
				};
				Api()
				.request(config)
				.then(async (resData) =>
				{
					const	data = resData.data;
					const userTempCheck: UserModel | undefined = this.userService.getUserById(data.id);
					if (userTempCheck && userTempCheck.registrationProcessEnded === true)
					{
						this.logger.error("User Already registered");
						res.status(200).send("already registered");
					}
					else
					{
						const fileCfg = new FileConfig();
						userObject = {
							registrationProcessEnded: false,
							registrationStarted: true,
							ftApi: newObject,
							retStatus: resData.status,
							date: resData.headers.date,
							id: data.id,
							email: data.email,
							username: data.login,
							online: false,
							status: "offline",
							login: data.login,
							firstName: data.first_name,
							lastName: data.last_name,
							url: data.url,
							avatar: data.image?.link,
							ftAvatar: data.image,
							location: data.location,
							revokedConnectionRequest: false,
							authService:
							{
								token: "",
								expAt: 0,
								doubleAuth:
								{
									enable: false,
									lastIpClient: "undefined",
									phoneNumber: "undefined",
									phoneRegistered: false,
									validationCode: "undefined",
									valid: false,
								}
							},
							password: "undefined",
							friendsProfileId: [],
							achievements: [],
							statusChatIcon: fileCfg.getAssetsConfig().statusChatOffline,
							statusGameIcon: fileCfg.getAssetsConfig().statusGameOffline,
						};
						this.logger.log("Starting processing image");
						const newUserObj = await this.userService.downloadAvatar(userObject);
						retValue = await this.userService.register(newUserObj);
						await this.userService.createUserToDatabase(newUserObj)
						.then((data) =>
						{
							if (data === "ERROR")
							{
								this.logger.error("Client create a error");
							}
							else if (data === "SUCCESS")
							{
								this.logger.debug("Client create is a success");
							}
							else
							{
								this.logger.error("Logic error await/async ");
							}
						});
						res.status(200).send(retValue.res);
						this.logger.log("Ending processing image");
					}
				})
				.catch((error) =>
				{
					res.status(401).send({
						message: "Wrong usage of the api by the client, rejected",
						error: error
					});
				});
			})
			.catch((error) =>
			{
				this.logger.error("CODE ?");
				res.status(401).send({
					message: "wrong code provided",
					error: error,
				});
			});
	}

	/**
	 * @deprecated not inside the final release
	 */
	@Post("register-forty-three")
	getUserRegisterFortyThree(
		@Res() res: Response)
	{
		this.logger.log("A no 42 User want to register");
		let	retValue;

		let	profileId: number;
		profileId = Math.floor((Math.random() * 100000) + 1);
		while (!this.userService.isProfileIDUnique(profileId))
			profileId = Math.floor((Math.random() * 100000) + 1);
		const	fileCfg = new FileConfig();
		const	userObject:UserModel = {
			registrationProcessEnded: false,
			registrationStarted: true,
			ftApi: {
				accessToken: "undefined",
				tokenType: "undefined",
				expiresIn: "undefined",
				refreshToken: "undefined",
				scope: "undefined",
				createdAt: "undefined",
				secretValidUntil: "undefined"
			},
			retStatus: 200,
			date: "undefined",
			id: profileId,
			email: "undefined",
			username: "undefined",
			online: false,
			status: "offline",
			login: "undefined",
			firstName: "undefined",
			lastName: "undefined",
			url: "undefined",
			avatar: "https://thispersondoesnotexist.com/",
			ftAvatar: {
				link: "https://thispersondoesnotexist.com/",
				version: {
					large: "https://thispersondoesnotexist.com/",
					medium: "https://thispersondoesnotexist.com/",
					small: "https://thispersondoesnotexist.com/",
					mini: "https://thispersondoesnotexist.com/"
				}
			},
			location: "outer space",
			revokedConnectionRequest: false,
			authService:
			{
				token: "",
				expAt: 0,
				doubleAuth:
				{
					enable: false,
					lastIpClient: "undefined",
					phoneNumber: "undefined",
					phoneRegistered: false,
					validationCode: "undefined",
					valid: false,
				}
			},
			password: "undefined",
			friendsProfileId: [],
			achievements: [],
			statusChatIcon: fileCfg.getAssetsConfig().statusChatOffline,
			statusGameIcon: fileCfg.getAssetsConfig().statusGameOffline,
		};
		if (this.userService.getUserById(userObject.id) !== undefined)
		{
			res.status(400).json({error: "you are already register"});
		}
		else
		{
			this.logger.log("Starting register forty three user");
			retValue = this.userService.register(userObject);
			res.status(200).send(retValue.res);
			this.logger.log("Ending forty three user processing register");
		}
	}

	@Get("all-users")
	getAllUser()
		: UserModel[]
	{
		this.logger.verbose("request all users data");
		return (this.userService.getUserArray());
	}

	/**
	 * @returns the list of user filtered
	 */
	@Get("get-all-users")
	getAllUsers()
		: BackUserModel[]
	{
		return (this.userService.getBackUserModelArray());
	}

	@Post("login")
	async userLogin(
		@Body() body: UserLoginDto)
	: Promise<UserLoginResponseModel>
	{
		// update to db inside service checked
		return (await this.userService.login(body.username, body.password));
	}

	@Post("validate-registration")
	@UseGuards(UserAuthorizationGuard)
	userValidateRegistration(
		@Req() req: any,
		@Res() res: Response)
	{
		this.logger
			.log("'validate-registration' route requested with id: ", req.user.id);
		const isOK = this.userService.validateRegistration(req.user.id);
		if (isOK)
			res.status(200).send("ok");
		else
			res.status(401).send("Not ok");
	}


	// Our token 
	@Post("verify-token")
	@UseGuards(UserAuthorizationGuard)
	verifyToken(@Req() headers: any)
		: UserVerifyTokenResModel
	{
		this.logger
			.log("'verify-token' route request");
		const	response: UserVerifyTokenResModel = {
			message: "Successfully verified token",
			statusCode: 200
		};
		return (response);
	}

	@Get("my-info")
	@UseGuards(UserAuthorizationGuard)
	getMyInfo(@Req() req: any)
		: UserPublicResponseModel
	{
		// NEED TO FIND A WAY TO KNOW THE USER ID
		return (this.userService.getMyInfo(req.user.id));
	}

	@Post("double-auth")
	@UseGuards(UserAuthorizationGuard)
	GetTheNumber(
		@Body() data: UserDoubleAuthDto,
		@Req() req: any)
		: string
	{
		this.logger
			.log("'double-auth' route request");
		return (this.userService.registerPhoneNumber(data.numero, req.user.id));
	}

	@Post("double-auth-twilio")
	@UseGuards(UserAuthorizationGuard)
	DoubleAuthSendSMS(
		@Body() body: any,
		@Req() req: any,
		@Res() res: Response
	)
	{
		if (!this.env)
		{
			res.status(400).send("env not found");
			return ;
		}
		if (!this.env.parsed)
		{
			res.status(400).send("env not parsed");
			return ;
		}
		if (!this.env.parsed.TWILIO_ACCOUNT_SID
			|| !this.env.parsed.TWILIO_AUTH_TOKEN
			|| !this.env.parsed.TWILIO_VERIFY_SERVICE_SID)
		{
			res.status(400).send("env var not ok");
			return ;
		}
		if (body.numero === "undefined" || !body.numero)
		{
			res.status(400).send("number not found");
			return ;
		}
		const client = twilio(this.env.parsed.TWILIO_ACCOUNT_SID, this.env.parsed.TWILIO_AUTH_TOKEN);
		client.verify.v2
		.services(this.env.parsed.TWILIO_VERIFY_SERVICE_SID)
		.verifications.create({
			to: body.numero,
			channel: "sms" })
		.then((verification) =>
		{
			console.log("verified");
		})
		.catch((error) =>
		{
			console.error("Boo", error);
		})
		.finally(() =>
		{
			console.log("Verified end");
		});
	}

	@Post("login-receive-code")
	@UseGuards(UserAuthorizationGuard)
	loginSendSMS(
		@Body() body: any,
		@Req() req: any,
		@Res() res: Response
	)
	{
		if (!this.env)
		{
			res.status(400).send("env not found");
			return ;
		}
		if (!this.env.parsed)
		{
			res.status(400).send("env not parsed");
			return ;
		}
		if (!this.env.parsed.TWILIO_ACCOUNT_SID
			|| !this.env.parsed.TWILIO_AUTH_TOKEN
			|| !this.env.parsed.TWILIO_VERIFY_SERVICE_SID)
		{
			res.status(400).send("env var not ok");
			return ;
		}
		const	number = this.userService.getPhoneNumber(body.profileId);
		if (number === "undefined" || number === undefined)
		{
			res.status(400).send("number not found");
			return ;
		}
		const client = twilio(this.env.parsed.TWILIO_ACCOUNT_SID, this.env.parsed.TWILIO_AUTH_TOKEN);
		client.verify.v2
		.services(this.env.parsed.TWILIO_VERIFY_SERVICE_SID)
		.verifications.create({
			to: number,
			channel: "sms" })
		.then((verification) =>
		{
			console.log("verified");
		})
		.catch((error) =>
		{
			console.error("Boo", error);
		})
		.finally(() =>
		{
			console.log("End of verification");
		});
	}

	@Post("get-code")
	@UseGuards(UserAuthorizationGuard)
	GetValidationCode(
		@Body() body: any,
		@Req() req: any,
		@Res() res: Response
	)
	{
		if (body.otpCode === undefined)
			throw new UnauthorizedException();
		if (!this.env)
			throw new Error(".env not found");
		if (!this.env.parsed)
			throw new Error(".env not parsed correctly");
		if (!this.env.parsed.TWILIO_ACCOUNT_SID
			|| !this.env.parsed.TWILIO_AUTH_TOKEN
			|| !this.env.parsed.TWILIO_VERIFY_SERVICE_SID)
			throw new Error("twilio env variables not found");
		const	number = body.to;
		if (number === "undefined" || number === undefined)
			throw new Error("phone number not found");
		const	client = twilio(this.env.parsed.TWILIO_ACCOUNT_SID, this.env.parsed.TWILIO_AUTH_TOKEN);
		const	verify = this.env.parsed.TWILIO_VERIFY_SERVICE_SID;
		if (verify === undefined)
			throw new Error("twilio verify env var not found");
		client.verify.v2
			.services(verify)
			.verificationChecks.create(
				{
					to: number,
					code: body.otpCode
				})
			.then((verificationCheck) =>
			{
				if (verificationCheck.status === "approved")
				{
					res.send(true);
					return (this.userService.codeValidated(body.otpCode, req.user.id, true));
				}
				else
					throw new UnauthorizedException();
			})
			.catch(() =>
			{
				throw new Error("Connection to twilio failed");
			});
	}

	@Post("login-get-code")
	@UseGuards(UserAuthorizationGuard)
	loginGetCode(
		@Body() body: any,
		@Req() req: any,
		@Res() res: Response
	)
	{
		if (body.otpCode === undefined)
			throw new UnauthorizedException();
		if (!this.env)
			throw new Error(".env not found");
		if (!this.env.parsed)
			throw new Error(".env not parsed correctly");
		if (!this.env.parsed.TWILIO_ACCOUNT_SID
			|| !this.env.parsed.TWILIO_AUTH_TOKEN
			|| !this.env.parsed.TWILIO_VERIFY_SERVICE_SID)
			throw new Error("twilio env variables not found");
		const	number = this.userService.getPhoneNumber(body.profileId);
		if (number === "undefined" || number === undefined)
			throw new Error("phone number not found");
		const	client = twilio(this.env.parsed.TWILIO_ACCOUNT_SID, this.env.parsed.TWILIO_AUTH_TOKEN);
		const	verify = this.env.parsed.TWILIO_VERIFY_SERVICE_SID;
		if (verify === undefined)
			throw new Error("twilio verify env var not found");
		client.verify.v2
			.services(verify)
			.verificationChecks.create(
				{
					to: number,
					code: body.otpCode
				})
			.then((verificationCheck) =>
			{
				if (verificationCheck.status === "approved")
				{
					res.send(true);
					return (this.userService.codeValidated(body.otpCode, req.user.id, true));
				}
				else
					throw new UnauthorizedException();
			})
			.catch(() =>
			{
				throw new Error("Twilio connection failed");
			});
	}

	@Post("/update-photo")
	@UseGuards(UserAuthorizationGuard)
	async updatePhoto(
		@Req() req: any,
		@Res() res: Response,
		@Body() body: any)
	{
		this.logger.log("start update photo");
		try
		{
			const	busboyConfig = {
				headers: req.headers,
				limits:
				{
					fileSize: 10 * 1024 * 1024
				}
			};

			const	fileCfg = new FileConfig();
			fileCfg.setTempFolder(this.userService.getConfig().tmpFolder);
			fileCfg.setFilename(req.user.username);
			const bb = busboy(busboyConfig);
			const	processBusboy = (): Promise<string> =>
			{
				this.logger.debug("start the busboy event listener");
				return (
					new Promise<string>((resolve, reject)=>
					{
						bb.on("file", async (name: string, file: internal.Readable, info: busboy.FileInfo) =>
						{
							const	{ filename, encoding, mimeType } = info;

							fileCfg.configMimeType(mimeType);
							if (!fileCfg.isAccepted())
								reject(new HttpException("Unsupported Media Type", HttpStatus.UNSUPPORTED_MEDIA_TYPE));
							file.on("data", (data) =>
							{
								fileCfg.addToBuffer(data);
							});
							file.on("end", () =>
							{
								resolve(fileCfg.fullPath());
							});
						});
						bb.on("error", (error) =>
						{
							reject(error);
						});
						req.pipe(bb);
					})
				);
			};
			await processBusboy().then((filename) =>
			{
				this.logger.verbose(filename);
				try
				{
					fs.writeFileSync(fileCfg.fullPath(), fileCfg.getBuffer());
				}
				catch (error)
				{
					return (res.status(418).json({error: true}));
				}
				return (fileCfg.fullPath());
			})
			.catch((error) =>
			{
				res.status(418).json({error: true});
				return ;
			});
			await this.userService.uploadPhoto(fileCfg, req.user);
			res.status(200).json({message: "Success"});
			const searchedUser = this.userService.user.find((elem) =>
			{
				return (elem.id.toString() === req.user.id.toString());
			});
			if (searchedUser)
			{
				searchedUser.avatar = fileCfg.getCDNConfig().avatar;
				searchedUser.ftAvatar = fileCfg.getCDNConfig().ftAvatar;
				this.logger.verbose(searchedUser.avatar);
				this.userService.updateUserToDatabase(searchedUser);
				
			}
		}
		catch (error)
		{
			res.status(418).json({error: true});
		}
	}

	@Post("change-infos")
	@UseGuards(UserAuthorizationGuard)
	ChangeUsername(
		@Body() data: any,
		@Req() req: any)
		: string
	{
		this.logger
			.log("'change-infos' user route request");
		const	chatUsers = this.chatService.changeInfos(data, req.user.id);
		const	users = this.userService.changeInfos(data, req.user.id);
		if (chatUsers === "user doesnt exist" || users === "user doesnt exist")
			return ("user doesnt exist");
		return ("okay");
	}

	@Post("revoke-token")
	@UseGuards(UserAuthorizationGuard)
	RevokeToken(@Req() req: any)
	{
		this.userService.revokeTokenById(req.user.id);
		return ("token revoked");
	}

	/**
	 * @deprecated
	 * @param body 
	 * @param req 
	 * @returns 
	 */
	@Post("hash-password")
	@UseGuards(UserAuthorizationGuard)
	HashPassword(
		@Body() body: any,
		@Req() req: any)
	: string
	{
		this.logger
			.log("'hash-password' route requested");
		if (req.user.id !== body.id)
			throw new ForbiddenException();
		this.userService.hashPassword(body.password, body.id);
		return ("okay");
	}

	@Post("add-friend")
	@UseGuards(UserAuthorizationGuard)
	async AddFriend(
		@Body() body: any,
		@Req()	req: any
	)
	{
		this.logger
			.log("'add-friend' route requested");
		return (await this.userService.addUserAsFriend(body.friendId, req.user.id));
	}
	
	@Post("/my-stats")
	@UseGuards(UserAuthorizationGuard)
	getMyStats(@Req() req: any)
	{
		// return (["toto"]);
		const	myStats = this.gameService.matchHistory.filter((record: MatchHistoryModel) =>
		{
			return (
				record.playerOneProfileId === (req.user.id)
				|| record.playerTwoProfileId === (req.user.id)
			);
		});
		const	array: ResponseRow[] = [];

		myStats.map((stat: MatchHistoryModel, index: number) =>
		{
			const	amIPlayOne = stat.playerOneProfileId === req.user.id;
			const	frameCount = stat.frameCount as number;
			const	frameRate = stat.frameRate as number;
			let		adversaireProfileId: string;

			const	elem: ResponseRow = {
				id: index,
				date: stat.date,
				gameMode: stat.gameMode,
				adversaire: "unset",
				advScore: "unset",
				elapsedTime: (frameCount / frameRate) + " secondes",
				myScore: "unset",
				adversaireAvatar: "unset",
				myAvatar: "unset"
			};
			if (amIPlayOne)
			{
				adversaireProfileId = stat.playerTwoProfileId as string;
				elem.advScore = stat.scorePlayerTwo.toString();
				elem.myScore = stat.scorePlayerOne.toString();
			}
			else
			{
				adversaireProfileId = stat.playerOneProfileId as string;
				elem.advScore = stat.scorePlayerOne.toString();
				elem.myScore = stat.scorePlayerTwo.toString();
			}
			const userAdversaire = this.userService.getUserById(adversaireProfileId);
			if (userAdversaire === undefined)
				elem.adversaire = "Deleted user";
			else
			{
				elem.adversaire = userAdversaire.username;
				elem.adversaireAvatar = userAdversaire.avatar;
			}
			elem.myAvatar = req.user.avatar;
			array.push(elem);
		});
		return (array);
	}

	@Post("/stats")
	@UseGuards(UserAuthorizationGuard)
	getStats(@Body() body: any)
	{
		const	userStats = this.gameService.matchHistory.filter((record: MatchHistoryModel) =>
		{
			return (
				record.playerOneProfileId?.toString() === body.userProfileId
				|| record.playerTwoProfileId?.toString() === body.userProfileId
			);
		});
		const	array: ResponseRow[] = [];

		userStats.map((stat: MatchHistoryModel, index: number) =>
		{
			const	isPlayOne = stat.playerOneProfileId?.toString() === body.userProfileId;
			const	frameCount = stat.frameCount as number;
			const	frameRate = stat.frameRate as number;
			let		adversaireProfileId: string;

			const	elem: ResponseRow = {
				id: index,
				date: stat.date,
				gameMode: stat.gameMode,
				adversaire: "unset",
				advScore: "unset",
				elapsedTime: (frameCount / frameRate) + " secondes",
				myScore: "unset",
				adversaireAvatar: "unset",
				myAvatar: "unset"
			};
			if (isPlayOne)
			{
				adversaireProfileId = stat.playerTwoProfileId as string;
				elem.advScore = stat.scorePlayerTwo.toString();
				elem.myScore = stat.scorePlayerOne.toString();
			}
			else
			{
				adversaireProfileId = stat.playerOneProfileId as string;
				elem.advScore = stat.scorePlayerOne.toString();
				elem.myScore = stat.scorePlayerTwo.toString();
			}
			const userAdversaire = this.userService.getUserById(adversaireProfileId);
			if (userAdversaire === undefined)
				elem.adversaire = "Deleted user";
			else
			{
				elem.adversaire = userAdversaire.username;
				elem.adversaireAvatar = userAdversaire.avatar;
			}
			elem.myAvatar = body.userAvatar;
			array.push(elem);
		});
		return (array);
	}

	@Post("/global-stats")
	@UseGuards(UserAuthorizationGuard)
	getAllStats(@Body() body: any)
	{
		const	userStats = this.gameService.matchHistory;
		const	array: ResponseRow[] = [];
		const	users = this.userService.getAllUserRaw();
		userStats.map((stat: MatchHistoryModel, index: number) =>
		{
			const	searchPlayerOne = users.find((elem) =>
			{
				return (elem.id.toString() === stat.playerOneProfileId?.toString());
			});
			const	searchPlayerTwo = users.find((elem) =>
			{
				return (elem.id.toString() === stat.playerTwoProfileId?.toString());
			});
			if (searchPlayerOne !== undefined && searchPlayerTwo !== undefined)
			{
				const	frameCount = stat.frameCount as number;
				const	frameRate = stat.frameRate as number;
				const	elem: ResponseRow = {
					id: index,
					date: stat.date,
					gameMode: stat.gameMode,
					adversaire: stat.playerTwoProfileId as string,
					advScore: stat.scorePlayerTwo.toString(),
					elapsedTime: (frameCount / frameRate) + " secondes",
					myScore: stat.scorePlayerOne.toString(),
					adversaireAvatar: searchPlayerTwo.avatar,
					myAvatar: searchPlayerOne.avatar
				};
				array.push(elem);
			}
		});
		return (array);
	}

	@Get("/get-user-back")
	@UseGuards(UserAuthorizationGuard)
	getUserBackFromDB(
		@Res() res: Response,
		@Req() req: any)
	{
		const	data = this.userService.getUserBackFromDB(req.user.id);
		if (data === "error")
			res.status(400).send("User not found");
		else
			res.status(201).send(data);
	}

	@Post("user-playing")
	@UseGuards(UserAuthorizationGuard)
	async GetPlayingStatus(@Req() req: any)
	{
		this.logger.log("'user-playing' route requested");
		// let	playing: boolean;
		const playing = false;
		// this.chatService.updateStatus(this.gameService);
		this.userService.updateStatus(this.gameService);
		const	chatUsers: any[] = [];
		this.chatService.chat.users.map((elem) =>
		{
			if (elem.profileId.toString() !== req.user.id.toString())
			{
				const	usr = {
					name: elem.name,
					profileId: elem.profileId,
					online: elem.online,
					status: elem.status,
					avatar: elem.avatar,
					id: elem.id,
				};
				chatUsers.push(usr);
			}
		});
		return (chatUsers);
	}

	@Post("/get-achievements")
	@UseGuards(UserAuthorizationGuard)
	getAchievements(
		@Body() body: any,
		@Req() req: any)
	{
		let	res;
		if (body.id === "myself")
			res = this.userService.getAchievements(req.user.id);
		else
			res = this.userService.getAchievements(body.id);
		console.log("ICI ACHIEVEMENTS", res);
		return (res);
	}
}
