// auth-modal.js
// Модуль для управления формой авторизации

import { showNotification } from './utils.js';
import { SoloModeManager } from './solo-mode.js';

/**
 * Класс для управления модальным окном авторизации
 */
export class AuthModal {
    /**
     * Конструктор класса AuthModal
     * @param {Object} socketService - Экземпляр сервиса сокетов
     * @param {Object} codeEditorManager - Экземпляр менеджера редакторов кода
     * @param {Object} cursorManager - Экземпляр менеджера курсоров
     */
    constructor(socketService, codeEditorManager, cursorManager) {
        this.socketService = socketService;
        this.codeEditorManager = codeEditorManager;
        this.cursorManager = cursorManager;
        this.loginModal = null;
        this.loginFormModal = null;
        this.collaborativeModeBtn = null;
        this.soloModeBtn = null;
        this.backToMainBtn = null;
        this.loginForm = null;
        this.teamNameInput = null;
        this.errorMsg = null;
        this.initOverlay = null;
        this.initialized = false;
        this.isSoloMode = false;
        this.soloModeManager = null;

        // Инициализация
        this._initialize();
    }

    /**
     * Инициализация модального окна
     * @private
     */
    _initialize() {
        try {
            // Находим элементы DOM
            this.loginModal = document.getElementById('login-modal');
            this.loginFormModal = document.getElementById('login-form-modal');
            this.collaborativeModeBtn = document.getElementById('collaborative-mode-btn');
            this.soloModeBtn = document.getElementById('solo-mode-btn');
            this.backToMainBtn = document.getElementById('back-to-main');
            this.loginForm = document.getElementById('login-form');
            this.teamNameInput = document.getElementById('team-name');
            this.errorMsg = document.getElementById('error-notification');
            this.initOverlay = document.getElementById('init-overlay');

            if (!this.loginModal) {
                console.error('Модальное окно входа не найдено (login-modal)');
            }
            if (!this.loginFormModal) {
                console.error('Модальное окно формы входа не найдено (login-form-modal)');
            }
            if (!this.collaborativeModeBtn) {
                console.error('Кнопка совместного режима не найдена (collaborative-mode-btn)');
            }
            if (!this.soloModeBtn) {
                console.error('Кнопка одиночного режима не найдена (solo-mode-btn)');
            }
            if (!this.loginForm) {
                console.error('Форма входа не найдена (login-form)');
            }
            if (!this.teamNameInput) {
                console.error('Поле ввода имени команды не найдено (team-name)');
            }

            // Создаем менеджер одиночного режима
            this.soloModeManager = new SoloModeManager(this.codeEditorManager);

            // Настраиваем обработчики событий
            this._setupEventListeners();

            // Проверяем предыдущую авторизацию
            const hasAuth = this.checkAuth();

            // Если пользователь не авторизован, показываем окно выбора режима
            if (!hasAuth) {
                this.showLoginModal();
            }

            // Устанавливаем флаг инициализации
            this.initialized = true;

            console.log('Модальное окно авторизации успешно инициализировано');
        } catch (error) {
            console.error('Ошибка при инициализации модального окна авторизации:', error);
        }
    }

    /**
     * Проверка предыдущей авторизации
     */
    checkAuth() {
        // Проверяем режим работы
        const mode = localStorage.getItem('workMode');
        const userName = localStorage.getItem('userName');

        if (mode === 'solo' && userName) {
            // Одиночный режим
            console.log('Восстановление одиночного режима для пользователя:', userName);
            this.isSoloMode = true;
            this.initSoloMode(userName);
            this.hideLoginModals();
            return true;
        } else if (mode === 'collaborative') {
            // Совместный режим
            const teamName = localStorage.getItem('teamName');
            if (teamName) {
                // Пользователь уже авторизован, восстанавливаем сессию
                console.log('Восстановление совместного режима для команды:', teamName);
                this.isSoloMode = false;
                this.socketService.authorize(teamName);
                this.hideLoginModals();
                return true;
            }
        }

        return false;
    }

