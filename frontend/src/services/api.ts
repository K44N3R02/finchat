const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000/api';

export const sendEchoMessage = async (message: string) => {
  const response = await fetch(`${API_BASE_URL}/echo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  return response.json();
};

export const createChatStreamUrl = () => `${API_BASE_URL}/chat`;
