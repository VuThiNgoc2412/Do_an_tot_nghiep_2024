import axios from "axios";
import queryString from "query-string";
export const baseURL = `http://localhost:5000/api`;

const axiosClient = axios.create({
  baseURL: baseURL,
  paramsSerializer: (params) => queryString.stringify(params),
  withCredentials: true,
});

export default axiosClient;
