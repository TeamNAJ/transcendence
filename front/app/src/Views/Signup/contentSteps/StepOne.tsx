import { useAppSelector } from "../../../Redux/hooks/redux-hooks";
import FirstStepFormContent from "./FirstStepFormContent";

const	StepOne = () =>
{
	const	controller = useAppSelector((state) =>
	{
		console.log("HEREEE ", state.controller.user.firstName);
		return (state.controller);
	});
	return (
		<>
			<FirstStepFormContent
				username={controller.user.username}
				email={controller.user.email}
				firstName={controller.user.firstName}
				lastName={controller.user.lastName} />
		</>
	);
};

export default StepOne;
