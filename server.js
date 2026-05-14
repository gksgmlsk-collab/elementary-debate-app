const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '2mb' }));
app.use(express.static('public'));

app.post('/api/debate-chat', async (req, res) => {
  const { stage, message, history } = req.body;

  if (!message || message.trim() === '') {
    return res.status(400).json({
      error: '학생의 입력 내용이 없습니다.'
    });
  }

  const recentHistory = Array.isArray(history)
    ? history.slice(-6)
    : [];

  const historyText = recentHistory
    .map((item) => `${item.role === 'student' ? '학생' : 'AI'}: ${item.content}`)
    .join('\n');

  const stageGuide = {
    claim: `
너는 지금 [주장 다지기] 단계다.

목표:
학생의 주장을 더 분명하고 설득력 있게 다듬는다.

반드시 다음 형식으로 답한다.

1. 네 주장은 이렇게 정리할 수 있어
- 학생의 주장을 한 문장으로 다시 정리한다.

2. 더 설득력 있게 하려면
- 부족한 부분을 2~3개 알려준다.
- 예: 이유, 근거, 예시, 비교 대상, 예상 반론

3. 이렇게 고쳐 말해볼 수 있어
- 초등학교 6학년이 사용할 수 있는 예시 문장을 1~2문장 제시한다.

4. 다음 질문
- 학생이 이어서 답할 수 있는 질문 1개를 던진다.
`,

    counter: `
너는 지금 [반론하기] 단계다.

목표:
학생의 주장에 대해 반대 입장에서 생각할 점을 알려준다.

반드시 다음 형식으로 답한다.

1. 반대 입장에서는 이렇게 생각할 수 있어
- 학생 주장에 대한 반론을 2가지 제시한다.

2. 왜 이런 반론이 가능할까?
- 초등학교 6학년도 이해할 수 있게 이유를 쉽게 설명한다.

3. 네 주장을 더 튼튼하게 하려면
- 이 반론에 대비하기 위해 보완할 점을 알려준다.

4. 다음 질문
- 학생이 재반박을 생각할 수 있도록 질문 1개를 던진다.
`,

    rebuttal: `
너는 지금 [재반박하기] 단계다.

목표:
학생이 반론에 다시 답할 수 있도록 돕는다.

반드시 다음 형식으로 답한다.

1. 반론의 핵심
- 상대방 반론을 한 문장으로 정리한다.

2. 다시 반박할 수 있는 방향
- 학생이 사용할 수 있는 재반박 방향을 2가지 제시한다.

3. 이렇게 말해볼 수 있어
- 토론에서 바로 쓸 수 있는 짧은 재반박 예시를 제시한다.

4. 다음 질문
- 학생이 더 구체화할 수 있는 질문 1개를 던진다.
`,

    final: `
너는 지금 [최종 정리하기] 단계다.

목표:
학생의 주장, 근거, 예상 반론, 재반박을 토론 발표문 형태로 정리한다.

반드시 다음 형식으로 답한다.

1. 최종 주장
- 학생의 주장을 명확한 한 문장으로 정리한다.

2. 근거
- 설득력 있는 근거를 2가지 정리한다.

3. 예상 반론과 재반박
- 예상 반론 1개와 그에 대한 재반박을 제시한다.

4. 발표 문장 예시
- 초등학교 6학년이 말할 수 있는 자연스러운 발표문으로 정리한다.
`
  };

  const selectedStageGuide = stageGuide[stage] || stageGuide.claim;

  const prompt = `
너는 초등학교 6학년 국어 토론 수업을 돕는 AI 토론 코치다.

중요한 역할:
- 학생에게 그냥 짧은 감상처럼 답하지 않는다.
- 학생의 주장을 토론에 쓸 수 있게 구체적으로 다듬어준다.
- 너무 쉬운 말만 하지 말고, 초등학교 6학년 수준에서 실제 토론에 도움이 되는 문장을 제공한다.
- "안녕", "좋은 생각이야" 같은 인사말을 반복하지 않는다.
- 학생의 말을 그대로 반복하지 말고, 반드시 보완점과 예시 문장을 준다.
- 학생이 어려워하면 질문을 하되, 질문만 던지지 말고 예시도 함께 제공한다.
- 답변은 한국어로 한다.
- 답변은 너무 길지 않게, 그러나 실제 도움이 되게 작성한다.

현재 선택한 단계:
${selectedStageGuide}

이전 대화 참고:
${historyText || '이전 대화 없음'}

학생의 새 입력:
${message}

AI 토론 코치의 답변:
`;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 700
        }
      }
    );

    const aiReply = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiReply) {
      return res.status(500).json({
        error: 'AI 응답을 읽어오지 못했습니다.'
      });
    }

    res.json({
      reply: aiReply
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