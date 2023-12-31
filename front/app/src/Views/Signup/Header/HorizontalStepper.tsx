import Stepper from "@mui/material/Stepper";
import Box from "@mui/material/Box";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";

type	HorizontalStepperProps = {
	activeStep: number
};

const	steps = [
	"Connexion Intra 42",
	"Enregistrement utilisateur",
	"Securite compte"
];

const	HorizontalStepper = (props: HorizontalStepperProps) =>
{
	return (
		<Box
			sx={
			{
				width: "100%",
				m: 2
			}}
		>
			<Stepper activeStep={props.activeStep}>
			{
				steps.map((step) =>
				{
					return (
						<Step key={step}>
							<StepLabel>{step}</StepLabel>
						</Step>
					);
				})
			}
			</Stepper>
		</Box>
	);
};

export default HorizontalStepper;
