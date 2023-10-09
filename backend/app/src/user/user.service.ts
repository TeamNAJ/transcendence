/* eslint-disable max-statements */
/* eslint-disable max-lines-per-function */
import
{
	BadRequestException,
	ForbiddenException,
	Injectable,
	InternalServerErrorException,
	Logger
} from "@nestjs/common";
import
{
	AdminResponseModel,
	UserLoginResponseModel,
	UserModel,
	UserRegisterResponseModel,
} from "./user.interface";
import { v4 as uuidv4 } from "uuid";
import User from "src/chat/Objects/User";

import { randomBytes } from "crypto";
import	* as jwt from "jsonwebtoken";

@Injectable()
export class UserService
{
	private	user: Array<UserModel> = [];
	private	secret = randomBytes(64).toString("hex");
	private readonly logger = new Logger("user-service itself");
	private readonly uuidInstance = uuidv4();

	public constructor()
	{
		this.logger.log("Base instance loaded with the instance id: "
			+ this.getUuidInstance());
	}

	public	getUuidInstance(): string
	{
		return (this.uuidInstance);
	}

	public	getUserArray(): Array<UserModel>
	{
		return (this.user);
	}

	public	getAdminArray(): AdminResponseModel
	{
		const	modifiedArray = this.user.map((elem) =>
		{
			return ({
				...elem,
				password: "[hidden information]"
			});
		});
		const	response = {
			numberOfClient: this.user.length,
			array: modifiedArray
		};
		return (response);
	}

	public	getSecret() : string
	{
		return (this.secret);
	}

	public	register(data: UserModel)
		: {res: UserRegisterResponseModel, toDB: UserModel}
	{
		const	searchUser = this.user.find((user) =>
		{
			return (user.id === data.id);
		});
		if (searchUser === undefined)
		{
			const newUser: UserModel = {
				ftApi: data.ftApi,
				retStatus: data.retStatus,
				date: data.date,
				id: data.id,
				email: data.email,
				login: data.login,
				firstName: data.firstName,
				lastName: data.lastName,
				url: data.url,
				avatar: data.avatar,
				location: data.location,
				revokedConnectionRequest: data.revokedConnectionRequest,
				// uuid: data.uuid,
				// // TEST anonymous user pw
				// password: data.password,
				// createdAt: data.createdAt,
				authService:
				{
					token: "Bearer " + jwt.sign(
						{
							id: data.id,
							mail: data.email
						},
						this.secret,
						{
							expiresIn: "1d"
						}
					),
					expAt: Date.now() + (1000 * 60 * 60 * 24),
					doubleAuth:
					{
						lastIpClient: "undefined",
						phoneNumber: "undefined",
						phoneRegistered: false,
						validationCode: "undefined",
						valid: false,
					}
				}
			};
			this.user.push(newUser);
			const	response: UserRegisterResponseModel = {
				message: "Your session has been created, you must loggin",
				token: newUser.authService.token,
				statusCode: newUser.retStatus
			};
			console.log("user service newUser 78: ", newUser);
			console.log(" ");
			console.log("user service response 79: ", response);
			return (
			{
				res: response,
				toDB: newUser
			});
		}
		else
			throw new BadRequestException("UUID already exists");
	}

	public	login(id: any, email:string)
		: UserLoginResponseModel
	{
		const	searchUser = this.user.find((user) =>
		{
			return (user.id.toString() === id.toString()
				&& user.email === email);
		});
		if (searchUser === undefined)
			throw new ForbiddenException("Invalid credential");
		else

			searchUser.authService.token = "Bearer " + jwt.sign(
				{
					id: searchUser.id,
					mail: searchUser.email
				},
				this.secret,
				{
					expiresIn: "1d"
				}
			);

			const	response: UserLoginResponseModel = {
				message:
					"You are successfully connected as " + searchUser.login,
				token: searchUser.authService.token,
				expireAt: searchUser.authService.expAt
			};
			return (response);
	}

	public	userIdentifiedRequestEndOfSession(id: any)
	{
		const	user = this.user.find((user) =>
		{
			return (user.id.toString() === id.toString());
		});
		if (!user)
			throw new InternalServerErrorException();
		if (user.revokedConnectionRequest === false)
			throw new InternalServerErrorException();
		user.authService.token = "no token";
		user.revokedConnectionRequest = false;
		return (false);
	}

	public revokeTokenById(id: any)
	{
		const	user = this.user.find((user) =>
		{
			return (user.id.toString() === id.toString());
		});
		if (!user)
			throw new InternalServerErrorException();
		user.revokedConnectionRequest = true;
	}

	public	getUserById(id: any)
		: UserModel | undefined
	{
		const	response = this.user.find((user) =>
		{
			return (id.toString() === user.id.toString());
		});
		return (response);
	}

	public	verifyToken(token: string)
		: string
	{
		const	searchUser = this.user.findIndex((elem) =>
		{
			return (elem.authService.token === token);
		});
		if (searchUser !== undefined)
			return ("TOKEN OK");
		return ("TOKEN NOT OK");
	}
}