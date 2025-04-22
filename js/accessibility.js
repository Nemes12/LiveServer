/**
 * Модуль для управления функциями доступности
 */
export class AccessibilityManager {
    constructor() {
        this.settings = {
            fontSize: 'normal', // normal, large, x-large
            contrast: 'normal', // normal, high
            colorblind: 'normal', // normal, protanopia, deuteranopia, tritanopia
            animations: true // true - включены, false - отключены
        };

        // Загружаем сохраненные настройки
        this.loadSettings();

        // Инициализируем панель доступности
        this.initAccessibilityPanel();

        // Применяем настройки
        this.applySettings();

        // Обработчик для iframe
        this.setupIframeHandler();

        // Обработчик для Monaco
        this.setupMonacoHandler();
    }

    /**
     * Настройка обработчика для Monaco
     */
    setupMonacoHandler() {
        // Проверяем, загружен ли Monaco
        if (window.monaco) {
            // Если Monaco уже загружен, применяем настройки
            this.applySettingsToMonacoEditors();
        } else {
            // Если Monaco еще не загружен, добавляем обработчик события
            window.addEventListener('monaco_loaded', () => {
                // Применяем настройки после загрузки Monaco
                setTimeout(() => {
                    this.applySettingsToMonacoEditors();
                }, 500); // Небольшая задержка, чтобы редакторы успели инициализироваться
            });
        }

        // Периодическая проверка и обновление настроек
        setInterval(() => {
            if (window.monaco) {
                this.applySettingsToMonacoEditors();
            }
        }, 3000); // Проверяем каждые 3 секунды
    }

    /**
     * Настройка обработчика для iframe
     */
    setupIframeHandler() {
        const outputFrame = document.getElementById('output');
        if (outputFrame) {
            // Обработчик загрузки iframe
            outputFrame.addEventListener('load', () => {
                this.applySettingsToIframe(outputFrame);
            });

            // Периодическая проверка и обновление настроек
            setInterval(() => {
                this.applySettingsToIframe(outputFrame);
            }, 2000); // Проверяем каждые 2 секунды
        }
    }

    /**
     * Применение настроек к iframe
     */
    applySettingsToIframe(iframe) {
        if (iframe && iframe.contentDocument) {
            try {
                const frameHtml = iframe.contentDocument.documentElement;

                // Применяем размер шрифта
                frameHtml.classList.remove('font-size-normal', 'font-size-large', 'font-size-xlarge');
                frameHtml.classList.add(`font-size-${this.settings.fontSize}`);

                // Добавляем стили для iframe
                let style = iframe.contentDocument.getElementById('accessibility-styles');

                if (!style) {
                    style = iframe.contentDocument.createElement('style');
                    style.id = 'accessibility-styles';
                    iframe.contentDocument.head.appendChild(style);
                }

                style.textContent = `
                    html.font-size-large { font-size: 1.25em !important; }
                    html.font-size-xlarge { font-size: 1.5em !important; }
                    html.font-size-large *, html.font-size-xlarge * { font-size: inherit; }

                    /* Высокая контрастность */
                    html.contrast-high { filter: contrast(1.4); }
                    html.contrast-high body { background: #000 !important; color: #fff !important; }

                    /* Уменьшение анимаций */
                    html.reduce-animations * {
                        animation-duration: 0.001s !important;
                        transition-duration: 0.001s !important;
                    }
                `;

                // Применяем контрастность
                frameHtml.classList.remove('contrast-normal', 'contrast-high');
                frameHtml.classList.add(`contrast-${this.settings.contrast}`);

                // Применяем настройки анимаций
                if (this.settings.animations) {
                    frameHtml.classList.remove('reduce-animations');
                } else {
                    frameHtml.classList.add('reduce-animations');
                }
            } catch (e) {
                console.error('Ошибка при применении стилей к iframe:', e);
            }
        }
    }

