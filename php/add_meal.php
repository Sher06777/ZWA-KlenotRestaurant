<?php
// Настройки
$jsonFile = '../data/menu.json';
$uploadBaseDir = '../img/menu-img/';

header('Content-Type: application/json');

// 1. Проверка метода
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Только POST запросы']);
    exit;
}

// 2. Получаем данные из FormData
$category = $_POST['category'] ?? '';
$itemJsonString = $_POST['itemJson'] ?? '';
$targetFileName = $_POST['imageName'] ?? ''; // Имя файла, которое сгенерировал JS (4.22-Name.jpg)

if (!$category || !$itemJsonString || !$targetFileName) {
    echo json_encode(['success' => false, 'message' => 'Неполные данные']);
    exit;
}

$newItem = json_decode($itemJsonString, true);
if (!$newItem) {
    echo json_encode(['success' => false, 'message' => 'Ошибка JSON данных блюда']);
    exit;
}

// 3. Обработка картинки
if (isset($_FILES['imageFile']) && $_FILES['imageFile']['error'] === UPLOAD_ERR_OK) {

    // Создаем папку для категории
    $targetDir = $uploadBaseDir . $category . '/';
    if (!file_exists($targetDir)) {
        mkdir($targetDir, 0777, true);
    }

    // Полный путь куда сохранять: img/menu-img/Soups/2.15-Soup.jpg
    $destination = $targetDir . basename($targetFileName);

    // Перемещаем файл
    if (!move_uploaded_file($_FILES['imageFile']['tmp_name'], $destination)) {
        echo json_encode(['success' => false, 'message' => 'Не удалось сохранить картинку']);
        exit;
    }
} else {
    // Если картинку не загрузили, можно либо выдать ошибку, либо пропустить (если это обновление)
    // echo json_encode(['success' => false, 'message' => 'Картинка не загружена']);
    // exit;
}

// 4. Обновленик JSON 

// Читаем текущий menu.json
$currentData = file_get_contents($jsonFile);
$dataArray = json_decode($currentData, true);

if (!$dataArray) {
    $dataArray = [];
}

if (!isset($dataArray[$category])) {
    $dataArray[$category] = [];
}

// Добавляем новое блюдо в массив
$dataArray[$category][] = $newItem;

// Сохраняем обратно в файл (Pretty Print для красоты)
if (file_put_contents($jsonFile, json_encode($dataArray, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
    echo json_encode(['success' => true, 'message' => 'Блюдо и картинка успешно сохранены!']);
} else {
    echo json_encode(['success' => false, 'message' => 'Ошибка записи в menu.json']);
}
