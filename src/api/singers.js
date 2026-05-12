import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const getSingers = async () => {
  const singers = await axios.get(`${API_URL}/singers`);
  return singers;
};
