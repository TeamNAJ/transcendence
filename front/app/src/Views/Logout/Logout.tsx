/* eslint-disable max-lines-per-function */
/* eslint-disable consistent-return */
/* eslint-disable max-statements */
import { useNavigate } from "react-router-dom";
import MenuBar from "../../Component/MenuBar/MenuBar";
// import { useAppSelector } from "../../Redux/hooks/redux-hooks";
// import { ContactsOutlined } from "@mui/icons-material";
import { reinitialiseUser } from "../../Redux/store/controllerAction";
import { Button } from "@mui/material";
import { useAppDispatch } from "../../Redux/hooks/redux-hooks";
import { useSavePrevPage } from "../../Router/Hooks/useSavePrevPage";

const	Logout = () =>
{
	const	navigate = useNavigate();
	const	dispatch = useAppDispatch();
	const	savePrevPage = useSavePrevPage();

	const	logUserOut = () =>
	{
		dispatch(reinitialiseUser(true));
		localStorage.clear();
		savePrevPage("/");
		navigate("/cancel");
	};

	return (
		<>
			<MenuBar />
			<Button onClick={logUserOut}>Log out</Button>
		</>
	);
};

export default Logout;
