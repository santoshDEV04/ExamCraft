import api from './api';

const questionService = {
  // Get all subjects
  getSubjects: async () => {
    const response = await api.get('/questions/subjects');
    return response.data;
  },

  // Get topics (backend current has a mock list)
  getTopics: async () => {
    const response = await api.get('/questions/topics');
    return response.data;
  },

  // Get questions by filters
  getQuestions: async (filters) => {
    const response = await api.get('/questions', { params: filters });
    return response.data;
  },

  // Get single question
  getQuestion: async (id) => {
    const response = await api.get(`/questions/${id}`);
    return response.data;
  },

  /**
   * Process Uploaded Materials (Analyze topics)
   * @param {File[]} files - The array of uploaded materials.
   */
  uploadMaterial: async (files, title) => {
    const formData = new FormData();
    if (Array.isArray(files)) {
      files.forEach(f => formData.append('files', f));
    } else {
      formData.append('files', files);
    }
    formData.append('title', title || 'My Material Cluster');

    const response = await api.post('/questions/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data; // { material, detectedTopics }
  },

  /**
   * Directly upload raw text material (like syllabus or notes)
   */
  uploadText: async (text, title) => {
    const response = await api.post('/questions/upload', {
      text,
      title: title || 'Text Analysis'
    });
    return response.data;
  },

  /**
   * High-Performance AI Question Generation
   * @param {string} materialId - ID of analyzed study material.
   * @param {string} difficulty - "easy", "intermediate", "hard".
   * @param {string} questionCount - "5", "10", "15", "20".
   */
  processMaterial: async (materialId, difficulty, questionCount, topic, sessionId) => {
    const response = await api.post('/questions/process', {
      materialId,
      difficulty,
      topic,
      sessionId,
      questionCount: parseInt(questionCount) || 5
    });
    return response.data; // { material, questions }
  },

  // Get prerequisites for a topic
  getPrerequisites: async (topic) => {
    const response = await api.get(`/questions/prerequisites/${topic}`);
    return response.data;
  },
};

export default questionService;
