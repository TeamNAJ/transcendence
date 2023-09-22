import { useEffect } from "react";
import MenuBar from "../../Component/MenuBar/MenuBar";
import { useSavePrevPage } from "../../Router/Hooks/useSavePrevPage";
import Chat from "../Chat/Chat";
import { ChatWrapper } from "../Chat/ChatWrapper";
import { useAppSelector } from "../../Redux/hooks/redux-hooks";

const	Home = () =>
{
	const	savePrevPage = useSavePrevPage();

	useEffect(() =>
	{
		savePrevPage("/");
	});
	
	const header = <MenuBar />;

	const body = 
		<>
			<h1>home view</h1>
		</>;

	return (
		<>
			{header}
			{body}
		</>
	);
};

export default Home;
