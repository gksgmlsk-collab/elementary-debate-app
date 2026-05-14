const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

app.post('/api/debate', async (req, res) => {
  const studentArgument = req.body.argument;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: `너는 초등학생 토론 수업용 AI 토론 코치다.
학생 주장에 대해 반대 입장에서 친절하고 논리적으로 반론해줘.
학생 주장: ${studentArgument}`
              }
            ]
          }
        ]
      }
    );

    const aiReply = response.data.candidates[0].content.parts[0].text;

    res.json({
      counterArgument: aiReply
    });

  } catch (error) {
    console.error(error.response?.data || error.message);

    res.status(500).json({
      error: JSON.stringify(error.response?.data || error.message, null, 2)
    });
  }
});

app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT}에서 실행 중입니다.`);
});