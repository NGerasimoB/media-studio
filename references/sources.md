# Источники и принятые решения

Навык подготовлен для локального производства аудио и видео. Это синтез методов, не объединённый набор чужих системных инструкций. Прямой зависимости от скачанных GitHub-навыков нет. Сторонние скрипты не устанавливались и не запускались.

Исследование проведено 21.10.2026. Ниже указаны источники методов; код и установщики этих репозиториев в пакет не включены. Исследованные версии приведены в конце этой справки.

| Источник | Что использовано как метод | Что не перенесено |
|---|---|---|
| [remotion-dev/skills](https://github.com/remotion-dev/skills) | Кадровое время, React-композиции, локальные ассеты, пословные Caption, preview/export | Обязательный отдельный запрос на рендер, установка latest, неустановленные импорты |
| [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) | Смысл → сцена, визуальная система, детерминированная анимация, отдельные звуковые роли | Облачная авторизация, usage/телеметрия, автопереписывание навыков, обязательные опросы и делегирование |
| [blazerior/videoediting-claude-skill](https://github.com/blazerior/videoediting-claude-skill) | Пословный transcript → EDL → монтаж → перенесённые субтитры; визуальная проверка и пакетное переиспользование | Чужие ограничения инструментов, облачный Whisper, жёсткая смена zoom на каждой склейке |
| [bryanwhl/ffmpeg-video-editor](https://github.com/bryanwhl/ffmpeg-video-editor) | Probe, точность склейки, кодеки, фильтры, локальный экспорт | Unix-скрипты без Windows-адаптации, автоматические watermark и принудительные пресеты |
| [kajisho5/ffmpeg-skill](https://github.com/kajisho5/ffmpeg-skill) | Проверка реального результата и различение команд, наблюдений и утверждений | Отдельная большая исполнительная платформа и её вспомогательные dev-навыки |
| [kajisho5/audio-production-skill](https://github.com/kajisho5/audio-production-skill) | Явные операции звука, измерение нормализации и происхождение результата | Установка связанного графового стека, несовместимые предположения о версиях его зависимостей |
| [TimoteoAltobrando/ai-video-skill](https://github.com/TimoteoAltobrando/ai-video-skill) | Раздельные режимы новой постановки и монтажа; работа от материалов до доставки | Привязка к Claude, платные API/генерация видео, анкета и утверждение каждого шага |
| [Liamrjohnston/remotion-motion-graphics-skill](https://github.com/Liamrjohnston/remotion-motion-graphics-skill) | Причинное движение, реальные кадры и проверяемые ассеты | Узкий формат/фон, универсальные стилевые запреты, отдельные BUILD/DELIVERY gates |
| [social-media-skills/skills](https://github.com/social-media-skills/skills) | Самостоятельность клипа и отбор завершённых мыслей под новую аудиторию | Подмена монтажа рекомендацией платного SaaS, обязательный CTA и план публикаций |
| [SkillMedev/skills](https://github.com/SkillMedev/skills) | План сцен, разные визуальные языки, композиция формата и звуковые акценты | Одинаковая рекламная структура для всех видео и привязка каждой речевой склейки к музыкальной доле |

При создании проверена совместимость с `brag`, `opus-sound-layer` и `transcribe-local-media`. Эти соседние навыки подключаются, если установлены; их исходные договорённости и файлы не менялись. Remotion-пакеты и Hyperframes не переустанавливались. Неясная лицензия upstream является причиной не копировать его код; собственные helper-скрипты и инструкции написаны отдельно. Новые проверки не являются сертификацией всех скачанных репозиториев.

## Исследованные версии

- [remotion-dev/skills @ 039e8a2fc78b](https://github.com/remotion-dev/skills/tree/039e8a2fc78b67efc228d5645367838b85818a1c)
- [heygen-com/hyperframes @ 84f7965492ce](https://github.com/heygen-com/hyperframes/tree/84f7965492ce1753f8ddf367e9720978b33e896c)
- [bryanwhl/ffmpeg-video-editor @ d5c3ee6e9896](https://github.com/bryanwhl/ffmpeg-video-editor/tree/d5c3ee6e9896fdabccd4e8b5d68149252bbb682c)
- [blazerior/videoediting-claude-skill @ b9a2cbfe8753](https://github.com/blazerior/videoediting-claude-skill/tree/b9a2cbfe87537291252f7a6966aefe244dc49802)
- [kajisho5/ffmpeg-skill @ 4334225e4a61](https://github.com/kajisho5/ffmpeg-skill/tree/4334225e4a6184826799b724543c9462c00fc738)
- [kajisho5/audio-production-skill @ fd6e8f843c41](https://github.com/kajisho5/audio-production-skill/tree/fd6e8f843c4109dee1c6e5021e37ace463b7bfaf)
- [TimoteoAltobrando/ai-video-skill @ c6ecf8a66829](https://github.com/TimoteoAltobrando/ai-video-skill/tree/c6ecf8a66829dd39f600172506bef8206513236a)
- [Liamrjohnston/remotion-motion-graphics-skill @ b860c7921f22](https://github.com/Liamrjohnston/remotion-motion-graphics-skill/tree/b860c7921f2220b9e2a84e815ba0ae7b10858f08)
- [social-media-skills/skills @ f28cef2b7067](https://github.com/social-media-skills/skills/tree/f28cef2b7067ec64e79c9d85421c022c06659e03)
- [SkillMedev/skills @ 97a13607d669](https://github.com/SkillMedev/skills/tree/97a13607d669157a4a16d5ba79b77f208319f7b9)
