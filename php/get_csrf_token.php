<?php
/**
 * get_csrf_token.php
 *
 * Vrací CSRF token v JSON: { csrf_token: "..." }.
 * Vyžaduje spuštěnou session (session_init.php) a aplikuje bezpečnostní hlavičky.
 *
 * @package Security
 */

require_once __DIR__ . '/session_init.php';
require_once __DIR__ . '/security_headers.php';
header('Content-Type: application/json; charset=utf-8');
http_response_code(200);

echo json_encode(['csrf_token' => get_csrf_token()]);
exit;
