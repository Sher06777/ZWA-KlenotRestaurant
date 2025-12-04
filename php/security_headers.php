<?php
/**
 * security_headers.php
 *
 * Nastavuje sadu bezpečnostních hlaviček (CSP, X-Frame-Options, X-Content-Type-Options apod.).
 *
 * Připojovat na začátku skriptů, kde je požadována přísná bezpečnost.
 *
 * @package Security
 */

$csp = "default-src 'self'; "
     . "script-src 'self'; "
     . "style-src 'self'; "
     . "img-src 'self' data:; "
     . "font-src 'self'; "
     . "connect-src 'self' https:; "
     . "object-src 'none'; "
     . "base-uri 'self';";

header("Content-Security-Policy: $csp");
header('X-Frame-Options: SAMEORIGIN');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer-when-downgrade');
header('X-XSS-Protection: 1; mode=block');
header('Permissions-Policy: geolocation=(), microphone=()');
