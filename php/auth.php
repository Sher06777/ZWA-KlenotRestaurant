<?php
/**
 * auth.php
 *
 * Inicializace autorizace / kontrola session.
 * Připojuje session_init.php a db.php, poté zkontroluje, 
 * zda je aktuální skript veřejný (seznam $publicScripts).
 *
 * Pokud uživatel není autentizovaný — vrátí 401 JSON a ukončí skript.
 * Pokud je autentizován, uloží do $GLOBALS:
 *  - currentUserId
 *  - currentUserName
 *  - currentUserIsAdmin
 *
 * @package Auth
 */

require 'session_init.php';
require 'db.php';

$publicScripts = [
    'check_session.php',
    'get_csrf_token.php',
    'signin.php',
    'register.php',
];

$self = basename($_SERVER['SCRIPT_NAME'] ?? ($_SERVER['PHP_SELF'] ?? ''));

if (in_array($self, $publicScripts, true)) {
    return;
}

$currentUserId = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : 0;
$currentUserName = $_SESSION['user_name'] ?? null;
$currentUserIsAdmin = isset($_SESSION['isAdmin']) ? (int)$_SESSION['isAdmin'] : 0;

if ($currentUserId <= 0) {
    http_response_code(401);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'error' => 'Not authenticated'
    ]);
    exit;
}

$GLOBALS['currentUserId'] = $currentUserId;
$GLOBALS['currentUserName'] = $currentUserName;
$GLOBALS['currentUserIsAdmin'] = $currentUserIsAdmin;

return;
