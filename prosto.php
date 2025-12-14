<?php
session_start();

print_r($_SESSION);
if (isset($_GET["lang"])) {
    $_SESSION["lang"] = $_GET["lang"];
}
