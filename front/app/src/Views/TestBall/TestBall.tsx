/* eslint-disable no-alert */
/* eslint-disable max-len */
/* eslint-disable curly */
/* eslint-disable max-lines-per-function */
/* eslint-disable max-statements */
import { useEffect, useRef, useState } from "react";

import Game from "./Objects/Game";

import MenuBar from "../../Component/MenuBar/MenuBar";

import { io } from "socket.io-client";
import ConnectState from "./Component/ConnectState";
import { motion } from "framer-motion";
import { useAppDispatch, useAppSelector } from "../../Redux/hooks/redux-hooks";
import {
	setBallPosition,
	setBoardDimension,
	setFrameNumber,
	setNumberOfUsers,
	setPlOneSocket,
	setPlTwoSocket,
	setPlayerOnePos,
	setPlayerTwoPos,
	setPlOneScore,
	setPlTwoScore,
	setReadyPlayerCount,
	setScaleServer,
	setServerDimension,
	setPlayerOneProfileId,
	setPlayerTwoProfileId,
	setPlayerOnePicture,
	setPlayerTwoPicture,
	setConnectedStore,
	setGameOver,
	setGameFace
} from "../../Redux/store/gameEngineAction";
import { useLocation, useNavigate } from "react-router-dom";
import getGameMode from "./extra/queryParamsMode";
import WaitingActive from "./Component/WaitingActive";
import { Typography } from "@mui/material";
// import {
// 	Backdrop,
// 	Alert,
// 	Typography,
// 	Card,
// 	Box,
// 	CardContent,
// 	IconButton
// } from "@mui/material";
// import { useTheme } from "@emotion/react";
// import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
// import CardMedia from "@mui/material/CardMedia";
// import pong from "./assets/pong.jpeg";
// import WaitingActive from "./Component/WaitingActive";
type	ActionSocket = {
	type: string,
	payload?: any
};

