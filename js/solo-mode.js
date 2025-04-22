// solo-mode.js
// Модуль для управления одиночным режимом редактирования кода

import { ChatbaseAIAssistant } from './chatbase-ai-assistant.js';

/**
 * Класс для управления одиночным режимом редактирования
 */
export class SoloModeManager {
    /**
     * Конструктор класса SoloModeManager
     * @param {Object} codeEditorManager - Экземпляр менеджера редакторов кода
     */
    constructor(codeEditorManager) {
        this.codeEditorManager = codeEditorManager;
        this.userName = '';
        this.isActive = false;
        this.htmlEditor = null;
        this.cssEditor = null;
        this.autoSaveInterval = null;
        this.autoSaveDelay = 5000; // 5 секунд
        this.chatbaseAI = null; // Чат с ИИ на основе Chatbase
    }

    /**
     * Инициализация одиночного режима
     * @param {string} userName - Имя пользователя
     */
    initialize(userName) {
        this.userName = userName;
        this.isActive = true;

        // Получаем редакторы кода напрямую из менеджера
        this.htmlEditor = this.codeEditorManager.htmlEditor;
        this.cssEditor = this.codeEditorManager.cssEditor;

        // Загружаем сохраненный код
        this.loadSavedCode();

        // Настраиваем автосохранение
        this.setupAutoSave();

        // Скрываем счетчик пользователей онлайн
        const onlineUsersContainer = document.querySelector('.online-users');
        if (onlineUsersContainer) {
            onlineUsersContainer.style.display = 'none';
        }

        // Обновляем заголовки редакторов
        this.updateEditorHeaders();

        // Инициализируем чат с ИИ на основе Chatbase
        this.initializeChatbaseAI();

        console.log(`Одиночный режим инициализирован для пользователя: ${userName}`);
    }

    /**
     * Инициализация чата с ИИ на основе Chatbase
     */
    async initializeChatbaseAI() {
        // Создаем контейнер для чата с ИИ
        const chatContainer = document.createElement('div');
        chatContainer.className = 'solo-mode-chat-container';

        // Находим подходящее место для размещения
        const rightPanel = document.querySelector('.right');
        if (rightPanel) {
            rightPanel.appendChild(chatContainer);
        }

        // Создаем и инициализируем чат с ИИ
        this.chatbaseAI = new ChatbaseAIAssistant();
        await this.chatbaseAI.initialize(chatContainer);

        console.log('Чат с ИИ на основе Chatbase успешно инициализирован');
    }

    /**
     * Обновление заголовков редакторов
     */
    updateEditorHeaders() {
        const htmlLastEditor = document.getElementById('last-html-editor');
        const cssLastEditor = document.getElementById('last-css-editor');

        if (htmlLastEditor) {
            htmlLastEditor.textContent = `(${this.userName})`;
        }

        if (cssLastEditor) {
            cssLastEditor.textContent = `(${this.userName})`;
        }
    }

    /**
     * Загрузка сохраненного кода
     */
    loadSavedCode() {
        try {
            // Загружаем HTML код
            const savedHtml = localStorage.getItem(`solo_html_${this.userName}`);
            if (savedHtml && this.htmlEditor) {
                // Используем метод установки значения для Monaco редактора
                this.codeEditorManager.setHtmlCode(savedHtml, 'local');
            }

            // Загружаем CSS код
            const savedCss = localStorage.getItem(`solo_css_${this.userName}`);
            if (savedCss && this.cssEditor) {
                // Используем метод установки значения для Monaco редактора
                this.codeEditorManager.setCssCode(savedCss, 'local');
            }

            // Обновляем предпросмотр
            this.updatePreview();

            console.log('Код успешно загружен из локального хранилища');
        } catch (error) {
            console.error('Ошибка при загрузке кода:', error);
        }
    }

    /**
     * Сохранение кода
     */
    saveCode() {
        try {
            if (!this.isActive) return;

            // Получаем текущий код из Monaco редакторов
            const htmlCode = this.htmlEditor ? this.htmlEditor.getValue() : '';
            const cssCode = this.cssEditor ? this.cssEditor.getValue() : '';

            // Сохраняем в localStorage
            localStorage.setItem(`solo_html_${this.userName}`, htmlCode);
            localStorage.setItem(`solo_css_${this.userName}`, cssCode);

            console.log('Код успешно сохранен в локальное хранилище');
        } catch (error) {
            console.error('Ошибка при сохранении кода:', error);
        }
    }

    /**
     * Настройка автосохранения
     */
    setupAutoSave() {
        // Очищаем предыдущий интервал, если он был
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }

        // Устанавливаем новый интервал
        this.autoSaveInterval = setInterval(() => {
            this.saveCode();
        }, this.autoSaveDelay);

        // Добавляем обработчики событий изменения кода
        // Для Monaco редакторов мы используем события изменения модели
        if (this.htmlEditor && this.htmlEditor.editor) {
            this.htmlEditor.editor.onDidChangeModelContent(() => {
                this.updatePreview();
            });
        }

        if (this.cssEditor && this.cssEditor.editor) {
            this.cssEditor.editor.onDidChangeModelContent(() => {
                this.updatePreview();
            });
        }
    }

    /**
     * Обновление предпросмотра
     */
    updatePreview() {
        try {
            // Используем встроенный механизм обновления предпросмотра
            if (window.appInitializer) {
                window.appInitializer._updatePreview(true, true); // Принудительное и мгновенное обновление
            } else {
                // Запасной вариант, если appInitializer недоступен
                const htmlCode = this.htmlEditor ? this.htmlEditor.getValue() : '';
                const cssCode = this.cssEditor ? this.cssEditor.getValue() : '';

                const iframe = document.getElementById('output');
                if (iframe) {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

                    // Очищаем документ
                    iframeDoc.open();

                    // Записываем HTML и CSS
                    iframeDoc.write(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <style>
                                /* Базовые стили для темной темы */
                                body {
                                    background-color: #1a1a1a;
                                    color: #e0e0e0;
                                    font-family: 'poppins', sans-serif;
                                    margin: 0;
                                    padding: 10px;
                                }
                                /* Пользовательские стили */
                                ${cssCode}
                            </style>
                        </head>
                        <body>${htmlCode}</body>
                        </html>
                    `);

                    iframeDoc.close();
                }
            }
        } catch (error) {
            console.error('Ошибка при обновлении предпросмотра:', error);
        }
    }

    /**
     * Деактивация одиночного режима
     */
    deactivate() {
        // Сохраняем код перед деактивацией
        this.saveCode();

        // Очищаем интервал автосохранения
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }

        // Деактивируем чат с ИИ, если он существует
        if (this.chatbaseAI) {
            this.chatbaseAI.deactivate();
            this.chatbaseAI = null;
        }

        // Удаляем контейнер чата с ИИ, если он существует
        const chatContainer = document.querySelector('.solo-mode-chat-container');
        if (chatContainer) {
            chatContainer.remove();
        }

        this.isActive = false;
        console.log('Одиночный режим деактивирован');
    }
}
