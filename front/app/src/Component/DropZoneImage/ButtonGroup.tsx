/* eslint-disable max-lines-per-function */
/* eslint-disable curly */
/* eslint-disable max-statements */
import { Button, Grid, Paper } from "@mui/material";
import { FileObject } from "mui-file-dropzone";
import { useAppSelector } from "../../Redux/hooks/redux-hooks";
import axios from "axios";
import Spacer from "./extra/Spacer";
import { useNavigate } from "react-router-dom";

const	sendImage = (files: FileObject[], token: string, uri: string) =>
{
	if (files.length === 0)
		return ;
	const	formData = new FormData();
	formData.append("image", files[0].file);
	const config = {
		method: "post",
		maxBodyLength: Infinity,
		url: uri + ":3000/user/update-photo",
		headers: {
		"Authorization": token,
		"Content-Type": "multipart/form-data"
		},
		data: formData
	};
	axios(config)
	.then((_response) =>
	{
	})
	.catch((error) =>
	{
		console.error(error);
	});
};

export type	ButtonGroupProps = {
	setDisplayOpenButton: React.Dispatch<React.SetStateAction<boolean>>;
	setDisplayModalBox: React.Dispatch<React.SetStateAction<boolean>>;
	files: FileObject[];
	readyExport: boolean
}

const	ButtonGroup = (props: ButtonGroupProps) =>
{
	let		buttonValidate;
	const	navigate = useNavigate();
	const	uri = useAppSelector((state) =>
	{
		return (state.server.uri);
	});
	const	token = useAppSelector((state) =>
	{
		return (state.controller.user.bearerToken);
	});

	if (props.files.length === 0 && props.readyExport === false)
	{
		buttonValidate = (
			<Button
				disabled={true}
			>
				Valider
			</Button>);
	}
	else if (props.files.length !== 0 && props.readyExport === false)
	{
		buttonValidate = (
			<Button
				color="secondary"
			>
				Ajuster
			</Button>);
	}
	else
	{
		buttonValidate = (
			<Button
				onClick={() =>
				{
					sendImage(props.files, token, uri);
					props.setDisplayModalBox(false);
					navigate("/");
				}}
				disabled={false}
			>
				Valider
			</Button>);
	}
	return (
		<>
			<Grid item xs={12}>
				<Grid
					container
					component={Paper}
					justifyContent="center"
					sx={{
						width: "100%",
					}}
				>
					<Spacer space={2} />
					<Grid
						item
						xs={3}
					>
						<Button
							onClick={() =>
							{
								props.setDisplayModalBox(false);
								props.setDisplayOpenButton(true);
							}}
						>
							annuler
						</Button>
					</Grid>
					<Spacer space={2} />
					<Spacer space={2} />
					<Grid
						item
						xs={3}
					>
						{buttonValidate}
					</Grid>
					<Spacer space={2} />
				</Grid>
			</Grid>
		</>
	);
};

export default ButtonGroup;
