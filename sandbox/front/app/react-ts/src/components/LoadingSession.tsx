import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";


const style = {
	// eslint-disable-next-line @typescript-eslint/prefer-as-const
	position: "absolute" as "absolute",
	top: "50%",
	left: "50%",
	transform: "translate(-50%, -50%)",
	width: 400,
	bgcolor: "background.paper",
	border: "2px solid #000",
	boxShadow: 24,
	p: 4,
};

const	modalTitle = <>Text in a modal</>;

const	modalDescription = <>Modal Description</>;

const	LoadingSession = () =>
{
	return (
		<>
			<Modal
				open={true}
				aria-labelledby="modal-modal-title"
				aria-describedby="modal-modal-description"
			>
				<Box sx={style}>
					<Typography
						id="modal-modal-title"
						variant="h6"
						component="h2"
					>
						{ modalTitle }
					</Typography>
					<Typography id="modal-modal-description" sx={{mt: 2}}>
						{ modalDescription }
					</Typography>
				</Box>
			</Modal>
		</>
	);
};

export default LoadingSession;