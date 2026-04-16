import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const getRooms = async () => {
  const rooms = await axios.get(`${API_URL}/rooms`);
  return rooms;
};

export const passRoom = async ({ roomId, password }) => {
  const res = await axios.post(`${API_URL}/rooms/pass`, { roomId, password });
  return res;
};
