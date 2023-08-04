import { configureStore} from "@reduxjs/toolkit";
import controllerSlice from "./controller-slice";
import
{
	persistStore,
	persistReducer,
	FLUSH,
	REHYDRATE,
	PAUSE,
	PERSIST,
	PURGE,
	REGISTER
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import serverSlice from "./server-slice";

const	persistConfig = {
	key: "root",
	// version: 2,
	storage
};

const	persistedControllerReducer = persistReducer(
	persistConfig, controllerSlice.reducer);

export const	store = configureStore(
{
	reducer:
	{
		controller: persistedControllerReducer,
		server: serverSlice.reducer
	},
	middleware: (getDefaultMiddleware) =>
	{
		return (getDefaultMiddleware(
		{
			serializableCheck:
			{
				ignoredActions:
				[
					FLUSH,
					REHYDRATE,
					PAUSE,
					PERSIST,
					PURGE,
					REGISTER
				],
			}
		}));
	}
});

export type	RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const persistor = persistStore(store);