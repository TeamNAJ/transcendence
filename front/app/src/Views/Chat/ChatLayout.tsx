/* eslint-disable no-alert */
/* eslint-disable curly */
/* eslint-disable max-statements */
/* eslint-disable max-len */
/* eslint-disable max-lines-per-function */
// import * as SocketIOClient from "socket.io-client";
// 🏓 🔴 🟢 🗨
import {
	Avatar,
	Box,
	Button,
	Divider,
	Fab,
	Grid,
	List,
	ListItem,
	ListItemText,
	ListItemIcon,
	Paper,
	Tab,
	Tabs,
	TextField,
	Toolbar,
	Typography,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle
} from "@mui/material";

import MessageItem from "./components/MessageItem";
import Myself from "./components/Myself";
import SendIcon from "@mui/icons-material/Send";
import MenuBar from "../../Component/MenuBar/MenuBar";
import { useTheme } from "@emotion/react";
import { v4 as uuidv4 } from "uuid";
import
{
	CSSProperties,
	useState,
	useEffect,
	useRef
}	from "react";
import { motion } from "framer-motion";
import { io } from "socket.io-client";

import {
	useAppDispatch,
	useAppSelector
} from "../../Redux/hooks/redux-hooks";
import {
	setActiveConversationId,
	setCurrentChannel,
	setChatUsers,
	setNumberOfChannels,
	connectChatUser,
	addChatUser,
	setCurrentProfile,
	setCurrentProfileIsFriend,
	setProfileFriendView,
	setProfilePublicView,
	setPreviousPage,
}	from "../../Redux/store/controllerAction";

import { useNavigate } from "react-router-dom";
import AddNewChannelModal from "./components/AddNewChannelModal";
import { Socket } from "socket.io-client/debug";
import BadgeAvatars from "./components/BadgeAvatars";

type MessageModel =
{
	sender: string,
	message: string,
	id: number,
	username: string
}

type	FriendListModel =
{
	name: string,
	avatar: string,
	status: string,
	statusChat: string,
	statusGame: string
}

type MembersModel =
{
	id: number,
	name:string,
	profileId: string,
	userName: string,
	status: string,
	online: boolean
}

type ChanMapModel = {
    id: number,
    name: string,
    mode: string
};

// chat part 
interface TabPanelProps {
	area?: boolean | string;
	children?: React.ReactNode;
	dir?: string;
	index: number;
	value: number;
	style?: CSSProperties;
}

