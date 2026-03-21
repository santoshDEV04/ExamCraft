import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const sessionService = {
    getAllSessions: async () => {
        const response = await axios.get(`${API_URL}/sessions`, { withCredentials: true });
        return response.data;
    },

    getSessionById: async (id) => {
        const response = await axios.get(`${API_URL}/sessions/${id}`, { withCredentials: true });
        return response.data;
    },

    completeSession: async (id) => {
        const response = await axios.patch(`${API_URL}/sessions/${id}/complete`, {}, { withCredentials: true });
        return response.data;
    },

    deleteSession: async (id) => {
        const response = await axios.delete(`${API_URL}/sessions/${id}`, { withCredentials: true });
        return response.data;
    },

    toggleBookmark: async (id, questionId) => {
        const response = await axios.patch(`${API_URL}/sessions/${id}/bookmark`, { questionId }, { withCredentials: true });
        return response.data;
    },
    
    viewSolution: async (id, questionId) => {
        const response = await axios.patch(`${API_URL}/sessions/${id}/view-solution`, { questionId }, { withCredentials: true });
        return response.data;
    }
};

export default sessionService;
