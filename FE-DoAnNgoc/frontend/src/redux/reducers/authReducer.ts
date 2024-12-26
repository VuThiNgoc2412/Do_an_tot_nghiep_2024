import { createSlice } from "@reduxjs/toolkit";
import { localDataNames } from "../../constants/appInfos";

export interface AuthState {
  accessToken: string;
  refreshToken: string;
  role: string;
}

const initialState = {
  accessToken: null,
  refreshToken: null,
  role: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState: {
    data: initialState,
  },
  reducers: {
    addAuth: (state, action) => {
      state.data = action.payload;
      syncLocal(action.payload);
    },
    removeAuth: (state, _action) => {
      state.data = initialState;
    },
  },
});

export const authReducer = authSlice.reducer;
export const { addAuth, removeAuth } = authSlice.actions;

export const authSeletor = (state: any) => state.authReducer.data;

export const syncLocal = (data: any) => {
  localStorage.setItem(localDataNames.authData, JSON.stringify(data));
};
