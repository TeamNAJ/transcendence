/* eslint-disable max-lines-per-function */
/* eslint-disable max-statements */
/* eslint-disable curly */
/* eslint-disable max-len */
import { Injectable, Logger } from "@nestjs/common";
import { GameService } from "src/game-socket/Game.service";
import { UserService } from "../user/user.service";
import { FilteredArrayModel } from "src/game-socket/GameSocketEvents";
import { profile } from "console";
import { constrainedMemory } from "process";
import GameServe from "src/game-socket/Objects/GameServe";

@Injectable()
export class GameApiService
{
	private readonly logger = new Logger("API-GAME");

	public constructor(
		private readonly	gameService: GameService,
		private readonly	userService: UserService
	)
	{
		this.logger.verbose("I am using game service with id:"
			+ this.gameService.getInstanceId());
	}

	public getInstanceId()
	{
		return (this.gameService.getInstanceId());
	}

	public	getGameServiceCopy() : any
	{
		return (this.gameService.getGameServiceCopy());
	}

	/**
	 * @deprecated invited with chat
	 * @param myProfileId 
	 * @param friendProfileId 
	 */
	public	inviteFriends(myProfileId: string, friendProfileId: string): any
	{
		// this.gameService.
	}

	public getCopyWithActiveSocketSetAsActive(array: GameServe[])
	{
		const	copy = [...array];

		for (const instance of array)
		{
			switch (instance.playerOne.socketId)
			{
				case "undefined":
				case "disconnected":
				case "invited":
				case "revoked":
					break ;
				default:
					instance.playerOne.socketId = "connected";
			}
			switch (instance.playerTwo.socketId)
			{
				case "undefined":
				case "disconnected":
				case "invited":
				case "revoked":
					break ;
				default:
					instance.playerTwo.socketId = "connected";
			}
		}
		return (copy);
	}

	public	getAllInstancesByUserId(profileId: string)
	{
		const deepCopyClassical = this.gameService
			.filterGameByProfileIdAndGameMode(profileId, "classical")
			.map((instance) =>
			{
				return (instance.getSeralizable());
			})
			.map((instance) =>
			{
				if (instance.playerOne.profileId.toString() !== "undefined")
				{
					instance.playerOne.avatar = this.userService.getUserById(instance.playerOne.profileId)?.avatar;
					instance.playerOne.username = this.userService.getUserById(instance.playerOne.profileId)?.username;
				}
				else
				{
					// this.logger.error("please fill a good picture for me player one");
					instance.playerOne.avatar = "https://source.unsplash.com/random?wallpapers";
					instance.playerOne.username = "wanted";
				}
				if (instance.playerTwo.profileId.toString() !== "undefined")
				{
					instance.playerTwo.avatar = this.userService.getUserById(instance.playerTwo.profileId)?.avatar;
					instance.playerTwo.username = this.userService.getUserById(instance.playerTwo.profileId)?.username;
				}
				else
				{
					// this.logger.error("please fill a good picture for me ");
					instance.playerTwo.avatar = "https://source.unsplash.com/random?wallpapers";
					instance.playerTwo.username = "wanted";
				}
				return (instance);
			});
		const	aliveClassicalGameMode = this.getCopyWithActiveSocketSetAsActive(deepCopyClassical);
		const	classicalArray = this.gameService.filterGameArrayBySocketState(profileId, aliveClassicalGameMode);

		const deepCopyUpsideDown = this.gameService
			.filterGameByProfileIdAndGameMode(profileId, "upside-down")
			.map((instance) =>
			{
				return (instance.getSeralizable());
			})
			.map((instance) =>
			{
				if (instance.playerOne.profileId.toString() !== "undefined")
				{
					instance.playerOne.avatar = this.userService.getUserById(instance.playerOne.profileId)?.avatar;
					instance.playerOne.username = this.userService.getUserById(instance.playerOne.profileId)?.username;
				}
				else
				{
					// this.logger.error("please fill a good picture for me player one");
					instance.playerOne.avatar = "https://source.unsplash.com/random?wallpapers";
					instance.playerOne.username = "wanted";
				}
				if (instance.playerTwo.profileId.toString() !== "undefined")
				{
					instance.playerTwo.avatar = this.userService.getUserById(instance.playerTwo.profileId)?.avatar;
					instance.playerTwo.username = this.userService.getUserById(instance.playerTwo.profileId)?.username;
				}
				else
				{
					// this.logger.error("please fill a good picture for me ");
					instance.playerTwo.avatar = "https://source.unsplash.com/random?wallpapers";
					instance.playerTwo.username = "wanted";
				}
				return (instance);
			});
		const	aliveUpsideDownGameMode = this.getCopyWithActiveSocketSetAsActive(deepCopyUpsideDown);
		const	upsideDownArray = this.gameService.filterGameArrayBySocketState(profileId, aliveUpsideDownGameMode);

		const deepCopyFriend = this.gameService
			.filterGameByProfileIdAndGameMode(profileId, "friend")
			.map((instance) =>
			{
				return (instance.getSeralizable());
			})
			.map((instance) =>
			{
				if (instance.playerOne.profileId.toString() !== "undefined")
				{
					instance.playerOne.avatar = this.userService.getUserById(instance.playerOne.profileId)?.avatar;
					instance.playerOne.username = this.userService.getUserById(instance.playerOne.profileId)?.username;
				}
				else
				{
					// this.logger.error("please fill a good picture for me player one");
					instance.playerOne.avatar = "https://source.unsplash.com/random?wallpapers";
					instance.playerOne.username = "wanted";
				}
				if (instance.playerTwo.profileId.toString() !== "undefined")
				{
					instance.playerTwo.avatar = this.userService.getUserById(instance.playerTwo.profileId)?.avatar;
					instance.playerTwo.username = this.userService.getUserById(instance.playerTwo.profileId)?.username;
				}
				else
				{
					// this.logger.error("please fill a good picture for me ");
					instance.playerTwo.avatar = "https://source.unsplash.com/random?wallpapers";
					instance.playerTwo.username = "wanted";
				}
				return (instance);
			});
		const	aliveFriendGameMode = this.getCopyWithActiveSocketSetAsActive(deepCopyFriend);
		const	friendArray = this.gameService.filterGameArrayBySocketState(profileId, aliveFriendGameMode);
		return (
			{
				classical: classicalArray.filtered,
				upsideDown: upsideDownArray.filtered,
				friend: friendArray.filtered
			}
		);
	}

	public findIndexGameInstanceUserProfileAndGameUuid(myProfileId: string, gameUuid: string)
	{
		return (
			this.gameService.findIndexGameInstanceUserProfileAndGameUuid(myProfileId, gameUuid)
		);
	}

	public	setUserRevokedInstance(myProfileId: string, indexInstance: number)
	{
		this.gameService.setUserRevokedInstance(myProfileId, indexInstance);
	}
}
