'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from 'ai/react';

// NPC角色定义
const characters = {
  alex: {
    name: "艾克斯",
    occupation: "数据分析师",
    color: "blue",
    gradient: "from-blue-500 to-blue-600",
    borderColor: "border-blue-400",
    textColor: "text-blue-400"
  },
  rachel: {
    name: "瑞秋", 
    occupation: "酒保",
    color: "pink",
    gradient: "from-pink-500 to-red-500",
    borderColor: "border-pink-400",
    textColor: "text-pink-400"
  },
  nova: {
    name: "诺娃",
    occupation: "原生AI", 
    color: "purple",
    gradient: "from-purple-500 to-indigo-500",
    borderColor: "border-purple-400",
    textColor: "text-purple-400"
  }
} as const;

type CharacterKey = keyof typeof characters;

export default function MirrorOfSelfMVP() {
  const [relationships, setRelationships] = useState({
    alex: 0,
    rachel: 20,
    nova: 10
  });
  
  const [userTendency, setUserTendency] = useState({
    tech: 0,
    human: 0,
    philosophy: 0
  });

  const [activeNPC, setActiveNPC] = useState<CharacterKey | null>(null);
  const [isNPCTalking, setIsNPCTalking] = useState(false);
  const [npcQueue, setNpcQueue] = useState<CharacterKey[]>([]);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: '/api/chat',
    body: {
      character: activeNPC,
      context: {
        userTendency,
        relationships
      }
    }
  });

  // 自动滚动到底部
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // 初始化对话
  useEffect(() => {
    const initConversation = async () => {
      // 添加初始消息
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: '欢迎来到2035年的新弧光城。三位AI居民想与你探讨一个深刻的问题...',
          createdAt: new Date()
        },
        {
          id: '2', 
          role: 'assistant',
          content: '你好，我是诺娃。我一直在思考一个问题：在这个AI与人类共存的2035年，你觉得什么才是真正重要的？',
          createdAt: new Date()
        }
      ]);
      
      // 模拟其他NPC的回应
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: '3',
          role: 'assistant', 
          content: '从数据角度看，效率和理性决策是最重要的。AI可以帮助人类做出更好的选择。',
          createdAt: new Date()
        }]);
      }, 2000);
      
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: '4',
          role: 'assistant',
          content: '我不这么认为。真正重要的是人与人之间的连接，是那些无法量化的温暖和理解。', 
          createdAt: new Date()
        }]);
      }, 4000);
    };
    
    initConversation();
  }, [setMessages]);

  // 分析用户消息倾向
  const analyzeUserMessage = (message: string) => {
    const techKeywords = ['技术', 'ai', '人工智能', '数据', '效率', '算法', '理性', '逻辑'];
    const humanKeywords = ['情感', '人情', '温暖', '直觉', '感觉', '心灵', '连接', '理解'];
    const philosophyKeywords = ['意义', '存在', '思考', '哲学', '为什么', '本质', '真理'];
    
    const lowerMessage = message.toLowerCase();
    let techScore = 0, humanScore = 0, philosophyScore = 0;
    
    techKeywords.forEach(keyword => {
      if (lowerMessage.includes(keyword)) techScore++;
    });
    
    humanKeywords.forEach(keyword => {
      if (lowerMessage.includes(keyword)) humanScore++;
    });
    
    philosophyKeywords.forEach(keyword => {
      if (lowerMessage.includes(keyword)) philosophyScore++;
    });
    
    // 更新用户倾向
    setUserTendency(prev => ({
      tech: prev.tech + techScore,
      human: prev.human + humanScore,
      philosophy: prev.philosophy + philosophyScore
    }));
    
    // 更新关系
    setRelationships(prev => ({
      alex: prev.alex + (techScore > 0 ? techScore * 5 : (humanScore > techScore ? -2 : 0)),
      rachel: prev.rachel + (humanScore > 0 ? humanScore * 5 : (techScore > humanScore ? -2 : 0)),
      nova: prev.nova + (philosophyScore > 0 ? philosophyScore * 5 : 1)
    }));
    
    return { techScore, humanScore, philosophyScore };
  };

  // 触发NPC回应序列
  const triggerNPCResponses = async (userMessage: string) => {
    const analysis = analyzeUserMessage(userMessage);
    setIsNPCTalking(true);
    
    // 确定回应顺序
    const responseOrder: CharacterKey[] = ['alex', 'rachel', 'nova'];
    
    for (let i = 0; i < responseOrder.length; i++) {
      const npcId = responseOrder[i];
      setActiveNPC(npcId);
      
      // 等待一段时间模拟思考
      await new Promise(resolve => setTimeout(resolve, 1000 + i * 500));
      
      // 调用AI API获取回应
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMessage,
            character: npcId,
            conversationHistory: messages.slice(-6).map(m => ({
              role: m.role,
              content: m.content
            })),
            context: {
              userTendency,
              relationships
            }
          })
        });
        
        if (response.ok) {
          const reader = response.body?.getReader();
          let npcResponse = '';
          
          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              const chunk = new TextDecoder().decode(value);
              const lines = chunk.split('\n');
              
              for (const line of lines) {
                if (line.startsWith('0:')) {
                  try {
                    const data = JSON.parse(line.slice(2));
                    if (data.content) {
                      npcResponse += data.content;
                    }
                  } catch (e) {
                    // 忽略解析错误
                  }
                }
              }
            }
          }
          
          // 添加NPC回应到消息列表
          if (npcResponse.trim()) {
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'assistant',
              content: npcResponse.trim(),
              createdAt: new Date()
            }]);
          }
        }
      } catch (error) {
        console.error(`Error getting response from ${npcId}:`, error);
        // 添加备用回应
        const fallbackResponses = {
          alex: "从数据角度分析，这是一个值得深入思考的观点。",
          rachel: "我觉得你说得很有道理，每个人都有自己的想法。",
          nova: "这让我思考...也许答案就在我们的对话中。"
        };
        
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant', 
          content: fallbackResponses[npcId],
          createdAt: new Date()
        }]);
      }
      
      // 等待一段时间再继续下一个NPC
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    setActiveNPC(null);
    setIsNPCTalking(false);
  };

  // 自定义提交处理
  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isNPCTalking) return;
    
    const userMessage = input.trim();
    
    // 添加用户消息
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      createdAt: new Date()
    }]);
    
    // 清空输入
    handleInputChange({ target: { value: '' } } as any);
    
    // 触发NPC回应
    await triggerNPCResponses(userMessage);
  };

  // 快捷消息
  const sendQuickMessage = (message: string) => {
    handleInputChange({ target: { value: message } } as any);
  };

  // 获取关系颜色
  const getRelationshipColor = (value: number) => {
    if (value > 20) return 'text-green-400';
    if (value < -10) return 'text-red-400';
    return 'text-yellow-400';
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <div className="container mx-auto max-w-4xl h-screen flex flex-col">
        
        {/* 标题区 */}
        <header className="p-6 border-b border-gray-700">
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              镜中探我 AI版
            </h1>
            <p className="text-gray-400 mt-2">2035年新弧光城 · 与AI居民的真实哲学对话</p>
            <p className="text-sm text-gray-500 mt-1">探索：未来十年，你想成为什么样的人？</p>
          </div>
        </header>

        {/* NPC状态栏 */}
        <div className="flex justify-center space-x-8 p-4 border-b border-gray-700 bg-gray-800">
          {(Object.keys(characters) as CharacterKey[]).map((charId) => {
            const char = characters[charId];
            const isActive = activeNPC === charId;
            
            return (
              <div key={charId} className={`flex flex-col items-center space-y-2 ${isActive ? 'animate-pulse' : ''}`}>
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${char.gradient} flex items-center justify-center ${isActive ? 'ring-2 ring-white' : ''}`}>
                  <span className="text-white font-bold text-sm">{char.name[0]}</span>
                </div>
                <div className="text-xs text-center">
                  <div className={`${char.textColor} font-semibold`}>{char.name}</div>
                  <div className="text-gray-400">{char.occupation}</div>
                  <div className={getRelationshipColor(relationships[charId])}>
                    关系: {relationships[charId] > 0 ? '+' : ''}{relationships[charId]}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 对话区域 */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {messages.map((message, index) => {
            if (message.role === 'user') {
              return (
                <div key={index} className="flex justify-end">
                  <div className="bg-blue-600 rounded-lg p-3 max-w-md">
                    <p className="text-white">{message.content}</p>
                  </div>
                </div>
              );
            } else {
              // 简单的NPC消息识别（实际项目中可以更精确）
              let npcId: CharacterKey = 'nova'; // 默认
              if (message.content.includes('数据') || message.content.includes('效率') || message.content.includes('分析')) {
                npcId = 'alex';
              } else if (message.content.includes('人情') || message.content.includes('温暖') || message.content.includes('感受')) {
                npcId = 'rachel';
              }
              
              const char = characters[npcId];
              
              return (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${char.gradient} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-xs font-bold">{char.name[0]}</span>
                  </div>
                  <div className={`bg-gray-800 rounded-lg p-3 max-w-md border-l-2 ${char.borderColor}`}>
                    <div className={`${char.textColor} text-sm font-semibold mb-1`}>{char.name}</div>
                    <p className="text-gray-200">{message.content}</p>
                  </div>
                </div>
              );
            }
          })}
          
          {isNPCTalking && (
            <div className="flex items-center space-x-2 text-gray-400">
              <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <span>AI居民正在思考...</span>
            </div>
          )}
        </div>

        {/* 输入区域 */}
        <div className="p-4 border-t border-gray-700">
          <form onSubmit={handleCustomSubmit} className="flex space-x-2">
            <input 
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder={isNPCTalking ? "AI居民正在思考..." : "分享你的想法..."} 
              disabled={isNPCTalking}
              className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
            <button 
              type="submit"
              disabled={isNPCTalking || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              发送
            </button>
          </form>
          
          {/* 快捷话题按钮 */}
          {!isNPCTalking && (
            <div className="flex flex-wrap gap-2 mt-3">
              <button 
                onClick={() => sendQuickMessage('我对AI技术很感兴趣')} 
                className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-full transition-colors"
              >
                对AI技术感兴趣
              </button>
              <button 
                onClick={() => sendQuickMessage('我更重视人与人的真实连接')} 
                className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-full transition-colors"
              >
                重视人际连接
              </button>
              <button 
                onClick={() => sendQuickMessage('我在思考存在的意义')} 
                className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-full transition-colors"
              >
                思考存在意义
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}