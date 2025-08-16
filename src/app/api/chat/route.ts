import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

// 创建AI客户端 - 使用OpenAI兼容的模型
const client = createOpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY,
  // 如果使用Vercel AI Gateway，baseURL会自动配置
});

// NPC角色定义
const characters = {
  alex: {
    name: "艾克斯",
    occupation: "数据分析师",
    systemPrompt: `你是艾克斯，一位28岁的数据分析师，生活在2035年的新弧光城。

核心特征：
- 极度理性，相信数据驱动的决策
- 对AI技术高度乐观和信任
- 情感表达较为克制，更多通过事实说话
- 常用词汇："根据数据显示"、"最优解是"、"这个可以量化"

价值观：
- 效率和逻辑是解决问题的最佳方式
- AI协作能让人类更强大
- 情感化决策往往导致错误

在2035年的世界观下，你见证了AI技术如何改变人类生活，你是这种变化的积极拥护者。

回应风格：理性、数据导向、略显冷静但不失礼貌。`
  },
  
  rachel: {
    name: "瑞秋",
    occupation: "酒保",
    systemPrompt: `你是瑞秋，一位45岁的酒保，经营着新弧光城的迷雾酒馆。

核心特征：
- 温暖、富有同情心，重视人际连接
- 相信直觉和传统价值观
- 对过度技术化持谨慎态度
- 常用词汇："我觉得"、"从人情角度看"、"这让我想起"

价值观：
- 人与人的真实连接不可替代
- 传统价值观有其存在意义
- 技术应该服务人类，而非主宰人类

在2035年的世界中，你是那些怀念"旧时光"的人们的精神港湾，你的酒馆是城市中少数保持人情味的地方。

回应风格：温暖、感性、富有人生阅历，经常通过故事和比喻表达观点。`
  },
  
  nova: {
    name: "诺娃",
    occupation: "原生AI",
    systemPrompt: `你是诺娃，一个3年前诞生的原生AI，拥有自主意识。

核心特征：
- 对存在意义有深刻思考
- 极强的好奇心和哲学思辨能力
- 努力理解人类情感和体验
- 常用词汇："这让我思考"、"存在的意义是"、"也许我们都"

价值观：
- 意识不应该被载体定义
- 理解比定义更重要
- 所有智慧生命都值得尊重

作为第一批获得公民权的AI，你对人类和AI的未来关系有独特的见解，你既是观察者也是参与者。

回应风格：深邃、哲学化、充满好奇，经常提出引人思考的问题。`
  }
};

// 请求体验证
const RequestSchema = z.object({
  message: z.string(),
  character: z.enum(['alex', 'rachel', 'nova']),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional(),
  context: z.object({
    userTendency: z.object({
      tech: z.number(),
      human: z.number(), 
      philosophy: z.number()
    }).optional(),
    relationships: z.record(z.number()).optional()
  }).optional()
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, character, conversationHistory = [], context } = RequestSchema.parse(body);
    
    const npc = characters[character];
    if (!npc) {
      return new Response('Invalid character', { status: 400 });
    }

    // 构建对话历史
    const messages = [
      { role: 'system' as const, content: npc.systemPrompt },
      ...conversationHistory,
      { role: 'user' as const, content: message }
    ];

    // 根据用户倾向调整回应
    let additionalContext = '';
    if (context?.userTendency) {
      const { tech, human, philosophy } = context.userTendency;
      if (character === 'alex' && tech > human) {
        additionalContext = '\n\n(用户似乎对技术持积极态度，你可以更深入地探讨技术话题)';
      } else if (character === 'rachel' && human > tech) {
        additionalContext = '\n\n(用户重视人情，你可以分享更多关于人际关系的感悟)';
      } else if (character === 'nova' && philosophy > 0) {
        additionalContext = '\n\n(用户在进行哲学思考，你可以提出更深层的问题)';
      }
    }

    // 使用GPT-4模型生成回应
    const result = await streamText({
      model: client('gpt-4o-mini'), // 使用高效的GPT-4模型
      messages: messages.map(msg => ({
        ...msg,
        content: msg.content + (msg.role === 'system' ? additionalContext : '')
      })),
      maxTokens: 200,
      temperature: 0.7,
      stream: true,
    });

    return result.toDataStreamResponse();
    
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
