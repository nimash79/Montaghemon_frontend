import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const getTracks = async () => {
    const tracks = await axios.get(`${API_URL}/tracks`);
    return tracks;
}