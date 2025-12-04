<?php

$users = [
    ["name" =>"ondra", "age" => 15, "id" => 1],
    ["name" =>"kemyar", "age" => 19, "id" => 2],
    ["name" =>"sher", "age" => 18, "id" => 3]
];

$users_str = json_encode($users);

file_put_contents('soubor.txt', $users_str);
$data_str = file_get_contents('soubor.txt');
$data = json_decode($data_str, TRUE);


?>