    /**
     * Инициализация панели доступности
     */
    initAccessibilityPanel() {
        // Находим кнопку доступности и панель
        const accessibilityBtn = document.getElementById('accessibility-btn');
        const accessibilityPanel = document.getElementById('accessibility-panel');

        if (!accessibilityBtn || !accessibilityPanel) {
            console.error('Элементы панели доступности не найдены');
            return;
        }

        // Обработчик для открытия/закрытия панели
        accessibilityBtn.addEventListener('click', () => {
            accessibilityPanel.classList.toggle('show');

            // Обновляем ARIA-атрибуты
            const isExpanded = accessibilityPanel.classList.contains('show');
            accessibilityBtn.setAttribute('aria-expanded', isExpanded);

            // Фокус на первый элемент панели при открытии
            if (isExpanded) {
                const firstControl = accessibilityPanel.querySelector('button, select');
                if (firstControl) firstControl.focus();
            }
        });

        // Закрытие панели по клику вне её
        document.addEventListener('click', (event) => {
            if (!accessibilityPanel.contains(event.target) &&
                !accessibilityBtn.contains(event.target) &&
                accessibilityPanel.classList.contains('show')) {
                accessibilityPanel.classList.remove('show');
                accessibilityBtn.setAttribute('aria-expanded', 'false');
            }
        });

        // Обработчики для элементов управления
        this.setupFontSizeControls();
        this.setupContrastControls();
        this.setupColorBlindControls();
        this.setupAnimationControls();

        // Добавляем обработчик для кнопки сброса
        const resetBtn = document.getElementById('accessibility-reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetSettings());
        }
    }

    /**
     * Настройка контролов размера шрифта
     */
    setupFontSizeControls() {
        const fontNormal = document.getElementById('font-normal');
        const fontLarge = document.getElementById('font-large');
        const fontXLarge = document.getElementById('font-xlarge');

        if (fontNormal) {
            fontNormal.addEventListener('click', () => {
                this.settings.fontSize = 'normal';
                this.applySettings();
                this.saveSettings();
                this.updateActiveButtons();
            });
        }

        if (fontLarge) {
            fontLarge.addEventListener('click', () => {
                this.settings.fontSize = 'large';
                this.applySettings();
                this.saveSettings();
                this.updateActiveButtons();
            });
        }

        if (fontXLarge) {
            fontXLarge.addEventListener('click', () => {
                this.settings.fontSize = 'xlarge';
                this.applySettings();
                this.saveSettings();
                this.updateActiveButtons();
            });
        }
    }

    /**
     * Настройка контролов контрастности
     */
    setupContrastControls() {
        const contrastNormal = document.getElementById('contrast-normal');
        const contrastHigh = document.getElementById('contrast-high');

        if (contrastNormal) {
            contrastNormal.addEventListener('click', () => {
                this.settings.contrast = 'normal';
                this.applySettings();
                this.saveSettings();
                this.updateActiveButtons();
            });
        }

        if (contrastHigh) {
            contrastHigh.addEventListener('click', () => {
                this.settings.contrast = 'high';
                this.applySettings();
                this.saveSettings();
                this.updateActiveButtons();
            });
        }
    }

    /**
     * Настройка контролов для режимов дальтонизма
     */
    setupColorBlindControls() {
        const colorblindSelect = document.getElementById('colorblind-mode');

        if (colorblindSelect) {
            colorblindSelect.addEventListener('change', () => {
                this.settings.colorblind = colorblindSelect.value;
                this.applySettings();
                this.saveSettings();
            });

            // Устанавливаем текущее значение
            colorblindSelect.value = this.settings.colorblind;
        }
    }

    /**
     * Настройка контролов для анимаций
     */
    setupAnimationControls() {
        const animationsToggle = document.getElementById('animations-toggle');

        if (animationsToggle) {
            animationsToggle.addEventListener('change', () => {
                this.settings.animations = animationsToggle.checked;
                this.applySettings();
                this.saveSettings();
            });

            // Устанавливаем текущее значение
            animationsToggle.checked = this.settings.animations;
        }
    }