const	TestBall = () =>
{
	const	query = useLocation();
	const	gameMode = getGameMode(query);
	const	navigate = useNavigate();
	const	profileToken = useAppSelector((state) =>
	{
		return (state.controller.user.bearerToken);
	});

	/* local state */
	const
	[
		readyPlayer,
		setReadyPlayer
	] = useState(false);

	/* local state */
	const
	[
		connected,
		setConnected
	] = useState(false);

	const
	[
		gameActive,
		setGameActive
	] = useState(false);


	const	dispatch = useAppDispatch();

	const	theServer = useAppSelector((state) =>
	{
		return (state.gameEngine.server);
	});

	const theBoard = useAppSelector((state) =>
	{
		return (state.gameEngine.board);
	});

	const	url = useAppSelector((state) =>
	{
		return (state.server.uri + ":3000");
	});

	const	socketRef = useRef<SocketIOClient.Socket | null>(null);
	const	game = new Game("front");
	const	gameRef = useRef<Game>(game);
	gameRef.current = game;
	game.board.game = game;
	game.ball.game = game;
	game.net.game = game;
	const	canvasRef = useRef<HTMLCanvasElement>(null);
	game.board.canvasRef = canvasRef;

	useEffect(() =>
	{
		const socket = io(url,
		{
			path: "/socket-game/random",
			autoConnect: false,
			reconnectionAttempts: 5,
			auth:
			{
				token: profileToken,
				mode: gameMode.mode,
				uuid: gameMode.uuid
			}
		});

		socketRef.current = socket;
		game.board.socket = socketRef.current;

		const connect = () =>
		{
			const	action = {
				type: "GET_BOARD_SIZE"
			};
			socket.emit("info", action);
			setConnected(true);
			dispatch(setConnectedStore(true));
		};

		const disconnect = () =>
		{
			setConnected(false);
			dispatch(setConnectedStore(false));
		};

		const	connectError = (_error: Error) =>
		{
			navigate("/stats");
		};

		const	updateGame = (data: any) =>
		{
			if (data.type === "game-data")
			{
				dispatch(setFrameNumber(data.payload.frameNumber));
				dispatch(
					setBallPosition(
						data.payload.ballPos.x,
						data.payload.ballPos.y
					)
				);
				dispatch(
					setPlayerOnePos(
						(data.payload.playerOne.pos.x),
						(data.payload.playerOne.pos.y)
					)
				);
				dispatch(
					setPlayerTwoPos(
						(data.payload.playerTwo.pos.x),
						(data.payload.playerTwo.pos.y)
					)
				);
				dispatch(
					setPlOneScore(data.payload.plOneScore)
				);
				dispatch(
					setPlTwoScore(data.payload.plTwoScore)
				);
				dispatch(
					setGameFace(data.payload.whichFace)
				);
			}
		};

		const	initServerDim = (data: ActionSocket) =>
		{
			const	serverBoardDim = data.payload.serverBoardDim;
			dispatch(
				setServerDimension(
					serverBoardDim.width,
					serverBoardDim.height
				)
			);
			const	ratioWidth = serverBoardDim.width / game.board.dim.width;
			const	ratioHeight = serverBoardDim.height / game.board.dim.height;
			dispatch(
				setBoardDimension(
					game.board.dim.width,
					game.board.dim.height
				)
			);
			dispatch(
				setScaleServer(
					ratioWidth,
					ratioHeight
				)
			);
		};

		const	playerInfo = (data: any) =>
		{
			switch (data.type)
			{
				case "connect":
					dispatch(setNumberOfUsers(data.payload.numberUsers));
					dispatch(setReadyPlayerCount(data.payload.userReadyCount));
					if (game.playerOne.socketId === undefined)
					{
						game.playerOne.socketId = data.payload.socketId;
						dispatch(setPlOneSocket(data.payload.socketId));
					}
					else if (game.playerOne.socketId
								&& game.playerTwo.socketId === undefined)
					{
						game.playerTwo.socketId = data.payload.socketId;
						dispatch(setPlTwoSocket(data.payload.socketId));
					}
					dispatch(
						setPlayerOneProfileId(data.payload.playerOneProfileId)
					);
					dispatch(
						setPlayerTwoProfileId(data.payload.playerTwoProfileId)
					);
					dispatch(
						setPlayerOnePicture(data.payload.playerOnePicture)
					);
					dispatch(
						setPlayerTwoPicture(data.payload.playerTwoPicture)
					);
					break ;
				case "disconnect":
					dispatch(setNumberOfUsers(data.payload.numberUsers));
					dispatch(setReadyPlayerCount(data.payload.userReadyCount));
					break ;
				case "ready-player":
					dispatch(setReadyPlayerCount(data.payload.userReadyCount));
					break ;
				default:
					break ;
			}
		};

		const	sendInitMessageToPlayers = (data: any) =>
		{
			let text: string;
			text = "";
			switch (data.type)
			{
				case "player-one":
					text = "You are player one in " + data.payload.roomName;
					break ;
				case "player-two":
					text = "You are player two in " + data.payload.roomName;
					break ;
				case "visitor":
					text = "You are a visitor";
					break ;
				default:
					break ;
			}
			game.renderInitMessage(text);
		};

		const	activateGame = (data: any) =>
		{
			dispatch(setGameOver(false));
			setGameActive(data.payload.gameActive);
		};

		const	matchmakingState = (data: any) =>
		{
			// please make me design
			let	time: any;

			time = undefined;
			if (data.type === "already-connected")
			{
				navigate("/my-active-games");
			}
			if (data.type === "the-end")
			{
				dispatch(setGameOver(true));
				time = setTimeout(() =>
				{
					navigate("/game-setup");
				}, 4000);
			}
			if (data.type === "abandon")
			{
				// socket.disconnect();
				navigate("/stats");
			}
			return (() =>
			{
				if (time !== undefined)
					clearTimeout(time);
			});
		};

		socket.on("connect", connect);
		socket.on("disconnect", disconnect);
		socket.on("error", connectError);
		socket.on("game-event", updateGame);
		socket.on("info", initServerDim);
		socket.on("player-info", playerInfo);
		socket.on("init-message", sendInitMessageToPlayers);
		socket.on("game-active", activateGame);
		socket.on("matchmaking-state", matchmakingState);
		socket.connect();

		return (() =>
		{
			socket.off("connect", connect);
			socket.off("disconnect", disconnect);
			socket.off("error", connectError);
			socket.off("game-event", updateGame);
			socket.off("info", initServerDim);
			socket.off("player-info", playerInfo);
			socket.off("init-message", sendInitMessageToPlayers);
			socket.off("game-active", activateGame);
			socket.off("matchmaking-state", matchmakingState);
			socket.disconnect();
		});
	}, []);

	const	keyHookDown = (e: KeyboardEvent) =>
	{
		const	action = {
			type: ""
		};
		socketRef.current?.emit("game-event", action);
		switch (e.code)
		{
			case "ArrowUp":
				game.actionKeyPress = 38;
				action.type = "arrow-up";
				socketRef.current?.emit("game-event", action);
				break;
			case "ArrowDown":
				game.actionKeyPress = 40;
				action.type = "arrow-down";
				socketRef.current?.emit("game-event", action);
				break;
			default:
				break;
		}
	};

	const	keyHookReleased = () =>
	{
		game.actionKeyPress = -1;
		const	action = {
			type: ""
		};
		action.type = "stop-key";
		socketRef.current?.emit("game-event", action);
	};

		// this can be used for showing a start and waiting ]
	// for all player to be ready before starting the game
	// client.id checked on backend to avoid cheating
	const	setReadyAction = () =>
	{
		if (readyPlayer === false)
		{
			const	action = {
				type: "ready"
			};
			socketRef.current?.emit("game-event", action);
			setReadyPlayer(true);
		}
	};

	const prevRotationRef = useRef<number>(0);

	useEffect(() =>
	{
		let requestId: number;
		const canvas = canvasRef.current;

		const ctx = canvas?.getContext("2d");
		game.board.canvas = canvas;
		game.board.ctx = ctx;
		game.board.init();
		addEventListener("keydown", keyHookDown);
		addEventListener("keyup", keyHookReleased);

		const clear = () =>
		{
			if (game.board.ctx)
			{
				game.board.ctx.fillStyle = "#fff";
				game.board.ctx?.clearRect(0, 0,
					game.board.dim.width, game.board.dim.height);
			}
		};

		const	render = () =>
		{
			clear();
			game.board.ctx?.beginPath();
			if (game.board.ctx)
			{
				game.board.ctx.fillStyle = "#F5F5DC";
				game.board.ctx.fillRect(0, 0, game.board.dim.width,
					game.board.dim.height);
			}
			if (gameActive === false
				|| (game.playerOne.score === game.scoreLimit
					|| game.playerTwo.score === game.scoreLimit))
			{
				const border = game.board.dim.width * 0.01;
				game.playerOne.pos.x = border;
				game.playerOne.pos.y = game.board.dim.height / 2;
				game.playerOne.racket.defineRacketSize();
				game.playerOne.pos.y -= game.playerOne.racket.dim.height / 2;
				game.playerTwo.racket.dim = game.playerOne.racket.dim;
				game.playerTwo.pos.x = game.board.dim.width - border
					- game.playerTwo.racket.dim.width;
				game.playerTwo.pos.y = game.board.dim.height / 2;
				game.playerTwo.racket.defineRacketSize();
				game.playerTwo.pos.y -= game.playerTwo.racket.dim.height / 2;
			}
			else
			{
				game.playerOne.pos.setCoordinateXYZ(
					theBoard.playerOne.position.x,
					theBoard.playerOne.position.y);
				game.playerOne.racket.defineRacketSize();
				game.playerTwo.pos.setCoordinateXYZ(
					theBoard.playerTwo.position.x,
					theBoard.playerTwo.position.y);
				game.playerTwo.racket.defineRacketSize();
				game.playerOne.render();
				game.playerTwo.render();
				game.ball.move(theBoard.ball.position.x,
								theBoard.ball.position.y);
			}
			game.net.render();
			game.ball.render();
			game.playerOne.renderScore(theBoard.plOneScore);
			game.playerTwo.renderScore(theBoard.plTwoScore);
			if (game.playerOne.score === game.scoreLimit
				|| game.playerTwo.score === game.scoreLimit)
			{
				dispatch(setGameOver(true));
				setGameActive(false);
				game.displayEndMessage();
			}
			requestId = requestAnimationFrame(render);
		};
		requestId = requestAnimationFrame(render);
		return (() =>
		{
			cancelAnimationFrame(requestId);
		});
	},
	[theBoard.ball.position]);

	const	displayStyle: React.CSSProperties = {
		textAlign: "center",
		fontSize: "8px"
	};

	return (
		<>
			< MenuBar />
			{/* <WaitingActive
					connected={connected}
					numberOfUser={theServer.numberOfUser}
					disconnected={socketRef.current?.active}
					gameOver={gameOver}
				/> */}
			{/* <div style={displayStyle}>
				FT_TRANSCENDENCE
			</div> */}

			{/* This part show the connection to the websocket */}
			{/* <div style={displayStyle}>
				<ConnectState connected={connected} />
			</div> */}

			{/* This part show the number of client connected */}
			{/* <div style={displayStyle}>
				number of client connected : {theServer.numberOfUser}<br/>
				number of client ready : {theServer.readyPlayerCount}
			</div> */}

			{/* This part show the frame number */}
			{/* <div style={displayStyle}>
				frame number (time server): {theServer.frameNumber} <br/>
			</div> */}

			{/* /* This part show more information */ }
			{/* <div style={displayStyle}>
				position ball x: {theBoard.ball.position.x} <br />
				position ball y: {theBoard.ball.position.y} <br />
				dimension width du server: {theServer.dimension.width} <br />
				dimension height du server: {theServer.dimension.height} <br />
				scale to server :
					scale_width: {theServer.scaleServer.width},
					scale_height:
								{theServer.scaleServer.height} <br />
				dimension width du client : {theBoard.dimension.width} <br />
				dimension height du client: {theBoard.dimension.height} <br />
				position du player 1:
							{JSON.stringify(theBoard.playerOne.position)} <br />
				position du player 2:
							{JSON.stringify(theBoard.playerTwo.position)} <br />
				value rotation mode spec : {theBoard.gameFace} <br/>
			</div> */}
			{/* This is the canvas part */}
			<div style={{ marginTop: '5rem' }}>
			</div>
			<div style={{ textAlign: 'center' }}>
				<div
					style={{
						width: game.board.canvas?.width,
						height: game.board.canvas?.height,
						transform: `rotate(${theBoard.gameFace}deg)`,
						// transition: 'transform 0.5s',
					}}
				>
					<canvas
					height={game.board.canvas?.height}
					width={game.board.canvas?.width}
					ref={canvasRef}
					/>
				</div>
				<div style={{marginTop: '2rem'}}>
					<button style={{padding: '.2rem'}} onClick={setReadyAction}>I'm ready</button>
				</div>
			</div>
			{/* <div style={{ textAlign: "center" }}>
				<motion.div
					// initial={{ rotate: 0 }}
					animate={{
						rotate: gameMode?.mode === "upside-down" ? theBoard.gameFace : 0,
						transition: { duration: 0.5 }
					}}
					style={{
					width: game.board.canvas?.width,
					height: game.board.canvas?.height,
					}}
				>
					<canvas
					height={game.board.canvas?.height}
					width={game.board.canvas?.width}
					ref={game.board.canvasRef}
					/>
				</motion.div>
			</div> */}
		</>
	);
};

export default TestBall;
