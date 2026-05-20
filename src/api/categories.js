import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const getCategories = async () => {
  const categories = await axios.get(`${API_URL}/categories`);
  return categories;
};
