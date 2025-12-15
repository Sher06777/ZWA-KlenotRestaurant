<?php
/**
 * get_user.php
 *
 * Vrací informace o aktuálním uživateli ze session.
 * Odpověď: { success: true|false, user: { id, name, email, isAdmin } }
 *
 * @package Auth
 */

require_once __DIR__ . '/session_init.php';
error_reporting(0);
ini_set('display_errors', 0);
require_once __DIR__ . '/security_headers.php';
require_once __DIR__ . '/db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false]);
    exit;
}

$name  = htmlspecialchars($_SESSION['user_name'] ?? '', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$email = htmlspecialchars($_SESSION['user_email'] ?? '', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

echo json_encode([
    'success' => true,
    'user' => [
        'id' => $_SESSION['user_id'],
        'name' => $name ?? null,
        'email' => $email ?? null,
        'isAdmin' => $_SESSION['isAdmin'] ?? false
    ]
]);
exit;
