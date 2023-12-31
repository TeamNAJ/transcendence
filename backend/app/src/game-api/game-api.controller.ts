/* eslint-disable curly */
/* eslint-disable max-statements */
/* eslint-disable max-classes-per-file */
import {
	Body,
	Controller,
	Get,
	Logger,
	Param,
	Post,
	Req,
	UseGuards } from "@nestjs/common";
import { GameApiService } from "./game-api.service";
import { UserService } from "src/user/user.service";
import { UserAuthorizationGuard } from "../user/user.authorizationGuard";
import { IsNotEmpty, IsNumberString, IsUUID} from "class-validator";
import { PrismaService } from "src/prisma/prisma.service";

class InviteDto
{
	@IsNotEmpty()
	friend: string;
}

class RevokeTokenDto
{
	@IsNotEmpty()
	@IsUUID()
	uuid: string;
}

@Controller("api/game")
export class GameApiController
{
	private readonly logger = new Logger("api-game-controller");

	public constructor(
		private readonly gameApiService: GameApiService,
		private readonly userService: UserService,
		private readonly prismaService: PrismaService,
	)
	{
		this.logger.verbose("instanciating controller for Game api"
			+ "id: " + this.gameApiService.getInstanceId());
		this.logger.verbose("Using the userService with id : "
			+ this.userService.getUuidInstance());
	}

	@Get("/")
	getRoot()
	{
		return ({
			message: "the service is available but will be implemented asap"
		});
	}

	// debug
	@Get("/user-service")
	getDataFromUserService()
	{
		return (this.userService.getAllUserRaw());
	}

	// debug
	@Get("/instance/service/game")
	getGameServiceCopy()
	{
		return (this.gameApiService.getGameServiceCopy());
	}

	/**
	 * @deprecated not used final release
	 * @param friend 
	 * @returns 
	 */
	@Get("/invite/friends")
	// @UseGuards(UserAuthorizationGuard)
	inviteFriend(@Param("invited") friend: string)
	{
		return ("hello");
	}

	@Post("/instance/myActiveGame")
	@UseGuards(UserAuthorizationGuard)
	getMyActiveGame(
		@Req() req: any
	)
	{
		const data = this.gameApiService
			.getAllInstancesByUserId(req.user.id);
		// this.logger.verbose("User req id :" + req.user.id);
		return ({
			data: data
		});
	}

	@Post("/instance/revokeGame")
	@UseGuards(UserAuthorizationGuard)
	revokeGame(
		@Req() req: any,
		@Body() body: RevokeTokenDto): string
	{
		const indexGameInstance = this.gameApiService
			.findIndexGameInstanceUserProfileAndGameUuid(
				req.user.id, body.uuid
			);
		if (indexGameInstance !== -1)
		{
			this.gameApiService
				.setUserRevokedInstance(req.user.id, indexGameInstance);
		}
		return ("end");
	}
}
