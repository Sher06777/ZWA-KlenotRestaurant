<?php
// auth.php
// Проверка авторизации (и установка $currentUserId, $currentUserName, $currentUserIsAdmin).
// Ожидается, что session_init.php уже подключён (и в нём подключён verify_csrf_token.php).
//
// Поведение:
// - Для публичных endpoint'ов (перечислены в $publicScripts) авторизация не требуется.
// - Для остальных — если пользователь не залогинен, возвращаем 401 JSON и exit.
// - Не дублируем CSRF-проверку — она выполняется централизованно при включении session_init.php.

// declare(strict_types=1);

// Подключаем и инициализируем сессию и DB (session_init.php должен стартовать сессию)
require 'session_init.php';
require 'db.php'; // предоставляет $conn

// Список публичных скриптов (basename файлов), которые не требуют авторизации.
// При необходимости добавляй сюда реально существующие публичные файлы.
$publicScripts = [
    'check_session.php',
    'get_csrf_token.php',
    'signin.php',
    'register.php',
];

// Определим текущий исполняемый файл безопасно:
$self = basename($_SERVER['SCRIPT_NAME'] ?? ($_SERVER['PHP_SELF'] ?? ''));

// Если этот скрипт — публичный, просто выходим (без проверки авторизации).
if (in_array($self, $publicScripts, true)) {
    // Ничего не делаем — скрипт продолжается в вызывающем файле.
    return;
}

// Для всех остальных файлов требуется авторизация:
$currentUserId = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : 0;
$currentUserName = $_SESSION['user_name'] ?? null;
$currentUserIsAdmin = isset($_SESSION['isAdmin']) ? (int)$_SESSION['isAdmin'] : 0;

if ($currentUserId <= 0) {
    // Не авторизован — возвращаем JSON 401
    http_response_code(401);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'error' => 'Not authenticated'
    ]);
    exit;
}

// Установим в глобальную область, чтобы другие скрипты могли использовать (как раньше)
$GLOBALS['currentUserId'] = $currentUserId;
$GLOBALS['currentUserName'] = $currentUserName;
$GLOBALS['currentUserIsAdmin'] = $currentUserIsAdmin;

// Возврат — выполнение скрипта продолжается.
return;
