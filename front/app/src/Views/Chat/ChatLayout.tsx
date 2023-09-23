/* eslint-disable max-statements */
/* eslint-disable max-len */
/* eslint-disable max-lines-per-function */

import {
	AppBar,
	Avatar,
	Box,
	Card,
	CardContent,
	CardMedia,
	Divider,
	Fab,
	Grid,
	IconButton,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	ListItemTextProps,
	Paper,
	Tab,
	Tabs,
	TextField,
	Toolbar,
	Typography
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import MenuBar from "../../Component/MenuBar/MenuBar";
import { useTheme } from "@emotion/react";
import { CSSProperties, useState } from "react";
import { motion } from "framer-motion";
import { Outlet } from "react-router-dom";

// please use vector this one is just for testing card
import	pong from "./assets/pong.jpeg";

// invite
const	InvitationCard = () =>
{
	const theme = useTheme();
	return (
		<Card sx={{
			display: "flex",
			justifyContent: "flex-start",
			backgroundColor: theme.palette.background.default,
			width: "40%",
		}}>
			<Box sx={
				{
					display: "flex",
					flexDirection: "column"
				}
			}>
				<CardContent sx={{ flex: "1 0 auto" }}>
					<Typography component="div" variant="h5">
						Play Pong with me
					</Typography>
					<Typography variant="subtitle1" color="text.secondary" component="div">
						A slot is reserved between John Wick and you
					</Typography>
				</CardContent>
				<Box sx={
					{
						display: "flex",
						pl: 1,
						pb: 1
					}}
				>
					{/* <IconButton aria-label="previous">
						{theme.direction === "rtl" ? <SkipNextIcon /> : <SkipPreviousIcon />}
					</IconButton> */}
					<IconButton aria-label="play/pause">
						<PlayArrowIcon sx={{
							height: 38,
							width: 38
						}} />
					</IconButton>
					{/* <IconButton aria-label="next">
						{theme.direction === "rtl" ? <SkipPreviousIcon /> : <SkipNextIcon />}
					</IconButton> */}
				</Box>
			</Box>
			<CardMedia
				component="img"
				sx={{ width: 200 }}
				image={pong}
				alt="Live from space album cover"
			/>
		</Card>
	);
};

// chat part 


interface TabPanelProps
{
	children?: React.ReactNode;
	dir?: string;
	index: number;
	value: number;
	style?: CSSProperties;
	area?: boolean;
}

const	ChannelsList = () =>
{
	return (
		<>
			channel list here, you can follow FriendsList component
		</>
	);
};

const TabPanel = (props: TabPanelProps) =>
{
	const	{ children, value, index, ...other } = props;
	let		animationSettings;

	// this is a switch I added to change animation type on left | right view
	if (props.area === false)
		animationSettings = {
			type: "spring",
			duration: 0.3,
			scale: 0.6,
			stiffness: 0
		};
	else
		animationSettings = {
			type: "sidebar",
			duration: 0.5,
			scale: 0.85,
			stiffness: 80,
		};
	return (
		<motion.div
			initial={
			{
				opacity: 0,
				scale: animationSettings.scale
			}}
			animate={{
				opacity: value === index ? 1 : 0,
				scale: value === index ? 1 : animationSettings.scale
			}}
			transition={
			{
				duration: animationSettings.duration,
				type: animationSettings.type,
				stiffness: 80,
			}}
			style={{ display: value === index ? "block" : "none" }}
		>
			<Typography
				component="div"
				role="tabpanel"
				hidden={value !== index}
				id={`action-tabpanel-${index}`}
				aria-labelledby={`action-tab-${index}`}
				{...other}
			>
				<Box sx={{ p: 3 }}>{children}</Box>
			</Typography>
		</motion.div>
	);
};

// can be used to display the list of friends
const	CurrentlyTalkingFriend = () =>
{
	const	currentlyTalkingFriendDataFake = {
		name: "John Wick",
		avatar: "https://material-ui.com/static/images/avatar/1.jpg",
	};

	return (
		<List>
			<ListItem
				button
				key={currentlyTalkingFriendDataFake.name}
			>
				<ListItemIcon>
					<Avatar
						alt={currentlyTalkingFriendDataFake.name}
						src={currentlyTalkingFriendDataFake.avatar}
					/>
				</ListItemIcon>
				<ListItemText primary={currentlyTalkingFriendDataFake.name}>
				</ListItemText>
			</ListItem>
		</List>
	);
};

type FriendItemProps = {
	name: string;
	avatar?: string;
	online?: boolean;
	key?: number;
};
const	FriendItem = (props: FriendItemProps) =>
{
	const status = props.online ? "online" : "";

	return (
		<ListItem
			button
			key={props.key}
		>
			<ListItemIcon>
				<Avatar
					alt={props.name}
					src={props.avatar}
				/>
			</ListItemIcon>
			<ListItemText primary={props.name}>
				{props.name}
			</ListItemText>
			<ListItemText
				secondary={status}
				sx={{align: "right"}}
			>
			</ListItemText>
		</ListItem>
	);
};

const	FriendsList = () =>
{
	const	friendListDataFake = [
		{
			name: "Johanna Courtois",
			avatar: "https://material-ui.com/static/images/avatar/1.jpg",
			online: true,
		},
		{
			name: "Nikola Boratkova",
			avatar: "https://material-ui.com/static/images/avatar/3.jpg",
			online: false,
		},
		{
			name: "Alexandre Payet",
			avatar: "https://material-ui.com/static/images/avatar/2.jpg",
			online: true,
		}
	];

	return (
		<>
			<CurrentlyTalkingFriend />
			<Divider />
			<Grid
				item
				xs={12}
				// style={{padding: '10px'}}
				sx={{padding: "10px"}}
			>
				<TextField
					id="outlined-basic-email"
					label="Search"
					variant="outlined"
					fullWidth
				/>
			</Grid>
			<Divider />
			<List>
				{
					friendListDataFake.map((elem, index) =>
					{
						return (
							<FriendItem
								name={elem.name}
								avatar={elem.avatar}
								key={index}
								online={elem.online}
							/>
						);
					})
				}
			</List>
		</>
	);
};

// the next line interface is here to remove the typeScript errordeclare module '@mui/material/ListItemText'
declare module "@mui/material/ListItemText"
{
	interface ListItemTextProps
	{
		align?: "left" | "center" | "right";
	}
}

type	MessageItemProps = {
	key?: number,
	align?: ListItemTextProps,
	sender: "me" | "other" | "server",
	message: string,
	date: string
};

const	MessageItem = (props: MessageItemProps) =>
{
	let	align: "right" | "center" | "left" | undefined;

	switch (props.sender)
	{
		case "me":
			align = "right";
			break ;
		case "other":
			align = "left";
			break ;
		case "server":
			align = "center";
			break;
		default:
			align = "center";
			break;
	}
	if (props.message === "!play pong" && props.sender === "server")
		return (
			<ListItem key={props.key}>
				<Grid container>
					<Grid item xs={12}>
						<ListItemText
							align={align}
							color="primary"
						>
							<InvitationCard />
						</ListItemText>
					</Grid>
					<Grid item xs={12}>
						<ListItemText
							align={align}
							secondary={props.date}
						>
						</ListItemText>
					</Grid>
				</Grid>
			</ListItem>
		);
	else
		return (
			<ListItem key={props.key}>
				<Grid container>
					<Grid item xs={12}>
						<ListItemText
							align={align}
							color="primary"
							primary={props.message}
						>
						</ListItemText>
					</Grid>
					<Grid item xs={12}>
						<ListItemText
							align={align}
							secondary={props.date}
						>
						</ListItemText>
					</Grid>
				</Grid>
			</ListItem>
		);
}

const	MessagesArea = () =>
{
	const	FakeJohnWickDiscussMessageArray = [
		{
			sender: "server",
			message: "Vous etes maintenant ami avec Johanna Courtois",
			date: "09:30"
		},
		{
			sender: "me",
			message: "Hello how are you ?",
			date: "09:30"
		},
		{
			sender: "other",
			message: "Hello I'm fine and you",
			date: "09:30"
		},
		{
			sender: "me",
			message: "Want you play a pong game with me ?",
			date: "09:30"
		},
		{
			sender: "other",
			message: "No, I need to finish ft_transcendence first >.<",
			date: "09:30"
		},
		{
			sender: "me",
			message: "No, you are going to play. No discussions. I send you the link",
			date: "09:30"
		},
		{
			sender: "server",
			message: "!play pong",
			date: "09:42"
		}
	];
	return (
		<>
			<List
				sx={{
					height: "70vh",
					overflowY: "auto"
				}}
			>
				{
					FakeJohnWickDiscussMessageArray.map((elem, key) =>
					{
						return (
							<MessageItem
								key={key}
								date={elem.date}
								sender={elem.sender as "me" | "other" | "server"}
								message={elem.message}
							/>
						);
					})
				}
			</List>
		</>
	);
};

const	SendingArea = () =>
{
	return (
		<>
			<Grid item xs={11}>
				<TextField id="outlined-basic-email" label="Type Something" fullWidth />
			</Grid>
			<Grid
				xs={1}
				sx={{alignItems: "right"}}
				// align="right"
			>
				<Fab color="primary" aria-label="add">
					<SendIcon />
				</Fab>
			</Grid>
		</>
	);
};

const a11yProps = (index: any) =>
{
	return (
		{
			id: `action-tab-${index}`,
			"aria-controls": `action-tabpanel-${index}`,
		}
	);
};

const	ChatLayout = () =>
{
	const	style = useTheme();
	const
	[
		value,
		setValue
	] = useState(0);

	const	handleChange = (event: React.SyntheticEvent, newValue: number) =>
	{
		setValue(newValue);
	};
	const	handleChangeIndex = (index: number) =>
	{
		setValue(index);
	};

	return (
		<div>
			<MenuBar />
			<Grid
				container
				component={Paper}
				sx={{
					width: "100%",
					height: "80vh"
				}}
			>
				<Grid
					item
					xs={3}
					sx={{borderRight: "1px solid #e0e0e0"}}
				>
					<Toolbar
						style={
						{
							backgroundColor: style.palette.primary.main,
						}}
					>
						<Tabs
							value={value}
							onChange={handleChange}
							indicatorColor="primary"
							textColor="secondary"
							variant="scrollable"
							aria-label="action tabs"
						>
							<Tab
								label="Channels"
								{...a11yProps(0)}
								style={{fontSize: "8px"}}
							/>
							<Tab
								label="Direct Message"
								{...a11yProps(1)}
								style={{fontSize: "8px"}}
							/>
						</Tabs>
					</Toolbar>
					{/* right side of the screen  */}
					<TabPanel
						area={false}
						value={value}
						index={0}
						dir={style.direction}
						style={style}
					>
						<ChannelsList />
					</TabPanel>
					<TabPanel
						area={false}
						value={value}
						index={1}
						dir={style.direction}
						style={style}
					>
						<FriendsList />
					</TabPanel>
				</Grid>
				{/* left side of the screen  */}
				<Grid item xs={9}>
					{/* when value == 0  */}
					<TabPanel
						area={true}
						value={value}
						index={0}
						dir={style.direction}
						style={style}
					>
						{/* // Just a placeholder */}
						<Outlet />
					</TabPanel>

					{/* when value == 1 */}
					<TabPanel
						area={true}
						value={value}
						index={1}
						dir={style.direction}
						style={style}
					>
						<MessagesArea />
					</TabPanel>

					<Divider />

					<Grid
						container
						// style={{padding: '20px'}}
						sx={{padding: "20px"}}
					>
						<SendingArea />
					</Grid>
				</Grid>
			</Grid>
		</div>
	);
};

export default ChatLayout;
