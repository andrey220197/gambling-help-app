"""
База тестов уровня B — Ежедневные и еженедельные тесты.
Показываются после онбординга, по ротации.

Кластеры:
B1 - Urge tests (тяга) — каждый день
B2 - Impulse susceptibility (импульсы) — через день
B3 - Trigger awareness (триггеры) — 2-3 раза в неделю
B4 - Emotional drift (эмоции) — каждый день
B5 - Stress reactivity (стресс) — 1-2 раза в неделю
B6 - Sleep & Energy — 2-4 раза в неделю, утром
B7 - Decision pressure — только при повышенном риске
"""

LEVEL_B_TESTS = {
    # =========================================
    # B1: URGE TESTS — ТЯГА (каждый день)
    # =========================================
    "B1_1": {
        "code": "B1_1",
        "level": "B",
        "cluster": "B1",
        "name_ru": "Уровень тяги",
        "description_ru": "Оцените силу тяги за сегодня",
        "track": "all",
        "frequency": "daily",
        "cooldown_days": 1,
        "questions": [
            {
                "code": "B1_1_Q1",
                "question_ru": "Насколько сильным сегодня было желание вернуться к прежнему поведению?",
                "answer_type": "scale_0_10",
                "scale_labels": ["Не было совсем", "", "", "", "", "", "", "", "", "", "Максимально сильное"],
            },
        ],
        "bot_responses": {
            "low": "Сегодня тяга была низкой — это хороший показатель баланса.",
            "medium": "Средний уровень тяги — полезно заметить, когда она усиливалась.",
            "high": "Тяга была высокой. Это не опасно само по себе — важно понимать триггеры.",
        },
    },

    "B1_2": {
        "code": "B1_2",
        "level": "B",
        "cluster": "B1",
        "name_ru": "Что вызвало тягу",
        "description_ru": "Определите триггеры сегодняшней тяги",
        "track": "all",
        "frequency": "daily",
        "show_on_high_urge": True,  # Показывать если urge >= 4
        "cooldown_days": 1,
        "questions": [
            {
                "code": "B1_2_Q1",
                "question_ru": "Что могло вызвать тягу сегодня?",
                "answer_type": "choice",
                "allow_multiple": True,
                "choices": [
                    "Стресс",
                    "Скука / пустота",
                    "Тревога",
                    "Конфликт / неприятный разговор",
                    "Плохие новости",
                    "Финансовые мысли",
                    "Реклама / уведомления",
                    "Спортивное событие / матч",
                    "Усталость",
                    "Просто привычка",
                    "Не знаю",
                ],
            },
        ],
        "bot_response": "Осознавать, что вызывает тягу — это первый шаг к управлению.",
    },

    "B1_3": {
        "code": "B1_3",
        "level": "B",
        "cluster": "B1",
        "name_ru": "Сила побуждения",
        "description_ru": "Насколько императивным было желание",
        "track": "all",
        "frequency": "daily",
        "cooldown_days": 2,
        "questions": [
            {
                "code": "B1_3_Q1",
                "question_ru": "Насколько императивным было желание (ощущалось как «надо сделать сейчас»)?",
                "answer_type": "scale_0_3",
                "scale_labels": ["Не было", "Слабое желание", "Чёткое стремление", "Почти непреодолимо"],
            },
        ],
    },

    "B1_4": {
        "code": "B1_4",
        "level": "B",
        "cluster": "B1",
        "name_ru": "Навязчивые мысли",
        "description_ru": "Как часто всплывали мысли о поведении",
        "track": "all",
        "frequency": "daily",
        "cooldown_days": 2,
        "questions": [
            {
                "code": "B1_4_Q1",
                "question_ru": "Как часто сегодня всплывали мысли о ставках/игре/поведении?",
                "answer_type": "scale_0_3",
                "scale_labels": ["Не всплывали", "Пару раз", "Периодически", "Постоянно"],
            },
        ],
    },

    "B1_5": {
        "code": "B1_5",
        "level": "B",
        "cluster": "B1",
        "name_ru": "Автоматизм",
        "description_ru": "Был ли момент автоматического действия",
        "track": "all",
        "frequency": "daily",
        "cooldown_days": 3,
        "questions": [
            {
                "code": "B1_5_Q1",
                "question_ru": "Был ли сегодня момент, когда вы могли бы сделать это автоматически, «на рефлексе»?",
                "answer_type": "yes_no",
            },
        ],
    },

    "B1_6": {
        "code": "B1_6",
        "level": "B",
        "cluster": "B1",
        "name_ru": "Способность откладывать",
        "description_ru": "Удалось ли переждать тягу",
        "track": "all",
        "frequency": "daily",
        "cooldown_days": 2,
        "questions": [
            {
                "code": "B1_6_Q1",
                "question_ru": "Удалось ли вам «переждать» момент тяги?",
                "answer_type": "scale_0_3",
                "scale_labels": ["Вообще нет", "Чуть-чуть", "Да, частично", "Полностью получилось"],
            },
        ],
        "bot_responses": {
            "low": "Переждать тягу сложно, но каждая попытка — это тренировка.",
            "high": "Отлично! Способность откладывать — это ключевой навык.",
        },
    },

    # =========================================
    # B2: IMPULSE SUSCEPTIBILITY — ИМПУЛЬСЫ (через день)
    # =========================================
    "B2_1": {
        "code": "B2_1",
        "level": "B",
        "cluster": "B2",
        "name_ru": "Импульсы от стресса",
        "description_ru": "Связь стресса и импульсивности",
        "track": "all",
        "frequency": "alternate_days",
        "cooldown_days": 2,
        "questions": [
            {
                "code": "B2_1_Q1",
                "question_ru": "Возникали ли импульсы на фоне стресса?",
                "answer_type": "scale_0_3",
                "scale_labels": ["Не возникали", "Слабые", "Заметные", "Сильные"],
            },
            {
                "code": "B2_1_Q2",
                "question_ru": "Чувствовали ли желание «сбежать» в привычное поведение, чтобы отвлечься?",
                "answer_type": "scale_0_3",
                "scale_labels": ["Нет", "Немного", "Да", "Очень сильно"],
            },
        ],
    },

    "B2_2": {
        "code": "B2_2",
        "level": "B",
        "cluster": "B2",
        "name_ru": "Импульсы от скуки",
        "description_ru": "Связь скуки и импульсивности",
        "track": "all",
        "frequency": "alternate_days",
        "cooldown_days": 2,
        "questions": [
            {
                "code": "B2_2_Q1",
                "question_ru": "Было ли ощущение, что «хочется сделать хоть что-то» из-за пустоты или скуки?",
                "answer_type": "scale_0_3",
                "scale_labels": ["Не было", "Немного", "Да", "Очень сильно"],
            },
            {
                "code": "B2_2_Q2",
                "question_ru": "Появлялось ли желание «разбудить мозг» чем-то резким?",
                "answer_type": "scale_0_3",
                "scale_labels": ["Нет", "Немного", "Да", "Очень сильно"],
            },
        ],
    },

    "B2_3": {
        "code": "B2_3",
        "level": "B",
        "cluster": "B2",
        "name_ru": "Импульсы от FOMO",
        "description_ru": "Страх упустить возможность",
        "track": "gambling,trading",
        "frequency": "alternate_days",
        "cooldown_days": 3,
        "questions": [
            {
                "code": "B2_3_Q1",
                "question_ru": "Было ли чувство, что «сейчас хороший момент», хотя фактов не было?",
                "answer_type": "yes_no",
            },
            {
                "code": "B2_3_Q2",
                "question_ru": "Возникала мысль: «упущу возможность, если не попробую»?",
                "answer_type": "yes_no",
            },
        ],
    },

    "B2_4": {
        "code": "B2_4",
        "level": "B",
        "cluster": "B2",
        "name_ru": "Импульсы после ошибок",
        "description_ru": "Желание компенсировать негатив",
        "track": "all",
        "frequency": "alternate_days",
        "cooldown_days": 3,
        "questions": [
            {
                "code": "B2_4_Q1",
                "question_ru": "Хотелось ли компенсировать плохое событие чем-то резким?",
                "answer_type": "scale_0_3",
                "scale_labels": ["Нет", "Немного", "Да", "Очень сильно"],
            },
            {
                "code": "B2_4_Q2",
                "question_ru": "Было ли чувство «надо снять напряжение быстрым способом»?",
                "answer_type": "scale_0_3",
                "scale_labels": ["Нет", "Немного", "Да", "Очень сильно"],
            },
        ],
    },

    # =========================================
    # B3: TRIGGER AWARENESS — ТРИГГЕРЫ (2-3 раза в неделю)
    # =========================================
    "B3_1": {
        "code": "B3_1",
        "level": "B",
        "cluster": "B3",
        "name_ru": "Эмоциональные триггеры",
        "description_ru": "Какие эмоции влияли сегодня",
        "track": "all",
        "frequency": "weekly_2_3",
        "cooldown_days": 2,
        "questions": [
            {
                "code": "B3_1_Q1",
                "question_ru": "Какие эмоции сегодня больше всего повлияли на вас?",
                "answer_type": "choice",
                "allow_multiple": True,
                "choices": [
                    "Тревога",
                    "Обида", 
                    "Скука",
                    "Раздражение",
                    "Усталость",
                    "Радость (хочу отметить)",
                    "Грусть",
                    "Одиночество",
                ],
            },
            {
                "code": "B3_1_Q2",
                "question_ru": "Было ли состояние, которое обычно предшествует тяге?",
                "answer_type": "yes_no",
            },
        ],
    },

    "B3_2": {
        "code": "B3_2",
        "level": "B",
        "cluster": "B3",
        "name_ru": "Ситуационные триггеры",
        "description_ru": "Внешние факторы",
        "track": "all",
        "frequency": "weekly_2_3",
        "cooldown_days": 3,
        "questions": [
            {
                "code": "B3_2_Q1",
                "question_ru": "Видели ли вы рекламу или уведомления, связанные с игрой/ставками?",
                "answer_type": "yes_no",
            },
            {
                "code": "B3_2_Q2",
                "question_ru": "Был ли «момент привычки» — место или время суток, где обычно играете?",
                "answer_type": "yes_no",
            },
            {
                "code": "B3_2_Q3",
                "question_ru": "Был ли лёгкий доступ к деньгам, который усилил тягу?",
                "answer_type": "yes_no",
            },
        ],
    },

    "B3_3": {
        "code": "B3_3",
        "level": "B",
        "cluster": "B3",
        "name_ru": "Социальные триггеры",
        "description_ru": "Влияние общения и отношений",
        "track": "all",
        "frequency": "weekly_2_3",
        "cooldown_days": 3,
        "questions": [
            {
                "code": "B3_3_Q1",
                "question_ru": "Конфликты или напряжённое общение повлияли на вас сегодня?",
                "answer_type": "scale_0_3",
                "scale_labels": ["Не было", "Немного", "Да", "Сильно"],
            },
            {
                "code": "B3_3_Q2",
                "question_ru": "Было ли ощущение одиночества, которое усиливало импульсы?",
                "answer_type": "scale_0_3",
                "scale_labels": ["Нет", "Немного", "Да", "Сильно"],
            },
        ],
    },

    "B3_4": {
        "code": "B3_4",
        "level": "B",
        "cluster": "B3",
        "name_ru": "Физиологические триггеры",
        "description_ru": "Влияние тела на импульсы",
        "track": "all",
        "frequency": "weekly_2_3",
        "cooldown_days": 3,
        "questions": [
            {
                "code": "B3_4_Q1",
                "question_ru": "Усталость усиливала тягу?",
                "answer_type": "yes_no",
            },
            {
                "code": "B3_4_Q2",
                "question_ru": "Недосып делал вас более импульсивным?",
                "answer_type": "yes_no",
            },
            {
                "code": "B3_4_Q3",
                "question_ru": "Голод или физический дискомфорт влияли на состояние?",
                "answer_type": "yes_no",
            },
        ],
    },

    # =========================================
    # B4: EMOTIONAL DRIFT — ЭМОЦИИ (каждый день)
    # =========================================
    "B4_1": {
        "code": "B4_1",
        "level": "B",
        "cluster": "B4",
        "name_ru": "Настроение и напряжение",
        "description_ru": "Базовый эмоциональный фон",
        "track": "all",
        "frequency": "daily",
        "cooldown_days": 1,
        "questions": [
            {
                "code": "B4_1_Q1",
                "question_ru": "Уровень настроения сегодня",
                "answer_type": "scale_0_10",
                "scale_labels": ["Очень плохое", "", "", "", "", "", "", "", "", "", "Отличное"],
            },
            {
                "code": "B4_1_Q2",
                "question_ru": "Уровень внутреннего напряжения",
                "answer_type": "scale_0_10",
                "scale_labels": ["Полный покой", "", "", "", "", "", "", "", "", "", "Максимальное напряжение"],
            },
        ],
    },

    "B4_2": {
        "code": "B4_2",
        "level": "B",
        "cluster": "B4",
        "name_ru": "Эмоциональная ясность",
        "description_ru": "Понимание своих эмоций",
        "track": "all",
        "frequency": "daily",
        "cooldown_days": 2,
        "questions": [
            {
                "code": "B4_2_Q1",
                "question_ru": "Насколько хорошо вы понимали сегодня свои эмоции?",
                "answer_type": "scale_0_3",
                "scale_labels": ["Совсем не понимал", "Плохо", "Нормально", "Хорошо понимал"],
            },
            {
                "code": "B4_2_Q2",
                "question_ru": "Было ли ощущение эмоционального тумана?",
                "answer_type": "yes_no",
            },
        ],
    },

    "B4_3": {
        "code": "B4_3",
        "level": "B",
        "cluster": "B4",
        "name_ru": "Способность справляться",
        "description_ru": "Копинг с эмоциями",
        "track": "all",
        "frequency": "daily",
        "cooldown_days": 2,
        "questions": [
            {
                "code": "B4_3_Q1",
                "question_ru": "Насколько получилось справиться с трудными эмоциями?",
                "answer_type": "scale_0_3",
                "scale_labels": ["Не получилось", "С трудом", "Нормально", "Хорошо"],
            },
            {
                "code": "B4_3_Q2",
                "question_ru": "Было ли чувство, что эмоции управляют вами?",
                "answer_type": "scale_0_3",
                "scale_labels": ["Нет", "Немного", "Да", "Полностью"],
            },
        ],
    },

    # =========================================
    # B5: STRESS REACTIVITY — СТРЕСС (1-2 раза в неделю)
    # =========================================
    "B5_1": {
        "code": "B5_1",
        "level": "B",
        "cluster": "B5",
        "name_ru": "Уровень стресса",
        "description_ru": "Оценка стрессовой нагрузки",
        "track": "all",
        "frequency": "weekly_1_2",
        "cooldown_days": 3,
        "questions": [
            {
                "code": "B5_1_Q1",
                "question_ru": "Уровень стресса сегодня",
                "answer_type": "scale_0_10",
                "scale_labels": ["Нет стресса", "", "", "", "", "", "", "", "", "", "Максимальный стресс"],
            },
            {
                "code": "B5_1_Q2",
                "question_ru": "Что было ближе к вашей реакции на стресс?",
                "answer_type": "choice",
                "choices": [
                    "Замереть, ничего не делать",
                    "Сделать резкое решение",
                    "Избежать ситуации",
                    "Искать быстрый выход / отвлечение",
                ],
            },
        ],
    },

    "B5_2": {
        "code": "B5_2",
        "level": "B",
        "cluster": "B5",
        "name_ru": "Контроль реакции",
        "description_ru": "Способность управлять реакцией на стресс",
        "track": "all",
        "frequency": "weekly_1_2",
        "cooldown_days": 4,
        "questions": [
            {
                "code": "B5_2_Q1",
                "question_ru": "Насколько хорошо вы контролировали свою реакцию на стресс?",
                "answer_type": "scale_0_3",
                "scale_labels": ["Не контролировал", "Плохо", "Нормально", "Хорошо"],
            },
            {
                "code": "B5_2_Q2",
                "question_ru": "Была ли мысль «я не справляюсь»?",
                "answer_type": "yes_no",
            },
        ],
    },

    # =========================================
    # B6: SLEEP & ENERGY — СОН И ЭНЕРГИЯ (2-4 раза в неделю, утром)
    # =========================================
    "B6_1": {
        "code": "B6_1",
        "level": "B",
        "cluster": "B6",
        "name_ru": "Качество сна",
        "description_ru": "Оценка ночного сна",
        "track": "all",
        "frequency": "weekly_2_4",
        "cooldown_days": 2,
        "time_of_day": "morning",
        "questions": [
            {
                "code": "B6_1_Q1",
                "question_ru": "Как вы спали?",
                "answer_type": "scale_0_10",
                "scale_labels": ["Очень плохо", "", "", "", "", "", "", "", "", "", "Отлично"],
            },
            {
                "code": "B6_1_Q2",
                "question_ru": "Были ли тревожные или навязчивые мысли перед сном?",
                "answer_type": "yes_no",
            },
        ],
    },

    "B6_2": {
        "code": "B6_2",
        "level": "B",
        "cluster": "B6",
        "name_ru": "Уровень энергии",
        "description_ru": "Оценка энергии и бодрости",
        "track": "all",
        "frequency": "weekly_2_4",
        "cooldown_days": 2,
        "questions": [
            {
                "code": "B6_2_Q1",
                "question_ru": "Уровень энергии сейчас",
                "answer_type": "scale_0_10",
                "scale_labels": ["Полное истощение", "", "", "", "", "", "", "", "", "", "Полон сил"],
            },
            {
                "code": "B6_2_Q2",
                "question_ru": "Проснулись ли вы с мыслями о поведении (игре/ставках)?",
                "answer_type": "yes_no",
            },
        ],
    },

    # =========================================
    # B7: DECISION PRESSURE — ДАВЛЕНИЕ РЕШЕНИЙ (при повышенном риске)
    # =========================================
    "B7_1": {
        "code": "B7_1",
        "level": "B",
        "cluster": "B7",
        "name_ru": "Иллюзия контроля",
        "description_ru": "Когнитивные искажения",
        "track": "gambling,trading",
        "frequency": "event",
        "min_risk_level": "medium",
        "show_on_high_urge": True,
        "cooldown_days": 3,
        "questions": [
            {
                "code": "B7_1_Q1",
                "question_ru": "Была ли мысль, что вы можете «исправить ситуацию одним действием»?",
                "answer_type": "yes_no",
            },
            {
                "code": "B7_1_Q2",
                "question_ru": "Было ли ощущение, что «в этот раз повезёт»?",
                "answer_type": "yes_no",
            },
            {
                "code": "B7_1_Q3",
                "question_ru": "Возникало ли чувство особого момента (что сейчас — удачное время)?",
                "answer_type": "yes_no",
            },
        ],
        "bot_response": "Эти мысли — признак когнитивного искажения. Результат не зависит от «момента» или «чутья».",
    },

    "B7_2": {
        "code": "B7_2",
        "level": "B",
        "cluster": "B7",
        "name_ru": "Риск как снятие напряжения",
        "description_ru": "Эмоциональная функция риска",
        "track": "gambling,trading",
        "frequency": "event",
        "min_risk_level": "medium",
        "cooldown_days": 3,
        "questions": [
            {
                "code": "B7_2_Q1",
                "question_ru": "Хотелось ли сделать рискованное действие, чтобы почувствовать облегчение?",
                "answer_type": "scale_0_3",
                "scale_labels": ["Нет", "Немного", "Да", "Очень сильно"],
            },
            {
                "code": "B7_2_Q2",
                "question_ru": "Было ли ощущение «надо сделать хоть что-то»?",
                "answer_type": "scale_0_3",
                "scale_labels": ["Нет", "Немного", "Да", "Очень сильно"],
            },
        ],
    },

    "B7_3": {
        "code": "B7_3",
        "level": "B",
        "cluster": "B7",
        "name_ru": "Эмоциональные решения",
        "description_ru": "Принятие решений под влиянием эмоций",
        "track": "all",
        "frequency": "event",
        "min_risk_level": "medium",
        "cooldown_days": 3,
        "questions": [
            {
                "code": "B7_3_Q1",
                "question_ru": "Принимали ли вы решения в состоянии сильных эмоций?",
                "answer_type": "yes_no",
            },
            {
                "code": "B7_3_Q2",
                "question_ru": "Была ли мысль «пофиг, сделаю и посмотрим»?",
                "answer_type": "yes_no",
            },
        ],
        "bot_response": "Решения под влиянием эмоций часто не соответствуют вашим реальным целям. Пауза помогает.",
    },
}


# Логика ротации тестов
DAILY_TEST_ROTATION = {
    "mandatory": ["B1_1", "B4_1"],  # Всегда: тяга + настроение
    "pool": {
        "B1": ["B1_2", "B1_3", "B1_4", "B1_5", "B1_6"],  # Доп. вопросы про тягу
        "B2": ["B2_1", "B2_2", "B2_3", "B2_4"],  # Импульсы
        "B3": ["B3_1", "B3_2", "B3_3", "B3_4"],  # Триггеры
        "B4": ["B4_2", "B4_3"],  # Доп. про эмоции
        "B5": ["B5_1", "B5_2"],  # Стресс
        "B6": ["B6_1", "B6_2"],  # Сон/энергия
    },
    "conditional": {
        "high_urge": ["B1_2", "B7_1", "B7_2"],  # При urge >= 7
        "high_stress": ["B5_1", "B5_2"],  # При stress >= 7
        "after_relapse": ["B1_2", "B3_1"],  # После срыва
    },
}
