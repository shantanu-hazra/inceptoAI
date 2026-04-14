const USER_HOSTNAME = `${
  import.meta.env.VITE_REACT_APP_EXPRESS_SERVER_URL
}/api/users`;

export const loginPath = USER_HOSTNAME + "/login/";

export const signupPath = USER_HOSTNAME + "/signup/";

export const getResult = USER_HOSTNAME + "/interview/result/";

export const getAllResult = USER_HOSTNAME + "/results/";
