// chatbase-ai-assistant.js
// Модуль для чата с ИИ в одиночном режиме с использованием Chatbase

/**
 * Класс для управления чатом с ИИ на основе Chatbase
 */
export class ChatbaseAIAssistant {
    /**
     * Конструктор класса ChatbaseAIAssistant
     */
    constructor() {
        this.isInitialized = false;
        this.chatbaseScriptId = 'aiDYXxKhavqfTnCDNr0oz'; // ID вашего скрипта Chatbase (уникальный для каждого проекта)
    }

    /**
     * Инициализация интерфейса чата с ИИ
     * @param {Object} container - DOM-элемент для размещения интерфейса
     */
    async initialize(container) {
        this.container = container;

        // Создаем интерфейс
        this._createInterface();
        
        // Инициализируем Chatbase
        await this._initializeChatbase();
        
        console.log('Чат с ИИ на основе Chatbase инициализирован');
    }
    
    /**
     * Создание интерфейса чата
     * @private
     */
    _createInterface() {
        // Создаем основной контейнер
        const chatContainer = document.createElement('div');
        chatContainer.className = 'chatbase-ai-container';
        
        // Заголовок
        const header = document.createElement('div');
        header.className = 'chatbase-ai-header';
        header.innerHTML = '<h3>ИИ-помощник для HTML и CSS</h3>';
        
        // Контейнер для чата Chatbase
        const chatbaseContainer = document.createElement('div');
        chatbaseContainer.className = 'chatbase-chat-container';
        chatbaseContainer.id = 'chatbase-container';
        
        // Собираем всё вместе
        chatContainer.appendChild(header);
        chatContainer.appendChild(chatbaseContainer);
        
        // Добавляем в контейнер
        this.container.appendChild(chatContainer);
    }
    
    /**
     * Инициализация Chatbase
     * @private
     */
    async _initializeChatbase() {
        return new Promise((resolve) => {
            // Проверяем, не загружен ли уже скрипт Chatbase
            if (document.getElementById(this.chatbaseScriptId)) {
                this.isInitialized = true;
                resolve();
                return;
            }
            
            // Инициализируем Chatbase
            (function(){
                if(!window.chatbase || window.chatbase("getState") !== "initialized") {
                    window.chatbase = (...args) => {
                        if(!window.chatbase.q) {
                            window.chatbase.q = [];
                        }
                        window.chatbase.q.push(args);
                    };
                    
                    window.chatbase = new Proxy(window.chatbase, {
                        get(target, prop) {
                            if(prop === "q") {
                                return target.q;
                            }
                            return (...args) => target(prop, ...args);
                        }
                    });
                }
            })();
            
            // Создаем и добавляем скрипт
            const script = document.createElement('script');
            script.src = 'https://www.chatbase.co/embed.min.js';
            script.id = this.chatbaseScriptId;
            script.onload = () => {
                this.isInitialized = true;
                
                // Настраиваем Chatbase для отображения в нашем контейнере
                if (window.chatbase) {
                    window.chatbase('config', {
                        chatbotId: this.chatbaseScriptId,
                        domain: 'www.chatbase.co',
                        container: '#chatbase-container',
                        width: '100%',
                        height: '500px',
                        chatflowId: this.chatbaseScriptId
                    });
                }
                
                resolve();
            };
            
            document.body.appendChild(script);
        });
    }
    
    /**
     * Деактивация чата
     */
    deactivate() {
        // Удаляем контейнер чата, если он существует
        const chatContainer = document.querySelector('.chatbase-ai-container');
        if (chatContainer) {
            chatContainer.remove();
        }
        
        this.isInitialized = false;
    }
}
