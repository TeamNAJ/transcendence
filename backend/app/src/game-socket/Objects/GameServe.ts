/* eslint-disable max-lines-per-function */
/* eslint-disable max-statements */
import Player from "./Player";
import Board from "./Board";
import Ball from "./Ball";
import Net from "./Net";

class GameServe
{
	public uuid: number | undefined;
	public frameRate: number | undefined;
	public frameCount: number | undefined;
	public playerOne: Player;
	public playerTwo: Player;
	public board: Board;
	public ball: Ball;
	public net: Net;
	public scoreLimit: number;
	public actionKeyPress: number;
	public startDisplayed: boolean;
	public continueAnimating: boolean;
	public displayStartMessage: () => void;
	public displayEndMessage: () => void;
	public initPlayers: () => void;

	public constructor()
	{
		this.uuid = undefined;
		this.frameRate = 30;
		this.frameCount = 0;
		this.playerOne = new Player();
		this.playerTwo = new Player();
		this.board = new Board();
		this.ball = new Ball();
		this.net = new Net();
		this.actionKeyPress = -1;
		this.scoreLimit = 7;
		this.startDisplayed = true;
		this.continueAnimating = true;

		this.initPlayers = () =>
		{
			this.playerOne.game = this;
			this.playerTwo.game = this;
			this.playerOne.racket.game = this;
			this.playerOne.side = "left";
			this.playerTwo.racket.game = this;
			this.playerTwo.side = "right";
			const border = this.board.dim.width * 0.01;
			this.playerOne.pos.x = border;
			this.playerOne.pos.y = this.board.dim.height / 2;
			this.playerOne.racket.defineRacketSize();
			this.playerOne.pos.y -= this.playerOne.racket.dim.height / 2;
			this.playerTwo.racket.dim = this.playerOne.racket.dim;
			this.playerTwo.pos.x = this.board.dim.width - border
				- this.playerTwo.racket.dim.width;
			this.playerTwo.pos.y = this.board.dim.height / 2;
			this.playerTwo.racket.defineRacketSize();
			this.playerTwo.pos.y -= this.playerTwo.racket.dim.height / 2;
		};
	}
}

export default GameServe;