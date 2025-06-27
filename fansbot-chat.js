/**
 * Fansbot 聊天组件 - 专为 WangXiRui 的个人学术网站设计
 * 提供AI分身聊天功能，让访客可以与您的AI助手对话
 */

class FansBot {
    constructor(config = {}) {
        this.config = {
            apiUrl: config.apiUrl || 'http://localhost:8000',
            fallbackApiUrl: config.fallbackApiUrl || 'http://localhost:8000',
            theme: config.theme || 'academic',
            position: config.position || 'bottom-right',
            userId: config.userId || this.generateUserId(),
            demoMode: config.demoMode || false,
            ...config
        };
        
        this.isOpen = false;
        this.conversationId = null;
        this.messages = [];
        this.isApiConnected = false;
        
        this.init();
    }
    
    generateUserId() {
        return 'visitor_' + Math.random().toString(36).substr(2, 9);
    }
    
    init() {
        this.createStyles();
        this.createChatWidget();
        this.bindEvents();
    }
    
    createStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Fansbot 聊天组件样式 - 学术风格 */
            .fansbot-widget {
                position: fixed;
                ${this.config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
                ${this.config.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
                z-index: 10000;
                font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
            }
            
            .fansbot-toggle {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(135deg, #800000 0%, #A6192E 100%);
                border: none;
                cursor: pointer;
                box-shadow: 0 4px 20px rgba(128, 0, 0, 0.3);
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 24px;
            }
            
            .fansbot-toggle:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 25px rgba(128, 0, 0, 0.4);
            }
            
            .fansbot-chat-window {
                position: absolute;
                ${this.config.position.includes('right') ? 'right: 0;' : 'left: 0;'}
                ${this.config.position.includes('bottom') ? 'bottom: 80px;' : 'top: 80px;'}
                width: 350px;
                height: 500px;
                background: white;
                border-radius: 16px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                display: none;
                flex-direction: column;
                overflow: hidden;
                border: 2px solid #800000;
            }
            
            .fansbot-chat-window.open {
                display: flex;
                animation: slideUp 0.3s ease-out;
            }
            
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .fansbot-header {
                background: linear-gradient(135deg, #800000 0%, #A6192E 100%);
                color: white;
                padding: 16px;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            
            .fansbot-header-info {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .fansbot-avatar {
                width: 35px;
                height: 35px;
                border-radius: 50%;
                background: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                color: #800000;
            }
            
            .fansbot-close {
                background: none;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
                padding: 5px;
                border-radius: 50%;
                transition: background 0.2s;
            }
            
            .fansbot-close:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            
            .fansbot-messages {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
                background: #FDF6EC;
            }
            
            .fansbot-message {
                margin-bottom: 16px;
                display: flex;
                gap: 8px;
            }
            
            .fansbot-message.user {
                flex-direction: row-reverse;
            }
            
            .fansbot-message-content {
                max-width: 80%;
                padding: 12px 16px;
                border-radius: 18px;
                line-height: 1.4;
                font-size: 14px;
            }
            
            .fansbot-message.user .fansbot-message-content {
                background: #800000;
                color: white;
                border-bottom-right-radius: 6px;
            }
            
            .fansbot-message.bot .fansbot-message-content {
                background: white;
                color: #333;
                border: 1px solid #e0e0e0;
                border-bottom-left-radius: 6px;
            }
            
            .fansbot-input-area {
                padding: 16px;
                border-top: 1px solid #e0e0e0;
                background: white;
                display: flex;
                gap: 8px;
            }
            
            .fansbot-input {
                flex: 1;
                border: 1px solid #ddd;
                border-radius: 20px;
                padding: 10px 16px;
                font-size: 14px;
                outline: none;
                transition: border-color 0.2s;
            }
            
            .fansbot-input:focus {
                border-color: #800000;
            }
            
            .fansbot-send {
                background: #800000;
                color: white;
                border: none;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s;
            }
            
            .fansbot-send:hover {
                background: #A6192E;
            }
            
            .fansbot-send:disabled {
                background: #ccc;
                cursor: not-allowed;
            }
            
            .fansbot-typing {
                display: flex;
                align-items: center;
                gap: 4px;
                color: #666;
                font-size: 12px;
                padding: 8px 16px;
            }
            
            .fansbot-typing-dots {
                display: flex;
                gap: 2px;
            }
            
            .fansbot-typing-dot {
                width: 4px;
                height: 4px;
                border-radius: 50%;
                background: #800000;
                animation: typing 1.4s infinite;
            }
            
            .fansbot-typing-dot:nth-child(2) {
                animation-delay: 0.2s;
            }
            
            .fansbot-typing-dot:nth-child(3) {
                animation-delay: 0.4s;
            }
            
            @keyframes typing {
                0%, 60%, 100% {
                    transform: translateY(0);
                    opacity: 0.5;
                }
                30% {
                    transform: translateY(-10px);
                    opacity: 1;
                }
            }
            
            .fansbot-welcome {
                text-align: center;
                padding: 20px;
                color: #666;
                font-size: 14px;
            }
            
            .fansbot-welcome h3 {
                color: #800000;
                margin: 0 0 8px 0;
                font-size: 16px;
            }
            
            /* 移动端适配 */
            @media (max-width: 480px) {
                .fansbot-chat-window {
                    width: calc(100vw - 40px);
                    height: calc(100vh - 100px);
                    right: 20px !important;
                    left: 20px !important;
                    bottom: 80px !important;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    createChatWidget() {
        const widget = document.createElement('div');
        widget.className = 'fansbot-widget';
        widget.innerHTML = `
            <button class="fansbot-toggle" title="与 WangXiRui 的AI分身聊天">
                🤖
            </button>
            <div class="fansbot-chat-window">
                <div class="fansbot-header">
                    <div class="fansbot-header-info">
                        <div class="fansbot-avatar">🎓</div>
                        <div>
                            <div style="font-weight: 600; font-size: 14px;">WangXiRui AI</div>
                            <div style="font-size: 12px; opacity: 0.8;">AI分身助手</div>
                        </div>
                    </div>
                    <button class="fansbot-close">×</button>
                </div>
                <div class="fansbot-messages">
                    <div class="fansbot-welcome">
                        <h3>👋 欢迎与我的AI分身对话！</h3>
                        <p>我是基于 WangXiRui 的聊天记录训练的AI助手。<br>
                        你可以询问关于我的研究、项目或任何感兴趣的话题。</p>
                    </div>
                </div>
                <div class="fansbot-input-area">
                    <input type="text" class="fansbot-input" placeholder="输入消息..." maxlength="500">
                    <button class="fansbot-send">➤</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(widget);
        this.widget = widget;
        this.messagesContainer = widget.querySelector('.fansbot-messages');
        this.input = widget.querySelector('.fansbot-input');
        this.sendButton = widget.querySelector('.fansbot-send');
    }
    
    bindEvents() {
        const toggle = this.widget.querySelector('.fansbot-toggle');
        const close = this.widget.querySelector('.fansbot-close');
        const chatWindow = this.widget.querySelector('.fansbot-chat-window');
        
        toggle.addEventListener('click', () => this.toggleChat());
        close.addEventListener('click', () => this.closeChat());
        
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        // 点击外部关闭
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.widget.contains(e.target)) {
                this.closeChat();
            }
        });
    }
    
    toggleChat() {
        if (this.isOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }
    
    openChat() {
        this.isOpen = true;
        this.widget.querySelector('.fansbot-chat-window').classList.add('open');
        this.input.focus();
    }
    
    closeChat() {
        this.isOpen = false;
        this.widget.querySelector('.fansbot-chat-window').classList.remove('open');
    }
    
    async sendMessage() {
        const message = this.input.value.trim();
        if (!message) return;
        
        // 添加用户消息
        this.addMessage(message, 'user');
        this.input.value = '';
        this.sendButton.disabled = true;
        
        // 显示输入状态
        this.showTyping();
        
        let botReply = '';
        
        // 如果启用演示模式或API不可用，使用预设回复
        if (this.config.demoMode || !this.isApiConnected) {
            botReply = this.getDemoReply(message);
            
            // 模拟网络延迟
            setTimeout(() => {
                this.hideTyping();
                this.addMessage(botReply, 'bot');
                this.sendButton.disabled = false;
            }, 1000 + Math.random() * 2000);
            return;
        }
        
        // 尝试API调用
        try {
            const response = await this.tryApiCall(message);
            this.isApiConnected = true;
            this.hideTyping();
            this.addMessage(response, 'bot');
            
        } catch (error) {
            console.error('Fansbot API 错误:', error);
            this.isApiConnected = false;
            this.hideTyping();
            
            // 使用演示回复作为降级方案
            botReply = this.getDemoReply(message);
            this.addMessage(botReply + '\n\n💡 (当前为演示模式，真实AI模型部署中)', 'bot');
        } finally {
            this.sendButton.disabled = false;
        }
    }
    
    async tryApiCall(message) {
        // 首先尝试主要API
        let response = await fetch(`${this.config.apiUrl}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                conversation_id: this.conversationId,
                user_id: this.config.userId
            }),
            timeout: 5000
        });
        
        // 如果主要API失败，尝试fallback API
        if (!response.ok && this.config.fallbackApiUrl !== this.config.apiUrl) {
            response = await fetch(`${this.config.fallbackApiUrl}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    conversation_id: this.conversationId,
                    user_id: this.config.userId
                }),
                timeout: 5000
            });
        }
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        this.conversationId = data.conversation_id;
        return data.response;
    }
    
    getDemoReply(message) {
        const msg = message.toLowerCase();
        
        // 预设的回复库
        const replies = {
            greetings: [
                "你好！我是王析睿的AI分身。很高兴认识你！😊",
                "嗨！欢迎来到我的学术页面，有什么可以帮助你的吗？",
                "Hello! 我是基于王析睿数据训练的AI助手，请问有什么问题吗？"
            ],
            research: [
                "我目前在华中科技大学机械科学与工程学院创新班学习，专注于AI和机器人技术研究。",
                "我的研究兴趣包括人工智能、机器人技术和Web3。正在参与一些有趣的项目！",
                "你可以在我的项目页面看到我的Virtual Pet项目，这是一个结合强化学习和动态NFT的有趣尝试。"
            ],
            projects: [
                "我最近在开发一个虚拟宠物项目，结合了强化学习和区块链技术。",
                "除了Virtual Pet项目，我还在探索AI分身技术，就像现在和你对话的这个系统！",
                "我对创新技术很感兴趣，经常在GitHub上分享一些开源项目。"
            ],
            personal: [
                "我是一个对技术充满热情的学生，喜欢探索AI、机器人和Web3的交叉领域。",
                "我的价值不在于完美，而在于潜力和行动力。我相信通过不断学习和实践来成长。",
                "我喜欢将理论知识转化为实际的项目，这样能更好地理解技术的本质。"
            ],
            contact: [
                "你可以通过邮箱 wangfansheng1122@outlook.com 联系我，或者在GitHub上找到我：wangfans248",
                "欢迎在GitHub上关注我的项目，我们可以一起交流技术！",
                "如果你对我的研究或项目感兴趣，随时可以联系我讨论。"
            ],
            default: [
                "这是一个很有趣的问题！作为AI分身，我正在学习如何更好地回答各种问题。",
                "我现在还在不断学习中。真实的AI模型部署后，我会更像真正的王析睿！",
                "感谢你的问题！虽然我现在是演示版本，但我会尽力帮助你了解更多关于王析睿的信息。",
                "这个问题很棒！等我的完整模型部署后，我们可以进行更深入的对话。"
            ]
        };
        
        // 简单的关键词匹配
        if (msg.includes('你好') || msg.includes('hello') || msg.includes('hi') || msg.includes('嗨')) {
            return this.getRandomReply(replies.greetings);
        } else if (msg.includes('研究') || msg.includes('学习') || msg.includes('专业') || msg.includes('research')) {
            return this.getRandomReply(replies.research);
        } else if (msg.includes('项目') || msg.includes('project') || msg.includes('github') || msg.includes('代码')) {
            return this.getRandomReply(replies.projects);
        } else if (msg.includes('你是谁') || msg.includes('自我介绍') || msg.includes('about') || msg.includes('介绍')) {
            return this.getRandomReply(replies.personal);
        } else if (msg.includes('联系') || msg.includes('邮箱') || msg.includes('contact') || msg.includes('找你')) {
            return this.getRandomReply(replies.contact);
        } else {
            return this.getRandomReply(replies.default);
        }
    }
    
    getRandomReply(replyArray) {
        return replyArray[Math.floor(Math.random() * replyArray.length)];
    }
    
    addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `fansbot-message ${type}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'fansbot-message-content';
        contentDiv.textContent = content;
        
        messageDiv.appendChild(contentDiv);
        
        // 移除欢迎消息
        const welcome = this.messagesContainer.querySelector('.fansbot-welcome');
        if (welcome) {
            welcome.remove();
        }
        
        this.messagesContainer.appendChild(messageDiv);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        
        this.messages.push({ content, type, timestamp: new Date() });
    }
    
    showTyping() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'fansbot-typing';
        typingDiv.innerHTML = `
            <span>WangXiRui AI 正在输入</span>
            <div class="fansbot-typing-dots">
                <div class="fansbot-typing-dot"></div>
                <div class="fansbot-typing-dot"></div>
                <div class="fansbot-typing-dot"></div>
            </div>
        `;
        
        this.messagesContainer.appendChild(typingDiv);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
    
    hideTyping() {
        const typing = this.messagesContainer.querySelector('.fansbot-typing');
        if (typing) {
            typing.remove();
        }
    }
}

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    // 检测API服务是否可用
    const apiUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:8000' 
        : 'https://your-api-domain.com'; // 替换为您的API域名
    
    window.fansbot = new FansBot({
        apiUrl: apiUrl,
        theme: 'academic',
        position: 'bottom-right'
    });
});

// 导出给其他脚本使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FansBot;
} 