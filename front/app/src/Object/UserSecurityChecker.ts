/* eslint-disable curly */
/* eslint-disable max-lines-per-function */
/* eslint-disable max-depth */
import { Public } from "@mui/icons-material";
import UserSecurity from "./UserSecurity";
/* eslint-disable max-statements */


class	UserSecurityChecker
{
	public	phoneNumber: boolean;

	constructor()
	{
		this.phoneNumber = false;
	}

	public checkNumber(data: UserSecurity)
	{
		this.resetError();
		if (data.doubleAuth)
		{
			let	tmp;
			tmp = data.phoneNumber;
			if (data.phoneNumber === undefined || data.phoneNumber === null
					|| data.phoneNumber.length === 0
					|| data.phoneNumber === "undefined")
				this.phoneNumber = true;
			else
			{
				if (data.phoneNumber?.length < 9
						|| data.phoneNumber?.length > 15)
					console.log("length");
					this.phoneNumber = true;
				if (data.phoneNumber[0] !== "+")
				{
					console.log("+ not here");
					console.log("tmp usersecuritychecker 36 ", tmp);
					tmp = tmp.slice(0, 1);
					console.log("tmp usersecuritychecker 38", tmp);
					this.phoneNumber = true;
				}
				if (isNaN(Number(tmp)))
					console.log("NaN");
					// this.phoneNumber = true;
			}
		}
	}

	// JE GARDE CETTE FONCTION POUR LES VERIFS TWILIO 

	// public	isValidFormat = (data: UserSecurity) =>
	// {
	// 	let	phone;
	// 	if (data.phoneNumber.length > 0 && data.phoneNumber.length < 14)
	// 	{
	// 		if (data.phoneNumber[0] === "+")
	// 		{
	// 			phone = data.phoneNumber.slice(0, 1);

	// 			if (Number(phone))
	// 			{
	// 				if (phone.length === 12)
	// 				{
	// 					if (phone[2] === "0")
	// 					{
	// 						phone.slice(2, 1);
	// 						data.phoneNumber[3].slice(3, 1);
	// 					}
	// 				}
	// 				else if (phone.length === 13)
	// 				{
	// 					if (phone[3] === "0")
	// 					{
	// 						data.phoneNumber.slice(4, 1);
	// 						phone.slice(3, 1);
	// 					}
	// 				}
	// 			}
	// 		}
	// 		console.log("Number ", this.phoneNumber, " et ", phone);
	// 		return (true);
	// 	}
	// 	return (false);
	// };

	public	resetError = () =>
	{
		this.phoneNumber = false;
	};

	public	getPhoneNumberCheck = () =>
	{
		return (this.phoneNumber);
	};
}

export default UserSecurityChecker;
