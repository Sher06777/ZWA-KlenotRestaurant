<?php
require_once 'auth.php';

// ---------- 1. Разрешаем только POST ----------
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    response(false, 'Только POST запросы');
}

// ---------- 2. Проверка CSRF ----------
if (
    !isset($_POST['csrf_token']) ||
    !isset($_SESSION['csrf_token']) ||
    $_POST['csrf_token'] !== $_SESSION['csrf_token']
) {
    response(false, 'Неверный CSRF токен');
}

// ---------- 3. Проверяем обязательные поля ----------
$category = trim($_POST['category'] ?? '');
$itemJsonString = trim($_POST['itemJson'] ?? '');
$imageName = trim($_POST['imageName'] ?? '');

if ($category === '' || $itemJsonString === '' || $imageName === '') {
    response(false, 'Неполные данные');
}

// ---------- 4. Распарсим JSON данных блюда ----------
$itemData = json_decode($itemJsonString, true);
if (!is_array($itemData)) {
    response(false, 'Ошибка формата itemJson');
}

// ---------- 5. Проверка файла ----------
if (
    !isset($_FILES['imageFile']) ||
    $_FILES['imageFile']['error'] !== UPLOAD_ERR_OK
) {
    response(false, 'Файл изображения не загружен');
}

// ---------- 6. Проверка MIME ----------
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = finfo_file($finfo, $_FILES['imageFile']['tmp_name']);
finfo_close($finfo);

$allowedMime = ['image/jpeg', 'image/png', 'image/webp'];
if (!in_array($mime, $allowedMime)) {
    response(false, 'Недопустимый тип файла');
}

// ---------- 7. Проверка размера файла ----------
if ($_FILES['imageFile']['size'] > 5 * 1024 * 1024) {
    response(false, 'Размер изображения превышает 5MB');
}

// ---------- 8. Запись файла в img/menu-img/{category}/ ----------
$uploadDir = __DIR__ . '/../img/menu-img/' . $category . '/';

// создаем папку категории, если её нет
if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0777, true)) {
        response(false, 'Не удалось создать папку для категории');
    }
}

$targetPath = $uploadDir . $imageName;

// защитим от перезаписи
if (file_exists($targetPath)) {
    response(false, 'Файл с таким именем уже существует');
}

if (!move_uploaded_file($_FILES['imageFile']['tmp_name'], $targetPath)) {
    response(false, 'Не удалось сохранить изображение');
}

// ---------- 9. Запись блюда в JSON базы ----------
$dbPath = __DIR__ . '/../data/menu.json';

if (!file_exists($dbPath)) {
    file_put_contents($dbPath, '{}');
}

$db = json_decode(file_get_contents($dbPath), true);
if (!is_array($db)) $db = [];

if (!isset($db[$category])) {
    $db[$category] = []; // создаем новую категорию, если нет
}

// Добавляем блюдо
$db[$category][] = $itemData;

// Сохраняем JSON красиво
file_put_contents($dbPath, json_encode($db, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

// ---------- 10. Успех ----------
response(true, 'Блюдо успешно добавлено');


// ===== Универсальная функция ответа =====
function response(bool $success, string $message)
{
    echo json_encode(['success' => $success, 'message' => $message]);
    exit;
}