const TabPanel = (props: TabPanelProps) =>
{
	const { children, value, index, ...other } = props;
	let animationSettings;

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

type FriendsListProps = {
	socketRef: React.MutableRefObject<Socket> | null,
	tabMode: "user" | "friend",
};

const FriendsList = (props: FriendsListProps) =>
{
	const	dispatch = useAppDispatch();

	const	currentProfileIsFriend = useAppSelector((state) =>
	{
		return (state.controller.user.chat.currentProfileIsFriend);
	});
	const	users = useAppSelector((state) =>
	{
		return (state.controller.user.chat.users);
	});
	const	user = useAppSelector((state) =>
	{
		return (state.controller.user);
	});

	const	friendList = useAppSelector((state) =>
	{
		return (state.controller.user.chat.friends);
	});

	const	numberOfChannels = useAppSelector((state) =>
	{
		return (state.controller.user.chat.numberOfChannels);
	});

	const	createNewConv = (activeId: string) =>
	{
		const action = {
			type: "create-channel",
			payload: {
				chanName: "undefined",
				chanMode: "private",
				chanPassword: "undefined",
				chanId: numberOfChannels + 1,
				activeId: activeId
			}
		};
		props.socketRef?.current.emit("channel-info", action);
	};

	return (
		<>
			MY FRIENDS
			<Divider />
				{
					users.filter((elem, index) =>
					{
						return (users.indexOf(elem) === index);
					}).filter((elem) =>
					{
						let	isFriend = false;

						friendList.forEach(element =>
						{
							if (elem.profileId.toString() === element.profileIdFriend.toString())
								isFriend = true;
						});
						return (isFriend);
					}).map((elem, index) =>
					{
						let status;

						status = elem.online ? "💚" : "🔴";
						if (elem.status === "playing" && elem.online)
							status = "🏓";
						
						return (
							(elem.profileId.toString() !== user.id.toString() && users[index] )
							?	<div key={uuidv4()} onClick={() =>
									{
										dispatch(setActiveConversationId(elem.id));
										createNewConv(elem.id);
									}}>
									<ListItem  >
									<ListItemIcon>
										<BadgeAvatars
											elem={elem}
										/>
									</ListItemIcon>
									<ListItemText primary={elem.name}>
										{elem.name}
									</ListItemText>
									{
										(currentProfileIsFriend)
										? 
											<ListItemText
													secondary={status}
													sx={{ align: "right" }}
											></ListItemText>
										: <></>
									}
								</ListItem>
							</div>
							: <></>
						);
					})
				}
		</>
	);
};

type UsersListProps = {
	socketRef: React.MutableRefObject<Socket> | null,
	tabMode: "user" | "friend",
};

const UsersList = (props: UsersListProps) =>
{
	const	dispatch = useAppDispatch();

	const	currentProfileIsFriend = useAppSelector((state) =>
	{
		return (state.controller.user.chat.currentProfileIsFriend);
	});
	const	users = useAppSelector((state) =>
	{
		return (state.controller.user.chat.users);
	});
	const	user = useAppSelector((state) =>
	{
		return (state.controller.user);
	});

	const	numberOfChannels = useAppSelector((state) =>
	{
		return (state.controller.user.chat.numberOfChannels);
	});

	const	createNewConv = (activeId: string) =>
	{
		const action = {
			type: "create-channel",
			payload: {
				chanName: "undefined",
				chanMode: "private",
				chanPassword: "undefined",
				chanId: numberOfChannels + 1,
				activeId: activeId
			}
		};
		props.socketRef?.current.emit("channel-info", action);
	};

	return (
		<>
			{
				(user.ft)
				? <Myself />
				: <></>
			}
			<Divider />
				{
					users.filter((elem, index) =>
					{
						return (users.indexOf(elem) === index);
					}).map((elem, index) =>
					{
						let status;

						status = elem.online ? "💚" : "🔴";
						if (elem.status === "playing" && elem.online)
							status = "🏓";
						
						return (
							(elem.profileId.toString() !== user.id.toString() && users[index] )
							?	<div key={uuidv4()} onClick={() =>
									{
										dispatch(setActiveConversationId(elem.id));
										createNewConv(elem.id);
									}}>
									<ListItem  >
									<ListItemIcon>
										<Avatar
											alt={elem.name}
											src={elem.avatar}
										/>
									</ListItemIcon>
									<ListItemText primary={elem.name}>
										{elem.name}
									</ListItemText>
									{
										(currentProfileIsFriend)
										? 
											<ListItemText
													secondary={status}
													sx={{ align: "right" }}
											></ListItemText>
										: <></>
									}
								</ListItem>
							</div>
							: <></>
						);
					})
				}
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

type	ActionSocket = {
	type: string,
	payload?: any
};

const	ChatLayout = () =>
{
	const	socketRef = useRef<SocketIOClient.Socket | null>(null);
	const	style = useTheme();
	const	dispatch = useAppDispatch();
	const	navigate = useNavigate();

	const	server	= useAppSelector((state) =>
	{
		return (state.server);
	});
	const	chatUsers = useAppSelector((state) =>
	{
		return (state.controller.user.chat.users);
	});

	const	currentChannel = useAppSelector((state) =>
	{
		return (state.controller.user.chat.currentChannel);
	});
	const currentChannelRef = useRef(currentChannel);

	const	user = useAppSelector((state) =>
	{
		return (state.controller.user);
	});
	const	activeId = useAppSelector((state) =>
	{
		return (state.controller.user.chat.activeConversationId);
	});
	const	profileToken = useAppSelector((state) =>
	{
		return (state.controller.user.bearerToken);
	});

	const
	[
		value,
		setValue
	] = useState(0);

	const
	[
		connected,
		setConnected
	] = useState(false);

	const [
		open,
		setOpen
	] = useState(false);

	const [
		channelName,
		setChannelName
	] = useState("");

	const [
		chanPassword,
		setChanPassword
	] = useState("");

	const [
		userPassword,
		setUserPassword
	] = useState("");

	const [
		selectedMode,
		setSelectedMode
	] = useState("");

	const [
		channels,
		setChannels
	] = useState([]);

	const
	[
		privateMessage,
		setPrivateMessage
	] = useState([]);

	const [
		chanMessages,
		setChanMessages
	] = useState<MessageModel[]>([]);

	const [
		privMessages,
		setPrivMessages
	] = useState<MessageModel[]>([]);

	const [
		openPasswordDialog,
		setOpenPasswordDialog
	] = useState(false);

	const [
		channelMembers,
		setChannelMembers
	] = useState<MembersModel[]>([]);

	const [
		isChannelAdmin,
		setIsChannelAdmin
	] = useState(false);

	const
	[
		talkingUser,
		setTalkingUser
	] = useState("");

	const
	[
		friendProfileId,
		setFriendProfileId
	] = useState("");

	const
	[
		isFriend,
		setIsFriend
	] = useState(false);
	const [
		uniqueId,
		setUniqueId
	] = useState("");

	const [
		kindOfConversation,
		setKindOfConversation
	] = useState("");

	const [
		friendList,
		setFriendList
	] = useState<FriendListModel[]>([]);

	const [
		blockedList,
		setBlockedList
	] = useState<string[]>([]);

	const [
		isMuted,
		setIsMuted
	] = useState(false);

	const [
		passwordDialogueOpen,
		setPasswordDialogueOpen
	] = useState(false);

	const [
		buttonSelection,
		setButtonSelection
	] = useState<ChanMapModel>({
		id: 0,
		name: "",
		mode: "",
	});

	const [
		buttonSelectionPriv,
		setButtonSelectionPriv
	] = useState<ChanMapModel>({
		id: 0,
		name: "",
		mode: "private",
	});

	const [
		channelToChangePassword,
		setChannelToChangePassword
	] = useState("");

	const [
		inviteDialogOpen,
		setInviteDialogOpen
	] = useState(false);

	const [
		channelToInvite,
		setChannelToInvite
	] = useState("");

	const [
		userToInvite,
		setUserToInvite
	] = useState("");

	const [
		newPassword,
		setNewPassword
	] = useState("");

	const handleClickOpen = () =>
	{
		setOpen(true);
	};

	const handleClose = () =>
	{
		setChannelName("");
		setSelectedMode("");
		setChanPassword("");
		setOpen(false);
	};

	const
	[
		arrayListUser,
		setArrayListUser
	] = useState([]);

	const [
		joiningChannelName,
		setJoiningChannelName
	] = useState("");

	const [
		clickedChannel,
		setClickedChannel
	] = useState("");

	const [
		clickedChanMode,
		setClickedChanMode
	] = useState("");

	const joiningChannelNameRef = useRef(joiningChannelName);
	const blockedListRef = useRef(blockedList);

	const	createNewChannel = () =>
	{
		const action = {
			type: "create-channel",
			payload: {
				chanName: channelName,
				chanMode: selectedMode,
				chanPassword: chanPassword,
				chanId: channels.length + 1,
				pmIndex: privateMessage.length + 1,
				activeId: activeId,
				kind: kindOfConversation
			}
		};
		dispatch(setNumberOfChannels(channels.length));
		socketRef.current?.emit("channel-info", action);
	};

	const	removeChannel = (chanId: number, chanName: string) =>
	{
		const	action = {
			type: "destroy-channel",
			payload: {
				name: chanName,
				id: chanId,
				kind: kindOfConversation
			}
		};
		socketRef.current?.emit("channel-info", action);
	};

	const handleSave = () =>
	{
		setKindOfConversation("channel");
		if (channelName.trim() === "")
		{
			alert("Channel name cannot be empty");
			return;
		}

		if (![
			"public",
			"protected",
			"private"
			].includes(selectedMode))
		{
			alert("Please select a mode (Public, Protected, or Private)");
			return;
		}

		if (selectedMode === "protected" && chanPassword.trim() === "")
		{
			alert("There must be a password for a protected channel");
			return;
		}
		setKindOfConversation("channel");
		createNewChannel();
		handleClose();
	};

	const	joinChannel = (chanName: string) =>
	{
		const	action = {
			type: "asked-join",
			payload: {
				chanName: chanName,
				activeId: activeId,
				kind: kindOfConversation,
				id: user.id
			}
		};
		if (socketRef.current !== null)
			socketRef.current.emit("channel-info", action);
	};

	useEffect(() =>
	{
		const socket = io(server.uri + ":3000",
			{
				path: "/socket-chat",
				autoConnect: false,
				reconnectionAttempts: 5,
				auth:
				{
					token: profileToken
				}
			});
		socketRef.current = socket;
		const	createChatUser = (data: any) =>
		{
			if (data.type === "create-chat-user")
			{
				if (data.payload.newChatUser === undefined)
					return ;
				dispatch(addChatUser(data.payload.newChatUser));
				dispatch(connectChatUser(data.payload.newChatUser, data.payload.online));
			}
		};

		const connect = () =>
		{
			setConnected(true);
			const	searchChatUser = user.chat.users.find((elem) =>
			{
				return (elem.name === user.username);
			});
			if (searchChatUser === undefined)
			{
				const	action = {
					type: "create-chat-user",
					payload: {
						user: user,
						online: true,
						status: "connected"
					}
				};
				if (socketRef.current !== null)
					socketRef.current.emit("info", action);
			}
			else
			{
				dispatch(connectChatUser(searchChatUser, true));
			}
		};

		const disconnect = () =>
		{
			setConnected(false);
			const	searchChatUser = user.chat.users.find((elem) =>
			{
				return (elem.name === user.username);
			});
			if (searchChatUser === undefined)
			{
				const	action = {
					type: "create-chat-user",
					payload: {
						user: user,
						online: false,
						status: "offline"
					}
				};
				if (socketRef.current !== null)
					socketRef.current.emit("info", action);
			}
			else
			{
				dispatch(connectChatUser(searchChatUser, false));
			}
		};

		const	isOneOfMyConvFunc = (name: any) =>
		{
			const	action = {
				type: "is-my-conv",
				payload: {name: name}
			};
			if (socketRef.current !== null)
				socketRef.current.emit("user-info", action);
		};

		const	updateChannels = (data: any) =>
		{
			if (data.type === "init-channels")
			{
				if (data.payload.channels !== undefined)
					setChannels(data.payload.channels);
				if (data.payload.privateMessage !== undefined)
					setPrivateMessage(data.payload.privateMessage);
				if (data.payload.friends !== undefined)
					setFriendList(data.payload.friends);
			}

			if (data.type === "sending-list-user")
			{
				if (data.payload.friendsList !== undefined)
					setFriendList(data.payload.friendsList);
			}

			if(data.type === "add-new-channel")
			{
				if (data.payload.kind === "channel")
					setChannels(data.payload.chanMap);
				if (data.payload.kind === "privateMessage")
					setPrivateMessage(data.payload.privateMessageMap);
				setKindOfConversation(data.payload.kind);
				if (data.payload.kind === "privateMessage")
				{
					isOneOfMyConvFunc(data.payload.chanName);
				}
			}

			if (data.type === "destroy-channel")
			{
				if (data.payload.privateMessage !== undefined)
					setPrivateMessage(data.payload.privateMessageMap);
				else if (data.payload.message === "")
				{
					setChannels(data.payload.chanMap);
					setChanMessages([]);
				}
				else
				{
					alert(data.payload.message);
				}
			}

			if (data.type === "asked-join")
			{
				if (data.payload.message !== "")
				{
					alert(data.payload.message);
				}
				else
				{
					setChanMessages(data.payload.messages);
					alert("Successfully joined channel " + data.payload.chanName + "!");
				}
			}

			if (data.type === "protected-password")
			{
				if (data.payload.correct === "true")
				{
					joinChannel(joiningChannelNameRef.current);
					setOpenPasswordDialog(false);
					setUserPassword("");
				}
				else
				{
					alert("Incorrect password, try again !");
				}
			}
		};

		const connectError = (error: Error) =>
		{
			console.error("ws_connect_error", error);
		};

		const serverInfo = (data: any) =>
		{
			dispatch(setChatUsers(data.payload.arrayListUsers));
			setFriendList(data.payload.friendsList);
			setArrayListUser(data.payload.arrayListUsers);
		};

		const	updateMessages = (data: any) =>
		{
			const	kind = data.payload.kind;
			setKindOfConversation(kind);
			if (data.payload.kind === "privateMessage")
			{
				if (blockedListRef.current)
				{
					for (const blocked of blockedListRef.current)
					{
						if (blocked === data.payload.myProfileId || blocked === data.payload.friendProfileId)
						{	
							const newMessage: MessageModel = {
								sender: "server",
								message: "You have blocked this user and will not see the messages",
								id: 0,
								username: uniqueId,
							};
							const	messagesArray: MessageModel[] = [];
							messagesArray.push(newMessage);
							setPrivMessages(messagesArray);
							return ;
						}
					}
				}
			}
			if (data.payload.chanName === currentChannelRef.current)
			{
				// we will filter messages from blocked users if any
				const	tmpMessages = data.payload.messages;
				let filteredMessages: MessageModel[] = [];
	
				if (blockedListRef.current)
				{
					filteredMessages = tmpMessages.filter((message: MessageModel) =>
					{
						return (!blockedListRef.current.includes(message.sender));
					});
				
					if (data.payload.kind === "channel")
					{
						setChanMessages(filteredMessages);
					}
					else
					{
						for (const blocked of blockedListRef.current)
						{
							if (blocked === data.payload.myProfileId || blocked === data.payload.friendProfileId)
							{
								const newMessage: MessageModel = {
									sender: "server",
									message: "You have blocked this user and will not see the messages",
									id: 0,
									username: uniqueId,
								};
								const	messagesArray: MessageModel[] = [];
								messagesArray.push(newMessage);
								setPrivMessages(messagesArray);
							}
						}
					}
				}
			}
			goToChannel(data.payload.chanName, data.payload.kind, true);
		};

		const	channelInfo = (data: ActionSocket) =>
		{
			if (data.type === "confirm-is-inside-channel")
			{
				if (data.payload.isInside === "")
				{
					dispatch(setCurrentChannel(data.payload.chanName));
					if (data.payload.kind === "channel")
					{
							const	filteredMessages = data.payload.chanMessages.filter((message: MessageModel) =>
							{
								return (!blockedListRef.current.includes(message.sender));
							});
							setChanMessages(filteredMessages);
							goToChannel(data.payload.chanName, "channel", false);
					}
					if (data.payload.kind === "privateMessage")
					{
						setCurrentChannel(data.payload.chanName);
						setPrivMessages(data.payload.chanMessages);
						goToChannel(data.payload.chanName, "privateMessage", false);
					}
				}
				else
				{
					alert(data.payload.isInside);
				}
			}

			if (data.type === "display-members")
			{
				setChannelMembers(data.payload.memberList);
				setIsChannelAdmin(data.payload.isAdmin);
				setUniqueId(data.payload.uniqueId);
				setTalkingUser(data.payload.talkingUser);
				const	searchUser = chatUsers.find((elem) =>
				{
					return (elem.name === data.payload.talkingUser);
				});
				if (searchUser)
				{
					dispatch(setCurrentProfile(searchUser.profileId));
					dispatch(setCurrentProfileIsFriend(data.payload.isFriend));
				}
				setFriendProfileId(data.payload.friendId);
				setIsFriend(data.payload.isFriend);
			}

			if (data.type === "on-connection")
			{
				if (data.payload)
				{
					const list: string[] = data.payload.blockedList;
					setBlockedList(list);
				}
				refreshListUser();
			}

			if (data.type === "channel-exists")
			{
				alert(data.payload.message);
			}

			if (data.type === "changed-password")
			{
				if (data.payload.message !== "")
					alert (data.payload.message);
				else
					setChannels(data.payload.chanMap);
			}
		};

		const	leftChannelMessage = (data: any) =>
		{
			if (data.type === "left-channel")
			{
				if (currentChannelRef.current === data.payload.chanName)
				{
					if (data.payload.kind === "channel" || kindOfConversation === "channel")
					{
						setChanMessages([]);
					}
					if (data.payload.kind === "privateMessage" || kindOfConversation === "privateMessage")
						setPrivMessages([]);
					dispatch(setCurrentChannel("undefined"));
				}
				alert(data.payload.message);
				setIsChannelAdmin(false);
			}
		};

		const	userInfo = (data: any) =>
		{
			if (data.type === "block-user")
			{
				let	alertMessage: string;
				const	searchBlocked = blockedListRef.current.findIndex((person: string) =>
				{
					return (person === data.payload.blockedProfileId);
				});
				if (searchBlocked === -1)
				{
					setBlockedList(data.payload.blockedList);
					alertMessage = "You have blocked " + data.payload.newBlocked + ".";
				}
				else
					alertMessage = "You have already blocked " + data.payload.newBlocked + ".";
				alert(alertMessage);
			}

			if (data.type === "set-is-muted")
			{
				setIsMuted(true);
				const	message = "You have been muted in the channel " + data.payload.chanName + " for 60 seconds.";
				alert(message);
			}

			if (data.type === "invite-member")
			{
				alert(data.payload.message);
			}

			if (data.type === "make-admin")
			{
				alert(data.payload.message);
			}

			if (data.type === "unsuccessful-kick")
			{
				alert(data.payload.message);
			}
		};

		const	repopulateOnReconnection = (data: any) =>
		{
			if (data.type === "init-channels")
			{
				if (data.payload.channels !== undefined)
					setChannels(data.payload.channels);
				if (data.payload.friends !== undefined)
					setFriendList(data.payload.friends);
				if (data.payload.privateMessage !== undefined)
					setPrivateMessage(data.payload.privateMessage);
				setUniqueId(data.payload.uniqueId);
			}
		};

		const	connectState = (data: any) =>
		{
			if (data.type === "already-connected")
			{
				alert("Vous etes deja connecte sur une autre page");
			}
			navigate("/");
		};

		socket.on("connect-state", connectState);
		socket.on("connect", connect);
		socket.on("disconnect", disconnect);
		socket.on("error", connectError);
		socket.on("info", serverInfo);
		socket.on("display-channels", updateChannels);
		socket.on("channel-info", channelInfo);
		socket.on("update-messages", updateMessages);
		socket.on("left-message", leftChannelMessage);
		socket.on("get-user-list", updateChannels);
		socket.on("user-info", userInfo);
		socket.on("repopulate-on-reconnection", repopulateOnReconnection);
		socket.on("add-chat-user", createChatUser);

		socket.connect();

		return (() =>
		{
			socket.off("connect-state", connectState);
			socket.off("connect", connect);
			socket.off("disconnect", disconnect);
			socket.off("error", connectError);
			socket.off("info", serverInfo);
			socket.off("display-channels", updateChannels);
			socket.off("channel-info", channelInfo);
			socket.off("update-messages", updateMessages);
			socket.on("left-message", leftChannelMessage);
			socket.off("get-user-list", updateChannels);
			socket.off("user-info", userInfo);
			socket.off("repopulate-on-reconnection", repopulateOnReconnection);
			socket.off("add-chat-user", createChatUser);
			socket.disconnect();
        });
    }, []);

	useEffect(() =>
	{
		currentChannelRef.current = currentChannel;
		joiningChannelNameRef.current = joiningChannelName;
		blockedListRef.current = blockedList;

		if (isMuted === true)
		{
			setTimeout(() =>
			{
				setIsMuted(false);
			}, 60000);
		}
	}, [
		currentChannel,
		joiningChannelName,
		isMuted,
		blockedList
	]);

	const handlePasswordSubmit = (password: string) =>
	{
		const	action = {
			type: "password-for-protected",
			payload: {
				password: password,
				chanName: joiningChannelName,
			}
		};
		if (socketRef.current !== null)
			socketRef.current.emit("channel-info", action);
	};

	const handleChange = (event: React.SyntheticEvent, newValue: number) =>
	{
		setValue(newValue);
	};

	const refreshListUser = () =>
	{
		const action = {
			type: "get-user-list",
		};
		socketRef.current?.emit("info", action);
	};

	useEffect(() =>
	{
		{
			const	timeout = setTimeout(() =>
			{
				refreshListUser();
			}, 100);
			return (() =>
			{
				clearTimeout(timeout);
			});
		}
	});

	const listItemStyle = {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
		padding: "8px",
	};

	const listItemTextStyle = {
		flexGrow: 1,
	};

	const
	[
		text,
		setText
	] = useState("");

	const
	[
		talkingUserProfileId,
		setTalkingUserProfileId
	] = useState("");

	const handleTextChange = (e: any) =>
	{
		if (isMuted === true)
		{
			alert("You are muted for the moment being.");
		}
		else
			setText(e.target.value);
	};

	const handleSendClick = () =>
	{
		const action = {
			type: "sent-message",
			payload: {
				chanName: currentChannelRef.current,
				message: text,
			}
		};
		socketRef.current?.emit("info", action);
		setText("");
	};

	const	goToProfilePage = (chanName: string) =>
	{
		const	userMe = user.username;
		const substrings: string[] = chanName.split("&");
		let	username: string;
		substrings.forEach((elem) =>
		{
			if (elem !== userMe)
				username = elem;
		});
		dispatch(setPreviousPage("/the-chat"));
		const	searchUser = chatUsers.find((elem) =>
		{
			return (elem.name === username);
		});
		if (searchUser === undefined)
			return ;
		dispatch(setCurrentProfile(searchUser.profileId));
		if (isFriend)
		{
			dispatch(setProfileFriendView());
			dispatch(setCurrentProfileIsFriend(true));
			setIsFriend(true);
		}
		else
		{
			setIsFriend(false);
			dispatch(setCurrentProfileIsFriend(false));
			dispatch(setProfilePublicView());
		}
		setTalkingUserProfileId(searchUser.profileId);
		
		navigate("/profile/");
	};

	const	leaveChannel = (chanName: string) =>
	{
		const	action = {
			type: "leave-channel",
			payload: {
				chanName: chanName,
			}
		};
		if (socketRef.current !== null)
			socketRef.current.emit("channel-info", action);
	};

	const [
		isDialogOpen,
		setIsDialogOpen
	] = useState(false);

	const [
		isPrivDialogOpen,
		setIsPrivDialogOpen
	] = useState(false);

	const handleDialogOpen = (priv: boolean) =>
	{
		if (priv)
			setIsPrivDialogOpen(true);
		else
			setIsDialogOpen(true);
	};

	const handleDialogClose = () =>
	{
		setIsPrivDialogOpen(false);
		setButtonSelectionPriv({
			id: 0,
			name: "",
			mode: "",
		});
		setIsDialogOpen(false);
		setButtonSelection({
			id: 0,
			name: "",
			mode: "",
		});
	};

	const handleJoinButtonClick = (chanMode: string, chanName: string) =>
	{
		if (chanMode === "protected")
		{
			setJoiningChannelName(chanName);
			setOpenPasswordDialog(true);
		}
		else
			joinChannel(chanName);
		handleDialogClose();
	};

	const handleLeaveButtonClick = (_chanId: number, chanName: string) =>
	{
		leaveChannel(chanName);
		handleDialogClose();
	};

	const handleRemoveButtonClick = (chanId: number, chanName: string) =>
	{
		removeChannel(chanId, chanName);
		handleDialogClose();
	};

	const [
		membersOpen,
		setMembersOpen
	] = useState(false);

	const handleMembersClickOpen = (chanName: string) =>
	{
		setMembersOpen(true);
		const	action = {
			type: "member-list",
			payload: {
				chanName: chanName,
			}
		};

		if (socketRef.current !== null)
			socketRef.current.emit("channel-info", action);
	};

	const handleMembersClose = () =>
	{
		setMembersOpen(false);
	};

	const	kickUserFromChannel = (userName: string, chanName: string) =>
	{
		const	action = {
			type: "kick-member",
			payload: {
				userName: userName as string,
				chanName: chanName,
			}
		};

		if (socketRef.current !== null)
			socketRef.current.emit("channel-info", action);
	};

	const	banUserFromChannel = (userName: string, chanName: string) =>
	{
		const	action = {
			type: "ban-member",
			payload: {
				userName: userName,
				chanName: chanName,
			}
		};

		if (socketRef.current !== null)
			socketRef.current.emit("channel-info", action);
	};

	const	addUserToBlocked = (userName: string, chanName: string) =>
	{
		let	blockedName: string;
		blockedName = userName;
		if (chanName !== "")
		{
			const	userMe = chatUsers.find((elem) =>
		{
			return (elem.profileId === uniqueId);
		});
		let substrings: string[] = chanName.split("&");
		substrings.forEach((elem) =>
		{
			if (elem !== userMe?.name)
				blockedName = elem;
		});
		}
		const	action = {
			type: "block-user",
			payload: {
				blockedName: blockedName,
			}
		};

		if (socketRef.current !== null)
			socketRef.current.emit("user-info", action);
	};

	const	muteUserInChannel = (userName: string, chanName: string) =>
	{
		const	action = {
			type: "mute-user",
			payload: {
				chanName: chanName,
				userName: userName,
			}
		};

		if (socketRef.current !== null)
			socketRef.current.emit("user-info", action);
	};

	// END OF MEMBERS FUNCTIONS

	// INVITE
	const	getProfileId = (username: string) =>
	{
		const	searchUser = chatUsers.find((elem) =>
		{
			return (elem.name === username);
		});
		if (searchUser !== undefined)
			return (searchUser.profileId);
		else
			return ("undefined");
	};

	const	inviteUserToChannel = (data: string) =>
	{
		refreshListUser();
		const	profileId = getProfileId(data);
		const	action = {
			type: "invite-member",
			payload: {
				chanName: channelToInvite,
				userName: profileId,
			}
		};

		if (socketRef.current !== null)
			socketRef.current.emit("user-info", action);
	};

	// END OF INVITE
	const	goToChannel = (chanName: string, kind: string, okContinue: boolean) =>
	{
		if (okContinue === false)
			return ;
		const	action = {
			type: "did-I-join",
			payload: {
				chanName: chanName,
				kind: kind,
				userId: activeId
			}
		};

		if (socketRef.current !== null)
			socketRef.current.emit("channel-info", action);
	};

	const	makeAdmin = (userName: string, chanName: string) =>
	{
		const	action = {
			type: "make-admin",
			payload: {
				userName: userName,
				chanName: chanName,
			}
		};

		if (socketRef.current !== null)
			socketRef.current.emit("user-info", action);
	};

	const	addPasswordToChannel = (chanName: string, newPassword: string) =>
	{
		const	action = {
			type: "add-password",
			payload: {
				chanName: chanName,
				newPassword: newPassword,
			}
		};

		if (socketRef.current !== null)
			socketRef.current.emit("channel-info", action);
	};

	const	changeTabOperations = () =>
	{
		refreshListUser();
		setChanMessages([]);
		setPrivMessages([]);
		dispatch(setCurrentChannel(""));
	}

	const	getUserFromChannel = (chanName: string) =>
	{
		const	userMe = chatUsers.find((elem) =>
		{
			return (elem.profileId === uniqueId);
		});
		let substrings: string[] = chanName.split("&");
		let	username: string;
		username = "";
		substrings.forEach((elem) =>
		{
			if (elem !== userMe?.name)
				username = elem;
		});
		return (username);
	};

	return (
		<div>
			<MenuBar />
			<br />
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
					sx={{ borderRight: "1px solid #e0e0e0" }}
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
								style={{fontSize: "15px"}}
								onClick={() =>
								{
									changeTabOperations();
								}}
							/>
							<Tab
								label="Users"
								{...a11yProps(1)}
								style={{fontSize: "15px"}}
								onClick={() =>
								{
									changeTabOperations();
								}}
							/>
							<Tab
								label="Friends"
								{...a11yProps(2)}
								style={{fontSize: "15px"}}
							/>
						</Tabs>
					</Toolbar>
					<TabPanel
						area={"false"}
						value={value}
						index={0}
						dir={style.direction}
						style={style}
					>
						<div>
							<AddNewChannelModal
								handleClickOpen={handleClickOpen}
								handleClose={handleClose}
								handleSave={handleSave}
								open={open}
								channelName={channelName}
								selectedMode={selectedMode}
								setChannelName={setChannelName}
								setSelectedMode={setSelectedMode}
								setChanPassword={setChanPassword}
								chanPassword={chanPassword}
							/>
							<Dialog open={open} onClose={handleClose}>
								<DialogTitle>Enter Information</DialogTitle>
								<DialogContent>
									<DialogContentText>
										Please enter the following information:
									</DialogContentText>
									<input
										type="text"
										placeholder="User name"
										value={channelName}
										onChange={(e) =>
										{
											setKindOfConversation("channel");
											const inputValue = e.target.value;
											if (inputValue.length <= 8)
												setChannelName(inputValue);
											else
												setChannelName(inputValue.slice(0, 8));
										}}
									/>
									<br />
									<div>
										<input
										type="radio"
										id="option1"
										name="answerOption"
										value="public"
										checked={selectedMode === "public"}
										onChange={() =>
										{
											setSelectedMode("public");
										}}
										/>
										<label htmlFor="option1">Public</label>
									</div>
									<div>
										<input
										type="radio"
										id="option2"
										name="answerOption"
										value="protected"
										checked={selectedMode === "protected"}
										onChange={() =>
										{
											setSelectedMode("protected");
										}}
										/>
										<label htmlFor="option2">Protected</label>
									</div>
									<div>
										<input
										type="radio"
										id="option3"
										name="answerOption"
										value="private"
										checked={selectedMode === "private"}
										onChange={() =>
										{
											setSelectedMode("private");
										}}
										/>
										<label htmlFor="option3">Private</label>
									</div>
									<input
										type="text"
										placeholder="Password (if protected)"
										value={chanPassword}
										onChange={(e) =>
										{
											setChanPassword(e.target.value);
										}}
									/>
								</DialogContent>
								<DialogActions>
									<Button onClick={handleClose} color="primary">
										Cancel
									</Button>
									<Button onClick={handleSave} color="primary">
										Save
									</Button>
								</DialogActions>
							</Dialog>
							<List>
								{
									channels.map((channel: any, index: number) =>
									{
										return (
											<ListItem style={listItemStyle} key={index}>
												<ListItemText
													style={
														channel.name === currentChannelRef.current
														? { color: "red" }
														: listItemTextStyle
													}
													primary={channel.name}
													onClick={() =>
													{
														setKindOfConversation("channel");
														return (goToChannel(channel.name, "channel", true));
													}}
												/>
												<Button onClick={() =>
												{
													setClickedChannel(channel.name);
													setClickedChanMode(channel.mode);
													handleDialogOpen(false);
													setButtonSelection(channel.name);
													refreshListUser();
												}}>
													Options
												</Button>
												<Dialog open={isDialogOpen} onClose={handleDialogClose}>
													<DialogTitle>
														Choose an Action
													</DialogTitle>
													<DialogContent>
														<Button onClick={() =>
														{
															return handleJoinButtonClick(clickedChanMode, clickedChannel);
														}}>
															Join
														</Button>
														<Button onClick={() =>
														{
															return handleLeaveButtonClick(buttonSelection.id, clickedChannel);
														}}>
															Leave
														</Button>
														<Button onClick={() =>
														{
															return handleRemoveButtonClick(buttonSelection.id, clickedChannel);
														}}>
															Remove
														</Button>
														<Button onClick={() =>
														{
															setPasswordDialogueOpen(true);
														}}>
															Add password
														</Button>
														<Dialog open={passwordDialogueOpen} onClose={() =>
															{
																setPasswordDialogueOpen(false);
															}}
															maxWidth="sm" fullWidth>
															<DialogTitle>Add a new password to the channel</DialogTitle>
															<DialogContent>
																<TextField
																label="New password"
																variant="outlined"
																fullWidth
																value={newPassword}
																onChange={(e) =>
																{
																	setNewPassword(e.target.value);
																	setChannelToChangePassword(clickedChannel);
																}}/>
															</DialogContent>
															<DialogActions>
																<Button onClick={() =>
																	{
																		addPasswordToChannel(clickedChannel, newPassword);
																		setPasswordDialogueOpen(false);
																		setNewPassword("");
																		setChannelToChangePassword("");
																	}} color="primary">
																	Add password
																</Button>
																<Button onClick={() =>
																{
																	setPasswordDialogueOpen(false);
																}} color="primary">
																Cancel
																</Button>
															</DialogActions>
														</Dialog>
														<Button onClick={() =>
														{
															return handleMembersClickOpen(clickedChannel);
														}}>
															Members
														</Button>
														<Button onClick={() =>
														{
															setInviteDialogOpen(true);
														}}>
															Invite
														</Button>
														<Dialog open={inviteDialogOpen} onClose={() =>
															{
																setInviteDialogOpen(false);
															}}
															maxWidth="sm" fullWidth>
															<DialogTitle>Invite User to Channel</DialogTitle>
															<DialogContent>
																<TextField
																label="User Name"
																variant="outlined"
																fullWidth
																value={userToInvite}
																onChange={(e) =>
																{
																	setUserToInvite(e.target.value);
																	setChannelToInvite(clickedChannel);
																}}/>
															</DialogContent>
															<DialogActions>
																<Button onClick={() =>
																	{
																		inviteUserToChannel(userToInvite);
																		setInviteDialogOpen(false);
																		setUserToInvite("");
																	}} color="primary">
																	Invite
																</Button>
																<Button onClick={() =>
																{
																	setInviteDialogOpen(false);
																}} color="primary">
																Cancel
																</Button>
															</DialogActions>
														</Dialog>
														<Dialog open={membersOpen} onClose={handleMembersClose} maxWidth="sm" fullWidth>
															<DialogTitle>
																Channel Members
															</DialogTitle>
															<DialogContent>
																<ul>
																{
																	channelMembers.map((member, index: number) =>
																	{
																		return (
																			<li
																				key={index}
																			>
																				{member.userName}
																				{isChannelAdmin && member.name !== uniqueId && (
																				<>
																					<Button onClick={() =>
																					{
																						kickUserFromChannel(member.name, clickedChannel);
																						handleMembersClose();
																					}}>
																						Kick
																					</Button>
																					<Button onClick={() =>
																					{
																						banUserFromChannel(member.name, clickedChannel);
																						handleMembersClose();
																					}}>
																						Ban
																					</Button>
																					<Button onClick={() =>
																					{
																						muteUserInChannel(member.name, clickedChannel);
																						handleMembersClose();
																					}}>
																						Mute
																					</Button>
																					<Button onClick={() =>
																					{
																						makeAdmin(member.name, clickedChannel);
																						handleMembersClose();
																					}}>
																						Make admin
																					</Button>
																				</>)}
																				{
																					(member.name !== uniqueId) &&
																					(
																						<>
																							<Button onClick={() =>
																							{
																								addUserToBlocked(member.name, "");
																							}}>
																								Block
																							</Button>
																						</>
																					)
																				}
																			</li>);
																	})
																}
																</ul>
															</DialogContent>
															<DialogActions>
															<Button onClick={handleMembersClose} color="primary">
																Close
															</Button>
															</DialogActions>
														</Dialog>
													</DialogContent>
													<DialogActions>
													<Button onClick={handleDialogClose} color="primary">
														Cancel
													</Button>
													</DialogActions>
												</Dialog>
												<Dialog
													open={openPasswordDialog}
													onClose={() =>
													{
														setOpenPasswordDialog(false);
													}}
												>
													<DialogTitle>
														Enter Password
													</DialogTitle>
													<DialogContent>
														<TextField
															label="Password"
															type="password"
															fullWidth
															variant="outlined"
															value={userPassword}
															onChange={(e) =>
															{
																setUserPassword(e.target.value);
															}}
														/>
													</DialogContent>
													<DialogActions>
														<Button
															onClick={() =>
															{
																setOpenPasswordDialog(false);
															}}
															color="primary"
														>
															Cancel
														</Button>
														<Button
															onClick={() =>
															{
																handlePasswordSubmit(userPassword);
															}}
															color="primary"
															>
															Submit
														</Button>
													</DialogActions>
												</Dialog>
											</ListItem>
										);
									})
								}
							</List>
						</div>
					</TabPanel>
					<TabPanel
						area={"false"}
						value={value}
						index={1}
						dir={style.direction}
						style={style}
					>
							<UsersList
								socketRef={socketRef}
								tabMode="user"
							/>
							<List>
								{
									privateMessage.map((channel: any, privId: number) =>
									{
										return (
											<div key={privId}>
												<ListItem style={listItemStyle}>
													<ListItemText
														style={
															channel.name === currentChannelRef.current
															? { color: "green" }
															: listItemTextStyle
														}
														primary={channel.name}
														onClick={() =>
														{
															setKindOfConversation("privateMessage");
															goToChannel(channel.name, "privateMessage", true);
														}}
													/>
												</ListItem>
												<Button
													onClick={() =>
													{
														setTalkingUser(getUserFromChannel(channel.name));
														setClickedChannel(channel.name);
														handleDialogOpen(true);
														setButtonSelectionPriv(channel);
													}}
												>
													Options
												</Button>
												<Dialog open={isPrivDialogOpen} onClose={handleDialogClose}>
													<DialogTitle>
														Choose an Action
													</DialogTitle>
													<DialogContent>
													<Button onClick={() =>
													{
														goToProfilePage(clickedChannel);
														setClickedChannel("");
													}}>
														see profile page
													</Button>
													</DialogContent>
														<DialogActions>
															<Button onClick={handleDialogClose} color="primary">
																Cancel
															</Button>
														</DialogActions>
												</Dialog>
											</div>
											);
									})
								}
								</List>

					</TabPanel>
					<TabPanel
						area={"false"}
						value={value}
						index={2}
						dir={style.direction}
						style={style}
					>
						<List>
							{
								<FriendsList socketRef={socketRef}
									
									// friends={friendList}
									tabMode="user"
								/>
							}
						</List>
					</TabPanel>
				</Grid>
				<Grid item xs={9}>
					<TabPanel
						area={"true"}
						value={value}
						index={0}
						dir={style.direction}
						style={style}
					>
						{/* <List
							sx={{
								height: "70vh",
								overflowY: "auto"
							}}
							> */}
							{
							chanMessages.map((message: MessageModel, index: number) =>
							{
								let	sender: "me" | "other" | "server";

								if (uniqueId === message.sender)
									sender = "me";
								else if (message.sender === "server")
									sender = "server";
								else
									sender = "other";
								return (
									<MessageItem
										key={index}
										ind={index}
										sender={sender}
										date={message.username}
										message={message.message}
									/>
								);
							})}
					</TabPanel>
					{/* when value == 1 */}
					<TabPanel
						area={"true"}
						value={value}
						index={1}
						dir={style.direction}
						style={style}
					>
						{
							privMessages.map((message: MessageModel, index: number) =>
							{
								let	sender: "me" | "other" | "server";
								if (uniqueId === message.sender)
									sender = "me";
								else if (message.sender === "server")
									sender = "server";
								else
									sender = "other";
								return (
									<MessageItem
										key={index}
										ind={index}
										sender={sender}
										date={message.username}
										message={message.message}
									/>
								);
							})
						}
					</TabPanel>
					<TabPanel
						area={"true"}
						value={value}
						index={2}
						dir={style.direction}
						style={style}
					>
					</TabPanel>
					<Divider />

					<Grid
						container
						sx={{ padding: "20px" }}
					>
						<Grid item xs={11}>
							<TextField
								id="outlined-basic-email"
								label="Type Something"
								fullWidth
								value={text}
								onChange={handleTextChange}
							/>
						</Grid>
						<Grid item xs={1} sx={{ alignItems: "right" }}>
							<Fab color="primary" aria-label="add" onClick={handleSendClick}>
							<SendIcon />
							</Fab>
						</Grid>
					</Grid>
				</Grid>
			</Grid>
		</div>
	);
};

export default ChatLayout;
