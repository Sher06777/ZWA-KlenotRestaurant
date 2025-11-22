<?php
// ставим те же параметры, что и в auth.php
$secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || $_SERVER['SERVER_PORT'] == 443;
session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'domain'   => '.zwa.toad.cz', // <- ваш домен, оставьте как есть
    'secure'   => $secure,
    'httponly' => true,
    'samesite' => 'Lax'
]);
ini_set('session.use_strict_mode', 1);
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}