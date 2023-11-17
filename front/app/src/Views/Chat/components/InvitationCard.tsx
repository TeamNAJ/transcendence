
/* eslint-disable curly */
/* eslint-disable max-statements */
/* eslint-disable max-len */
/* eslint-disable max-lines-per-function */

import { useTheme } from "@emotion/react";
import
{
	Card,
	CardContent,
	Typography,
	IconButton,
	CardMedia,
	Box,
} from "@mui/material";

// please use vector this one is just for testing card
import pong from "../assets/pong.jpeg";

import PlayArrowIcon from "@mui/icons-material/PlayArrow";

type	InvitationCardProps = {
	message: string
};

const	InvitationCard = (props: InvitationCardProps) =>
{
	console.log("message here", props.message);
	const	theme = useTheme();
	const	message = props.message.split("#");
	const	playerOne = message[0].split(":");
	const	playerTwo = message[1].split(":");
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
						Play Pong with you
					</Typography>
					<Typography variant="subtitle1" color="text.secondary" component="div">
						A slot is reserved between {playerOne[1]} and {playerTwo[1]}
					</Typography>
				</CardContent>
				<Box sx={
					{
						display: "flex",
						pl: 1,
						pb: 1
					}}
				>
					<IconButton aria-label="play/pause">
						<PlayArrowIcon sx={{
							height: 38,
							width: 38
						}} />
					</IconButton>
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

export default InvitationCard;
