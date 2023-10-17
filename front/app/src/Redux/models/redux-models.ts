type MessageModel =
{
	sender: string,
	message: string,
	mode: string
}
export	interface ChatUserModel
{
	// name == pseudo
	"name": string,
	"id": string,
	"avatar": string,
	"password": string,
}

export interface ChatModel
{
	"window":
	{
		"bigWindow": boolean,
		"hiddenWindow": boolean,
		"miniWindow" : boolean,
	},
	"pseudo": string,
	"connected": boolean,
	"users": ChatUserModel[],
	"activeConversationId": string,
	"currentChannel": string,
	"chanMessages": MessageModel[],
	"kindOfConversation": string,
	"numberOfChannels": number
}

export interface	ProfileModel
{
	editView: boolean,
	friendView: boolean,
	publicView: boolean
	myView: boolean
}
export interface	UserModel
{
	"isLoggedIn": boolean,
	"login": string,
	"username": string,
	"bearerToken": string,
	"rememberMe": boolean,
	"chat": ChatModel,
	"id": number,
	"email": string,
	"firstName": string,
	"lastName": string,
	"registrationProcess": boolean,
	"registrationError": string,
	"doubleAuth": boolean,
	"otpCode": string,
	"phoneNumber": string,
	"registered": boolean,
	"avatar": string,
	"ftAvatar": {
		link: string,
		version: {
			large: string,
			medium: string,
			small: string,
			mini: string
		}
	},
	"profile": ProfileModel,
	"password": string
}

export interface	AnonymousUserModel
{
	"registrationStep": string,
	"uuid": string,
	"creationDate": string,
	"password": string,
	"message": string,
	"token": string,
	"expireAt": number
	"error": boolean;
	"errorStatusCode": number,
	"errorMessage": string
}

export interface	AnonymousUserRegisterResponseModel
{
	statusCode?: number,
	creationDate?: string,
	message?: string,
	password?: string,
	uuid?: string
}

export interface	AnonymousUserLoginResponseModel
{
	statusCode?: number,
	message?: string,
	token?: string,
	expireAt?: number,
}

export	interface	RegistrationProcessModel
{
	"startedRegister": boolean,
	"step": number,
	"codeOauthFT": string,
	"abortRequested": boolean,
	// line bellow is here to reproduce link behaviour
	// On Copyright signup
	// server can know user leave the connection
	"requestHomeLink" : boolean
}

export interface	ServerModel
{
	"isFetching": boolean,
	"connexionEnabled": boolean,
	"serverActiveSince": string,
	"connexionAttempt": number,
	"error": boolean,
	"message": string,
	"serverLocation": string
}

export interface	CanvasModel
{
	"height": number,
	"width": number
}

export interface	ControllerModel
{
	"activeView": string,
	"previousPage": string,
	"themeMode": string,
	"user": UserModel,
	"registration": RegistrationProcessModel,
	"canvas": CanvasModel,
}

export interface	Dimension
{
	width: number,
	height: number
}

export interface	Position
{
	x: number,
	y: number
}

export interface	GameEngineModel
{
	server:
	{
		dimension: Dimension,
		scaleServer: Dimension,
		frameNumber: number,
		numberOfUser: number,
		readyPlayerCount: number,
	},
	board:
	{
		dimension: Dimension,
		ball:
		{
			position: Position,
		},
		playerOne:
		{
			position: Position,
		}
		playerTwo:
		{
			position: Position
		}
		plOneSocket: string,
		plTwoSocket: string,
		plOneScore: number,
		plTwoScore:number
	}
}
