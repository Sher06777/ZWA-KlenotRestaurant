<?php
/**
 * add_meal.php
 *
 * API endpoint: přidání jídla do menu s nahráním obrázku.
 *
 * Očekává POST požadavek s poli:
 *  - category (string)   — kategorie jídla
 *  - itemJson (string)   — JSON s daty jídla (id, name, description, price, weight)
 *  - imageName (string)  — navrhované jméno souboru obrázku
 *  - imageFile (file)    — soubor obrázku (multipart/form-data)
 *
 * Vrací JSON s poli success (bool) a message (string).
 *
 * @package MenuAPI
 */
require_once __DIR__ . '/verify_csrf_token.php';
require_once __DIR__ . '/auth.php';

header('Content-Type: application/json; charset=utf-8');

/**
 * Odesílá JSON odpověď a ukončí skript.
 *
 * @param array $data Pole dat, které bude serializováno do JSON.
 * @param int   $code HTTP status kód odpovědi.
 * @return void Tento pomocný kód ukončí běh skriptu (exit).
 */
function jsonResponse(array $data, int $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'POST requests only'], 405);
}

$categoryRaw = trim($_POST['category'] ?? '');
$itemJsonString = trim($_POST['itemJson'] ?? '');
$imageNameRaw = trim($_POST['imageName'] ?? '');

if ($categoryRaw === '' || $itemJsonString === '' || $imageNameRaw === '') {
    jsonResponse(['success' => false, 'message' => 'Incomplete data'], 400);
}

/* Normalizace a validace kategorie */
$category = preg_replace('/\s+/', '-', trim($categoryRaw));
if (!preg_match('/^[A-Za-z0-9\-\_ ]+$/u', $category)) {
    jsonResponse(['success' => false, 'message' => 'Invalid category'], 400);
}
$category = trim($category);

/* Dekódování JSONu s daty položky */
$itemData = json_decode($itemJsonString, true);
if (!is_array($itemData)) {
    jsonResponse(['success' => false, 'message' => 'itemJson format error'], 400);
}

/* Kontrola a přijetí souboru */
if (!isset($_FILES['imageFile']) || $_FILES['imageFile']['error'] !== UPLOAD_ERR_OK) {
    jsonResponse(['success' => false, 'message' => 'Image file not uploaded'], 400);
}

$tmpPath = $_FILES['imageFile']['tmp_name'] ?? null;
if (!is_uploaded_file($tmpPath)) {
    jsonResponse(['success' => false, 'message' => 'Invalid upload file'], 400);
}

/* Kontrola obrazu a MIME typu */
$imgInfo = @getimagesize($tmpPath);
if ($imgInfo === false) {
    jsonResponse(['success' => false, 'message' => 'File is not an image'], 400);
}
$mime = $imgInfo['mime'] ?? '';
$allowedMime = [
    'image/jpeg' => ['jpg', 'jpeg'],
    'image/png'  => ['png'],
    'image/webp' => ['webp']
];
if (!isset($allowedMime[$mime])) {
    jsonResponse(['success' => false, 'message' => 'Invalid file type'], 400);
}

/* Omezení velikosti 5MB */
// Simple size check — could be reinforced at server config level (post_max_size/upload_max_filesize).
if ($_FILES['imageFile']['size'] > 5 * 1024 * 1024) {
    jsonResponse(['success' => false, 'message' => 'Image size exceeds 5MB'], 400);
}

/* Validace navrženého jména souboru (bez cesty) */
if (!preg_match('/^[A-Za-z0-9._-]+$/', $imageNameRaw)) {
    jsonResponse(['success' => false, 'message' => 'Invalid file name'], 400);
}
$imageName = $imageNameRaw;

/* Zajištění, že přípona odpovídá MIME — v případě potřeby nahradíme */
// Ensure extension matches the detected mime type to avoid mismatched uploads.
$ext = strtolower(pathinfo($imageName, PATHINFO_EXTENSION) ?: '');
if ($ext === '' || !in_array($ext, $allowedMime[$mime], true)) {
    $imageNameBase = pathinfo($imageName, PATHINFO_FILENAME);
    $imageName = $imageNameBase . '.' . $allowedMime[$mime][0];
}

/* Příprava adresářů pro nahrání */
// realpath used to canonicalize and later validate against baseUploadDir to prevent path traversal.
$baseUploadDir = realpath(__DIR__ . '/../img/menu-img');
if ($baseUploadDir === false) {
    $baseUploadDir = __DIR__ . '/../img/menu-img';
    if (!mkdir($baseUploadDir, 0755, true) && !is_dir($baseUploadDir)) {
        jsonResponse(['success' => false, 'message' => 'Failed to prepare image folder'], 500);
    }
    $baseUploadDir = realpath($baseUploadDir);
}

$uploadDir = $baseUploadDir . DIRECTORY_SEPARATOR . $category . DIRECTORY_SEPARATOR;