    /**
     * Инициализация одиночного режима
     * @param {string} userName - Имя пользователя
     */
    initSoloMode(userName) {
        // Сохраняем режим и имя пользователя
        localStorage.setItem('workMode', 'solo');
        localStorage.setItem('userName', userName);

        // Удаляем все курсоры при инициализации одиночного режима
        if (this.cursorManager) {
            this.cursorManager.removeAllCursors();
        }

        // Инициализируем менеджер одиночного режима
        this.soloModeManager.initialize(userName);

        // Показываем уведомление
        showNotification(`Вы вошли в одиночный режим как: ${userName}`, 'success');

        // Показываем основной контейнер
        this._showMainContainerAfterAuth();
    }

    /**
     * Показываем основной контейнер и скрываем логин после авторизации
     * @private
     */
    _showMainContainerAfterAuth() {
        // Скрываем модальное окно входа
        const loginModal = document.getElementById('login-modal');
        const loginFormModal = document.getElementById('login-form-modal');

        if (loginModal) {
            loginModal.style.display = 'none';
        }

        if (loginFormModal) {
            loginFormModal.style.display = 'none';
        }

        // Показываем основной контейнер
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.style.display = 'flex';
        }

        // Показываем счетчик пользователей только в совместном режиме
        const onlineUsersContainer = document.querySelector('.online-users');
        if (onlineUsersContainer) {
            onlineUsersContainer.style.display = this.isSoloMode ? 'none' : 'block';
        }