    /**
     * Обновление активных кнопок в соответствии с текущими настройками
     */
    updateActiveButtons() {
        // Размер шрифта
        document.querySelectorAll('.font-size-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        const activeFontBtn = document.getElementById(`font-${this.settings.fontSize}`);
        if (activeFontBtn) activeFontBtn.classList.add('active');

        // Контрастность
        document.querySelectorAll('.contrast-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        const activeContrastBtn = document.getElementById(`contrast-${this.settings.contrast}`);
        if (activeContrastBtn) activeContrastBtn.classList.add('active');

        // Режим дальтонизма
        const colorblindSelect = document.getElementById('colorblind-mode');
        if (colorblindSelect) colorblindSelect.value = this.settings.colorblind;

        // Анимации
        const animationsToggle = document.getElementById('animations-toggle');
        if (animationsToggle) animationsToggle.checked = this.settings.animations;
    }

    /**
     * Применение настроек доступности
     */
    applySettings() {
        const html = document.documentElement;

        // Применяем размер шрифта
        html.classList.remove('font-size-normal', 'font-size-large', 'font-size-xlarge');
        html.classList.add(`font-size-${this.settings.fontSize}`);

        // Применяем контрастность
        html.classList.remove('contrast-normal', 'contrast-high');
        html.classList.add(`contrast-${this.settings.contrast}`);

        // Применяем режим дальтонизма
        html.classList.remove('colorblind-normal', 'colorblind-protanopia', 'colorblind-deuteranopia', 'colorblind-tritanopia');
        html.classList.add(`colorblind-${this.settings.colorblind}`);

        // Применяем настройки анимаций
        if (this.settings.animations) {
            html.classList.remove('reduce-animations');
        } else {
            html.classList.add('reduce-animations');
        }

        // Обновляем активные кнопки
        this.updateActiveButtons();

        // Применяем настройки к Monaco редакторам
        this.applySettingsToMonacoEditors();

        // Применяем настройки к iframe
        const outputFrame = document.getElementById('output');
        if (outputFrame) {
            this.applySettingsToIframe(outputFrame);
        }

        console.log('Применены настройки доступности:', this.settings);
    }

    /**
     * Применение настроек к Monaco редакторам
     */
    applySettingsToMonacoEditors() {
        // Проверяем, что Monaco доступен
        if (window.monaco) {
            try {
                // Определяем размер шрифта в зависимости от настроек
                let fontSize = 14; // Размер по умолчанию

                switch (this.settings.fontSize) {
                    case 'normal':
                        fontSize = 14;
                        break;
                    case 'large':
                        fontSize = 18;
                        break;
                    case 'xlarge':
                        fontSize = 22;
                        break;
                }

                // Получаем все экземпляры редактора Monaco
                const editors = monaco.editor.getEditors();

                // Применяем настройки к каждому редактору
                editors.forEach(editor => {
                    editor.updateOptions({
                        fontSize: fontSize,
                        lineHeight: fontSize * 1.5
                    });
                });

                console.log('Применены настройки к Monaco редакторам, размер шрифта:', fontSize);
            } catch (e) {
                console.error('Ошибка при применении настроек к Monaco редакторам:', e);
            }
        }
    }

    /**
     * Сохранение настроек в localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('accessibility-settings', JSON.stringify(this.settings));
            console.log('Настройки доступности сохранены');
        } catch (error) {
            console.error('Ошибка при сохранении настроек доступности:', error);
        }
    }

    /**
     * Загрузка настроек из localStorage
     */
    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('accessibility-settings');
            if (savedSettings) {
                this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
                console.log('Настройки доступности загружены:', this.settings);
            }
        } catch (error) {
            console.error('Ошибка при загрузке настроек доступности:', error);
        }
    }

    /**
     * Сброс настроек к значениям по умолчанию
     */
    resetSettings() {
        this.settings = {
            fontSize: 'normal',
            contrast: 'normal',
            colorblind: 'normal',
            animations: true
        };

        this.applySettings();
        this.saveSettings();
        console.log('Настройки доступности сброшены к значениям по умолчанию');
    }
}
