<?php
/**
 * logout.php
 *
 * Odhlášení uživatele: vyčistí session a smaže session cookie.
 *
 * @package Auth
 */

require_once 'session_init.php';
include 'security_headers.php';
include 'db.php';
session_unset();
session_destroy();
$params = session_get_cookie_params();
setcookie(session_name(), '', time() - 3600, $params['path'], $params['domain'], $params['secure'], $params['httponly']);

echo json_encode(['success' => true]);
?>
