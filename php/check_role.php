<?php
/**
 * check_role.php
 *
 * Jednoduchý endpoint pro frontend: vrací, zda je uživatel přihlášen
 * a zda je administrátor.
 *
 * Odpověď: { logged: bool, isAdmin: 0|1 }
 *
 * @package Auth
 */

require 'session_init.php';
header('Content-Type: application/json; charset=utf-8');

echo json_encode([
    'logged'  => isset($_SESSION['user_id']) && !empty($_SESSION['user_id']),
    'isAdmin' => (isset($_SESSION['isAdmin']) && (int)$_SESSION['isAdmin']) ? 1 : 0
]);
exit;
