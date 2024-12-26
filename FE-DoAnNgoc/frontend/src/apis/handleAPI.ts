import axiosClient from "./axiosClient";

const handleAPI = async (
  url: string,
  data?: any,
  method?: "post" | "put" | "get" | "delete" | "patch"
) => {
  return await axiosClient(url, {
    method: method ?? "get",
    data,
  });
};
export default handleAPI;