if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0755, true)) {
        jsonResponse(['success' => false, 'message' => 'Failed to create category folder'], 500);
    }
}
$realUploadDir = realpath($uploadDir);
// Security check: ensure the resolved upload dir is inside expected base directory.
if ($realUploadDir === false || strpos($realUploadDir, $baseUploadDir) !== 0) {
    jsonResponse(['success' => false, 'message' => 'Invalid upload path'], 500);
}

$targetPath = $realUploadDir . DIRECTORY_SEPARATOR . $imageName;

if (file_exists($targetPath)) {
    jsonResponse(['success' => false, 'message' => 'File with the same name already exists'], 409);
}

/* Přesun nahraného souboru do cílového adresáře */
// move_uploaded_file is required to ensure file was uploaded via HTTP POST.
if (!move_uploaded_file($tmpPath, $targetPath)) {
    jsonResponse(['success' => false, 'message' => 'Failed to save image'], 500);
}

/* Práce s JSON „databází“ menu */
$dataPath = __DIR__ . '/../data/menu.json';
if (!file_exists($dataPath)) {
    if (false === @file_put_contents($dataPath, "{}")) {
        jsonResponse(['success' => false, 'message' => 'Failed to prepare menu database'], 500);
    }
}

/* Zamknutí souboru před čtením/zápisem */
// File lock to avoid race conditions when multiple requests write the JSON file concurrently.
$fp = fopen($dataPath, 'c+');
if (!$fp) {
    jsonResponse(['success' => false, 'message' => 'Failed to open menu database'], 500);
}
if (!flock($fp, LOCK_EX)) {
    fclose($fp);
    jsonResponse(['success' => false, 'message' => 'Database is busy. Try again later.'], 503);
}


/* Načtení současného obsahu a parsování */
// Read current content from pointer (pointer at beginning after open).
$raw = stream_get_contents($fp);
$parsed = json_decode($raw, true);
if (!is_array($parsed)) $parsed = [];

if (!isset($parsed[$category]) || !is_array($parsed[$category])) {
    $parsed[$category] = [];
}

/* Vyčištění a validace polí položky */
$allowedKeys = ['id','name','description','price','weight'];
$itemClean = [];

// Validate item id — restrict to safe characters and reasonable length.
$itemId = isset($itemData['id']) ? substr(trim((string)$itemData['id']), 0, 64) : null;
if (!$itemId || !preg_match('/^[A-Za-z0-9\.\-]{1,64}$/', $itemId)) {
    jsonResponse(['success'=>false,'message'=>'Invalid item id'],400);
}
$itemClean['id'] = $itemId;

/* Název a popis — podpora vícejazyčných struktur */
// Allow both simple string and language-keyed arrays; strip tags and truncate.
$itemClean['name'] = is_array($itemData['name']) ? array_map(function($v){ return mb_substr(strip_tags((string)$v),0,200); }, $itemData['name']) : ['eng' => mb_substr(strip_tags((string)($itemData['name'] ?? '')),0,200)];
$itemClean['description'] = is_array($itemData['description']) ? array_map(function($v){ return mb_substr(strip_tags((string)$v),0,500); }, $itemData['description']) : ['eng' => mb_substr(strip_tags((string)($itemData['description'] ?? '')),0,500)];

/* Validace formátu ceny */
// Accept numbers with optional 1-2 decimals and optional currency letters.
$priceRaw = (string)($itemData['price'] ?? '');
if (!preg_match('/^\s*[\d]+(?:[.,]\d{1,2})?\s*(?:[A-Za-z]{2,4})?\s*$/', $priceRaw)) {
    jsonResponse(['success'=>false,'message'=>'Invalid price format'],400);
}
$itemClean['price'] = trim($priceRaw);

/* Váha */
$itemClean['weight'] = isset($itemData['weight']) ? substr(strip_tags((string)$itemData['weight']),0,50) : '';

$itemData = $itemClean;
if (!empty($itemData['weight'])) {
    $w = trim((string)$itemData['weight']);

    if (preg_match('/^\d+$/', $w)) $w = $w . ' g';

    if (!preg_match('/g$/u', $w)) $w = $w . ' g';

    $itemData['weight'] = mb_substr($w, 0, 50);
} else {
    $itemData['weight'] = '';
}

/* Relativní cesta k obrázku */
$itemData['image'] = 'img/menu-img/' . $category . '/' . $imageName;

/* Přidání položky do kategorie a uložení */
$parsed[$category][] = $itemData;

// Rewind and truncate before writing new JSON to replace file content safely.
rewind($fp);
if (false === ftruncate($fp, 0)) {
    flock($fp, LOCK_UN);
    fclose($fp);
    jsonResponse(['success' => false, 'message' => 'Failed to save menu database'], 500);
}
$written = fwrite($fp, json_encode($parsed, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
fflush($fp);
flock($fp, LOCK_UN);
fclose($fp);

if ($written === false) {
    jsonResponse(['success' => false, 'message' => 'Failed to save menu database'], 500);
}

jsonResponse(['success' => true, 'message' => 'Dish added successfully']);
