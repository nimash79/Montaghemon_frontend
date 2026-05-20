import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const getTracks = async () => {
    const tracks = await axios.get(`${API_URL}/tracks`);
    return tracks;
}

export const addFavorite = async ({roomId, trackId}) => {
    return axios.post(`${API_URL}/tracks/add-favorite`, {roomId, trackId});
}

export const removeFavorite = async ({roomId, trackId}) => {
    return axios.post(`${API_URL}/tracks/remove-favorite`, {roomId, trackId});
}

export const getTrack = async (id) => {
    const tracks = await axios.get(`${API_URL}/tracks/get-track/${id}`);
    return tracks;
}