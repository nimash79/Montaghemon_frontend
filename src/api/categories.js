import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const getCategories = async ({all = true, disabled = false}) => {
  const categories = await axios.get(`${API_URL}/categories?all=${all}&disabled=${disabled}`);
  return categories;
};
