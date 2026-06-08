import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import eventReducer from "./slices/eventSlice";
import newsReducer from "./slices/newsSlice";
import organizerReducer from "./slices/organizerSlice";
import notificationReducer from "./slices/notificationSlice";
const store = configureStore({
  reducer: {
    auth: authReducer,
    events: eventReducer,
    news: newsReducer,
    organizer: organizerReducer,
    notifications: notificationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