        // Показываем кнопку выхода
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.style.display = 'flex';
        }

        console.log('Основной контейнер показан после успешной авторизации');
    }

    /**
     * Показ модального окна входа
     */
    showLoginModal() {
        if (this.loginModal) {
            this.loginModal.style.display = 'flex';
        }
    }

    /**
     * Показать форму входа для совместного режима
     */
    showLoginForm() {
        console.log('Показываем форму входа для совместного режима');

        // Обновляем заголовок формы
        const formTitle = this.loginFormModal.querySelector('h2');
        if (formTitle) {
            formTitle.textContent = 'Вход в совместный режим';
        }

        // Обновляем плейсхолдер поля ввода
        if (this.teamNameInput) {
            this.teamNameInput.placeholder = 'Название команды';
        }

        if (this.loginFormModal) {
            console.log('Модальное окно формы входа найдено, устанавливаем display: flex');
            this.loginFormModal.style.display = 'flex';
        } else {
            console.error('Модальное окно формы входа не найдено');
        }

        if (this.loginModal) {
            console.log('Скрываем основное модальное окно входа');
            this.loginModal.style.display = 'none';
        } else {
            console.error('Основное модальное окно входа не найдено');
        }
    }

    /**
     * Показать форму входа для одиночного режима
     */
    showSoloLoginForm() {
        console.log('Показываем форму входа для одиночного режима');

        // Обновляем заголовок формы
        const formTitle = this.loginFormModal.querySelector('h2');
        if (formTitle) {
            formTitle.textContent = 'Вход в одиночный режим';
        }

        // Обновляем плейсхолдер поля ввода
        if (this.teamNameInput) {
            this.teamNameInput.placeholder = 'Ваше имя';
        }

        if (this.loginFormModal) {
            this.loginFormModal.style.display = 'flex';
        } else {
            console.error('Модальное окно формы входа не найдено');
        }

        if (this.loginModal) {
            this.loginModal.style.display = 'none';
        } else {
            console.error('Основное модальное окно входа не найдено');
        }

        // Удаляем все курсоры при переходе в одиночный режим
        if (this.cursorManager) {
            this.cursorManager.removeAllCursors();
        }

        // Устанавливаем флаг одиночного режима
        this.isSoloMode = true;
        localStorage.setItem('workMode', 'solo');
    }

    /**
     * Скрытие модальных окон входа
     */
    hideLoginModals() {
        if (this.loginModal) {
            this.loginModal.style.display = 'none';
        }

        if (this.loginFormModal) {
            this.loginFormModal.style.display = 'none';
        }
    }

    /**
     * Выход из системы
     */
    logout() {
        // Сохраняем текущий режим для проверки
        const wasSoloMode = this.isSoloMode;

        // Если мы в одиночном режиме, деактивируем его
        if (this.isSoloMode && this.soloModeManager) {
            this.soloModeManager.deactivate();
        } else {
            // Отключаемся от сервера, если были в совместном режиме
            if (this.socketService) {
                this.socketService.disconnect();
            }
        }

        // Очищаем данные режима из localStorage
        localStorage.removeItem('workMode');

        // В зависимости от режима очищаем соответствующие данные
        if (wasSoloMode) {
            localStorage.removeItem('userName');
        } else {
            localStorage.removeItem('teamName');
        }

        // Удаляем все курсоры при выходе
        if (this.cursorManager) {
            this.cursorManager.removeAllCursors();
        }

        // Для обоих режимов принудительно перезагружаем страницу без запроса
        window.location.href = window.location.href.split('#')[0];
    }

    /**
     * Настройка обработчиков событий
     * @private
     */
    _setupEventListeners() {
        // Настраиваем обработчик для кнопки совместного режима
        if (this.collaborativeModeBtn) {
            this.collaborativeModeBtn.addEventListener('click', () => {
                // Устанавливаем режим работы
                localStorage.setItem('workMode', 'collaborative');
                this.isSoloMode = false;

                // Показываем форму входа
                this.showLoginForm();
            });
        } else {
            console.error('Кнопка совместного режима не найдена');
        }

        // Настраиваем обработчик для кнопки одиночного режима
        if (this.soloModeBtn) {
            this.soloModeBtn.addEventListener('click', () => {
                // Показываем форму входа для одиночного режима
                this.showSoloLoginForm();
            });
        } else {
            console.error('Кнопка одиночного режима не найдена');
        }

        // Настраиваем обработчик для кнопки "Назад"
        if (this.backToMainBtn) {
            this.backToMainBtn.addEventListener('click', () => {
                if (this.loginFormModal) {
                    this.loginFormModal.style.display = 'none';
                }
                if (this.loginModal) {
                    this.loginModal.style.display = 'flex';
                }
            });
        }

        // Настраиваем обработчик отправки формы
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => {
                this._handleLoginSubmit(e);
            });
        }

        // Настраиваем обработчик события ошибки авторизации
        document.addEventListener('auth_error', (event) => {
            // Показываем форму входа, если она была скрыта
            this.showLoginForm();

            // Очищаем поле ввода имени команды
            if (this.teamNameInput) {
                this.teamNameInput.value = '';
                this.teamNameInput.focus();
            }

            // Показываем сообщение об ошибке
            this._showError(event.detail.message);
        });

        // Настраиваем обработчик для кнопки выхода
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    }

    /**
     * Обработка отправки формы авторизации
     * @param {Event} event - Событие отправки формы
     * @private
     */
    _handleLoginSubmit(event) {
        event.preventDefault();

        const form = event.target;
        const teamNameInput = form.querySelector('#team-name');

        if (teamNameInput) {
            try {
                const inputValue = teamNameInput.value.trim();

                // Проверяем, что имя не пустое
                if (!inputValue) {
                    const errorMsg = this.isSoloMode ?
                        'Пожалуйста, введите ваше имя' :
                        'Пожалуйста, введите имя команды';
                    this._showError(errorMsg);
                    return;
                }

                if (this.isSoloMode) {
                    // Одиночный режим
                    this.initSoloMode(inputValue);
                    this.hideLoginModals();
                } else {
                    // Совместный режим
                    this.socketService.authorize(inputValue);
                }

            } catch (error) {
                console.error('Ошибка при авторизации:', error);
                this._showError('Произошла ошибка при авторизации');
            }
        }
    }

    /**
     * Показ сообщения об ошибке
     * @param {string} message - Текст сообщения об ошибке
     * @private
     */
    _showError(message) {
        showNotification(message, 'error');
    }
}

// Экспортируем только класс, экземпляр будет создаваться в app-initializer.js