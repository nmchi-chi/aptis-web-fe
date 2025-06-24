import { takeLatest, put, call } from 'redux-saga/effects';
import axios from 'axios';
import { loginSuccess, loginFailure } from '../slices/authSlice';

interface LoginCredentials {
  username: string;
  password: string;
}

function* handleLogin(action: { type: string; payload: LoginCredentials }): Generator<any, void, any> {
  try {
    const credentials: LoginCredentials = action.payload;
    const response = yield call(axios.post, `${process.env.REACT_APP_API_URL}/auth/login`, credentials);
    
    // Extract user info from token
    const { access_token } = response.data;
    const tokenData = JSON.parse(atob(access_token.split('.')[1]));
    
    const user = {
      id: tokenData.id,
      username: tokenData.sub,
      fullname: tokenData.fullname,
      role: tokenData.role
    };
    
    yield put(loginSuccess({ token: access_token, user }));
  } catch (error: any) {
    let errorMsg = 'Đăng nhập thất bại';
    if (error.response && error.response.data && error.response.data.detail) {
      errorMsg = error.response.data.detail;
    }
    yield put(loginFailure(errorMsg));
  }
}

export function* authSaga() {
  yield takeLatest('auth/loginRequest', handleLogin);
} 