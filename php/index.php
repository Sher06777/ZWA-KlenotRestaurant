

Datum a cas:

<?php
echo date("j. n. Y, G:i"); 

?>

<br>

<?php 

$a = 3;
$b = 4;

$pole1 = array("a", "b", "c");

// foreach($pole1 as $array) {
//     print $array;
// }

$pole2 = array(
    "jmeno" => "jan<br>",
    "prijmeni" => "Achilov"
);

$a = 5;

print_r($pole2)
?>

Aktualni data:
<br>
<?php

// echo "Ahoj, ty jsi ". $_GET["name"];

if (isset($_GET['name'])){
    echo "Nenasel";
};

if (array_key_exists("name", $_GET)) {
    echo "Nenasel";
}

?>