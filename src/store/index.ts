import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import eventReducer from "./slices/eventSlice";
import newsReducer from "./slices/newsSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    events: eventReducer,
    news: newsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
