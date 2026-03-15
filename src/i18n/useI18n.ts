import { useMemo } from "react";
import { useAppSettings } from "../settings/AppSettingsContext";

const TRANSLATIONS = {
  en: {
    common: {
      back: "Back",
      close: "Close",
      edit: "Edit",
      delete: "Delete",
      loading: "Loading...",
      settings: "Settings",
      updateAvailable: "New app version is available",
      updateNow: "Update now",
      installAvailable: "Install app to home screen",
      installNow: "Install"
    },
    home: {
      title: "Card Wallet",
      searchPlaceholder: "Search",
      categoriesAll: "All",
      loadingCards: "Loading cards...",
      empty: "No cards yet. Add your first loyalty card.",
      favorites: "Favorites",
      allCards: "All cards",
      cards: "Cards",
      addCard: "Add card",
      favoriteLabel: "Favorite",
      sortDateAdded: "By date added",
      sortAlphabetical: "By alphabet",
      sortUsage: "By usage"
    },
    form: {
      addTitle: "Add card",
      editTitle: "Edit card",
      storeName: "Store name",
      cardNumber: "Card number",
      barcodeType: "Barcode type",
      category: "Category",
      notes: "Notes (optional)",
      notesPlaceholder: "Store opening times, benefits, etc.",
      color: "Card color",
      favorite: "Favorite card",
      scan: "Scan barcode",
      scanTakePhoto: "Take photo",
      scanChoosePhoto: "Choose photo",
      scanChooseFile: "Choose file",
      save: "Save",
      update: "Update",
      saving: "Saving...",
      saveFailed: "Could not save card. Please try again.",
      colors: {
        blue: "Blue",
        green: "Green",
        orange: "Orange",
        purple: "Purple",
        gray: "Gray"
      },
      categories: {
        grocery: "Grocery",
        pharmacy: "Pharmacy",
        fashion: "Fashion",
        fuel: "Fuel",
        cafe: "Cafe",
        electronics: "Electronics",
        other: "Other"
      }
    },
    detail: {
      checkout: "Wallet view",
      cardNotFound: "Card not found",
      cardNotFoundText: "This card was deleted or does not exist.",
      favorite: "Favorite",
      unfavorite: "Unfavorite",
      deleteConfirm: "Delete {name}?",
      notes: "Notes",
      category: "Category",
      ean13: "EAN-13",
      code128: "CODE-128",
      qr: "QR",
      eanUnavailable: "Need at least 12 digits"
    },
    scanner: {
      hint: "Point camera at barcode or QR code",
      unavailable: "Camera permission denied or unavailable. Enter the number manually.",
      readFailed:
        "Could not recognize barcode/QR from the selected file. Try a clearer image."
    },
    settings: {
      title: "Settings",
      language: "Language",
      languageSystem: "System",
      languageEnglish: "English",
      languageRussian: "Russian",
      languageChuvash: "Chuvash",
      theme: "Theme",
      themeSystem: "System",
      themeVsCodeDark: "VS Code Dark+",
      themeVsCodeLight: "VS Code Light+",
      themeOled: "OLED Black",
      themeDracula: "Dracula",
      themeMonokai: "Monokai",
      themeSolarizedDark: "Solarized Dark",
      themeGithubLight: "GitHub Light",
      sync: "Cloud sync",
      syncServerUrl: "Server URL",
      syncServerUrlPlaceholder: "https://example.com",
      saveServerUrl: "Save URL",
      accountHint: "Account is optional. Use it only to sync cards between devices.",
      serverStatus: "Server status",
      serverChecking: "Checking...",
      serverOnline: "Online",
      serverOffline: "Offline",
      cloudCards: "Cards in cloud",
      cloudCardsValue: "{count} active ({total} total)",
      email: "Email",
      password: "Password",
      login: "Sign in",
      register: "Register",
      logout: "Sign out",
      syncNow: "Sync now",
      syncStatusSignedOut: "Not signed in. Local offline mode is active.",
      syncStatusSignedIn: "Signed in as {email}",
      syncStatusSuccess: "Sync completed",
      syncStatusFailed: "Sync failed",
      syncStateIdle: "Idle",
      syncStateScheduled: "Scheduled",
      syncStateSyncing: "Sync in progress...",
      syncStateRestoring: "Restoring from cloud...",
      syncStateSuccess: "Synchronized",
      syncStateError: "Sync error",
      lastSync: "Last sync",
      backup: "Backup",
      exportJson: "Export JSON",
      importJson: "Import JSON",
      exportSuccess: "Backup exported",
      exportFailed: "Export failed",
      importSuccess: "Imported {imported}, skipped {skipped}",
      importFailed: "Import failed",
      invalidBackup: "Invalid backup file format"
    },
    validation: {
      storeRequired: "Store name is required.",
      numberRequired: "Card number is required.",
      eanDigits: "EAN13 must contain 12 or 13 digits.",
      eanChecksum: "EAN13 check digit is invalid.",
      code128Length: "CODE128 must be 80 characters or fewer.",
      qrLength: "QR value must be 512 characters or fewer."
    }
  },
  ru: {
    common: {
      back: "Назад",
      close: "Закрыть",
      edit: "Изменить",
      delete: "Удалить",
      loading: "Загрузка...",
      settings: "Настройки",
      updateAvailable: "Доступна новая версия приложения",
      updateNow: "Обновить",
      installAvailable: "Установить приложение на главный экран",
      installNow: "Установить"
    },
    home: {
      title: "Кошелек карт",
      searchPlaceholder: "Поиск",
      categoriesAll: "Все",
      loadingCards: "Загрузка карт...",
      empty: "Пока нет карт. Добавьте первую карту.",
      favorites: "Избранные",
      allCards: "Все карты",
      cards: "Карты",
      addCard: "Добавить",
      favoriteLabel: "Избранная",
      sortDateAdded: "По дате добавления",
      sortAlphabetical: "По алфавиту",
      sortUsage: "По частоте использования"
    },
    form: {
      addTitle: "Новая карта",
      editTitle: "Редактирование",
      storeName: "Магазин",
      cardNumber: "Номер карты",
      barcodeType: "Тип штрихкода",
      category: "Категория",
      notes: "Заметки (необязательно)",
      notesPlaceholder: "Часы работы, условия скидок и т.д.",
      color: "Цвет карты",
      favorite: "Добавить в избранное",
      scan: "Сканировать",
      scanTakePhoto: "Сделать фото",
      scanChoosePhoto: "Выбрать фото",
      scanChooseFile: "Выбрать файл",
      save: "Сохранить",
      update: "Обновить",
      saving: "Сохранение...",
      saveFailed: "Не удалось сохранить карту. Попробуйте еще раз.",
      colors: {
        blue: "Синий",
        green: "Зеленый",
        orange: "Оранжевый",
        purple: "Фиолетовый",
        gray: "Серый"
      },
      categories: {
        grocery: "Продукты",
        pharmacy: "Аптека",
        fashion: "Одежда",
        fuel: "Топливо",
        cafe: "Кафе",
        electronics: "Электроника",
        other: "Другое"
      }
    },
    detail: {
      checkout: "Экран карты",
      cardNotFound: "Карта не найдена",
      cardNotFoundText: "Карта удалена или не существует.",
      favorite: "В избранное",
      unfavorite: "Убрать из избранного",
      deleteConfirm: "Удалить карту {name}?",
      notes: "Заметки",
      category: "Категория",
      ean13: "EAN-13",
      code128: "CODE-128",
      qr: "QR",
      eanUnavailable: "Нужно минимум 12 цифр"
    },
    scanner: {
      hint: "Наведите камеру на штрихкод или QR-код",
      unavailable: "Нет доступа к камере. Введите номер вручную.",
      readFailed:
        "Не удалось распознать штрихкод/QR на выбранном файле. Попробуйте более четкое фото."
    },
    settings: {
      title: "Настройки",
      language: "Язык",
      languageSystem: "Системный",
      languageEnglish: "English",
      languageRussian: "Русский",
      languageChuvash: "Ч?ваш",
      theme: "Тема",
      themeSystem: "Системная",
      themeVsCodeDark: "VS Code Dark+",
      themeVsCodeLight: "VS Code Light+",
      themeOled: "OLED Black",
      themeDracula: "Dracula",
      themeMonokai: "Monokai",
      themeSolarizedDark: "Solarized Dark",
      themeGithubLight: "GitHub Light",
      sync: "Облачная синхронизация",
      syncServerUrl: "URL сервера",
      syncServerUrlPlaceholder: "https://example.com",
      saveServerUrl: "Сохранить URL",
      accountHint: "Аккаунт необязателен. Нужен только для синхронизации между устройствами.",
      serverStatus: "Статус сервера",
      serverChecking: "Проверка...",
      serverOnline: "Онлайн",
      serverOffline: "Офлайн",
      cloudCards: "Карт в облаке",
      cloudCardsValue: "{count} активных ({total} всего)",
      email: "Email",
      password: "Пароль",
      login: "Войти",
      register: "Регистрация",
      logout: "Выйти",
      syncNow: "Синхронизировать",
      syncStatusSignedOut: "Вход не выполнен. Локальный офлайн-режим активен.",
      syncStatusSignedIn: "Выполнен вход: {email}",
      syncStatusSuccess: "Синхронизация завершена",
      syncStatusFailed: "Ошибка синхронизации",
      syncStateIdle: "Ожидание",
      syncStateScheduled: "Запланировано",
      syncStateSyncing: "Синхронизация...",
      syncStateRestoring: "Восстановление из облака...",
      syncStateSuccess: "Синхронизировано",
      syncStateError: "Ошибка синка",
      lastSync: "Последняя синхронизация",
      backup: "Резервная копия",
      exportJson: "Экспорт JSON",
      importJson: "Импорт JSON",
      exportSuccess: "Резервная копия экспортирована",
      exportFailed: "Ошибка экспорта",
      importSuccess: "Импортировано {imported}, пропущено {skipped}",
      importFailed: "Ошибка импорта",
      invalidBackup: "Неверный формат файла резервной копии"
    },
    validation: {
      storeRequired: "Укажите название магазина.",
      numberRequired: "Укажите номер карты.",
      eanDigits: "EAN13 должен содержать 12 или 13 цифр.",
      eanChecksum: "Неверная контрольная цифра EAN13.",
      code128Length: "CODE128 должен быть не длиннее 80 символов.",
      qrLength: "Значение QR должно быть не длиннее 512 символов."
    }
  },
  cv: {
    common: {
      back: "Каялла",
      close: "Хуп",
      edit: "Т?рлет",
      delete: "К?лар",
      loading: "Тиес?тер?...",
      settings: "К?йлавсем",
      updateAvailable: "Приложенин ??н? версий? пур",
      updateNow: "Халех ??нет",
      installAvailable: "Приложенине х?юл экранне ларт",
      installNow: "Ларт"
    },
    home: {
      title: "Картсен кошелёк?",
      searchPlaceholder: "Шырав",
      categoriesAll: "Пурте",
      loadingCards: "Картсене тиес?терет...",
      empty: "Карта ?ук-ха. П?ррем?ш лояльность картине хуш?р.",
      favorites: "Ятл?",
      allCards: "Пур картсем",
      cards: "Картсем",
      addCard: "Хуш",
      favoriteLabel: "Ятл?",
      sortDateAdded: "Хушни кун?пе",
      sortAlphabetical: "Алфавитпа",
      sortUsage: "Ус? курни часотипе"
    },
    form: {
      addTitle: "Карта хушу",
      editTitle: "Картa т?рлет?",
      storeName: "Кибет яч?",
      cardNumber: "Карта номер?",
      barcodeType: "Штрихкод т?с?",
      category: "Категори",
      notes: "Пал?ртусем (кирл? мар)",
      notesPlaceholder: "У?? в?х?ч?, ташш? скидк? т. ыт.",
      color: "Карта т?с?",
      favorite: "Ятл? карта",
      scan: "Штрихкод сканерла",
      scanTakePhoto: "С?н ?кер",
      scanChoosePhoto: "С?н суйла",
      scanChooseFile: "Файл суйла",
      save: "Сыхла",
      update: "??нет",
      saving: "Сыхлат...",
      saveFailed: "Картине сыхлаймар?м. Теп?р хут т?в?р.",
      colors: {
        blue: "К?вак",
        green: "Сим?с",
        orange: "Х?рл?-сар?",
        purple: "Фиолет",
        gray: "С?р?"
      },
      categories: {
        grocery: "Продуктсем",
        pharmacy: "Аптека",
        fashion: "К?пе-й?м",
        fuel: "Янк?р",
        cafe: "Кафе",
        electronics: "Электроника",
        other: "Ур?х"
      }
    },
    detail: {
      checkout: "Карта кур?ну",
      cardNotFound: "Карта туп?нмар?",
      cardNotFoundText: "Карта к?ларн? е пур мар.",
      favorite: "Ятл? т?вас",
      unfavorite: "Ятл?ран илес",
      deleteConfirm: "{name} картине к?ларас-и?",
      notes: "Пал?ртусем",
      category: "Категори",
      ean13: "EAN-13",
      code128: "CODE-128",
      qr: "QR",
      eanUnavailable: "Кам?н та пулин 12 цифра кирл?"
    },
    scanner: {
      hint: "Камерана штрихкод е QR код ?ине тыт?р",
      unavailable: "Камерана ир?к ?ук. Номерне ал?па к?рт?р.",
      readFailed:
        "Суйлан? файлтран штрихкод/QR код вулама пулмар?. Пачахрах с?н т?р?ш?р."
    },
    settings: {
      title: "К?йлавсем",
      language: "Ч?лхе",
      languageSystem: "Систем? ч?лхи",
      languageEnglish: "English",
      languageRussian: "Русский",
      languageChuvash: "Ч?ваш",
      theme: "Тема",
      themeSystem: "Систем?",
      themeVsCodeDark: "VS Code Dark+",
      themeVsCodeLight: "VS Code Light+",
      themeOled: "OLED Black",
      themeDracula: "Dracula",
      themeMonokai: "Monokai",
      themeSolarizedDark: "Solarized Dark",
      themeGithubLight: "GitHub Light",
      sync: "П?л?т синхронизаци",
      syncServerUrl: "Сервер URL",
      syncServerUrlPlaceholder: "https://example.com",
      saveServerUrl: "URL сыхла",
      accountHint:
        "Аккаунт кирл? мар. В?л приборсем хушшинче синхронизациш?н анчах кирл?.",
      serverStatus: "Сервер статус?",
      serverChecking: "Т?р?слет...",
      serverOnline: "Онлайн",
      serverOffline: "Офлайн",
      cloudCards: "П?л?три картсем",
      cloudCardsValue: "{count} активл? ({total} пур?)",
      email: "Email",
      password: "Пароль",
      login: "К?р",
      register: "Регистраци",
      logout: "Тух",
      syncNow: "Синхронла",
      syncStatusSignedOut: "К?мен. Локаль офлайн режим ??лет.",
      syncStatusSignedIn: "{email} пек к?н?",
      syncStatusSuccess: "Синхронизаци пулч?",
      syncStatusFailed: "Синхронизаци й?н?ш?",
      syncStateIdle: "К?тет",
      syncStateScheduled: "Планра",
      syncStateSyncing: "Синхронизаци пырать...",
      syncStateRestoring: "П?л?трен кайалла тав?рат...",
      syncStateSuccess: "Синхронланн?",
      syncStateError: "Синк й?н?ш?",
      lastSync: "Юлашки синхронизаци",
      backup: "Резерв копи",
      exportJson: "JSON экспорт",
      importJson: "JSON импорт",
      exportSuccess: "Резерв копи экспортланч?",
      exportFailed: "Экспорт й?н?ш?",
      importSuccess: "Импортланн?: {imported}, сиктерн?: {skipped}",
      importFailed: "Импорт й?н?ш?",
      invalidBackup: "Резерв копи файл?н формат? т?р?с мар"
    },
    validation: {
      storeRequired: "Кибет ятне к?рт?р.",
      numberRequired: "Карта номерне к?рт?р.",
      eanDigits: "EAN13 12 е 13 цифра тытма тив??.",
      eanChecksum: "EAN13 контроль цифри й?н?ш.",
      code128Length: "CODE128 80 символран к?ске пулмалла.",
      qrLength: "QR п?лтер?ш? 512 символран к?ске пулмалла."
    }
  }
} as const;

type SupportedLocale = keyof typeof TRANSLATIONS;

const detectSystemLocale = (): SupportedLocale => {
  const language = navigator.language.toLowerCase();
  if (language.startsWith("cv")) {
    return "cv";
  }
  if (language.startsWith("ru")) {
    return "ru";
  }
  return "en";
};

export const useI18n = () => {
  const { localeMode } = useAppSettings();

  const locale = useMemo<SupportedLocale>(
    () => (localeMode === "system" ? detectSystemLocale() : localeMode),
    [localeMode]
  );

  return {
    locale,
    t: TRANSLATIONS[locale]
  };
};
