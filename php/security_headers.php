<?php
header("Content-Security-Policy: script-src 'self' 'nonce-<random>'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'");
header('X-Frame-Options: SAMEORIGIN'); 
header('X-Content-Type-Options: nosniff'); 
header('X-XSS-Protection: 1; mode=block');
//def XSS - attack, anti-clickjacking and CSP