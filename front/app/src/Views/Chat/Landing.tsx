/* eslint-disable max-statements */
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../Redux/hooks/redux-hooks";
import { setBigWindow } from "../../Redux/store/controllerAction";

export const	Landing = () =>
{
	const	navigate = useNavigate();
	const	controller = useAppSelector((state) =>
	{
		return (state.controller);
	});

	const	dispatch = useAppDispatch();

	if (controller.user.chat.window.bigWindow === false)
		dispatch(setBigWindow());
	setTimeout(() =>
	{
		navigate(controller.previousPage);
	}, 400);
	return (
		<>
			loading..
		</>);
};
