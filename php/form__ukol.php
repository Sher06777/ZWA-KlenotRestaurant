<?php
    $email = '';
    if (isset($_POST['email'])) {
        $email = $_POST["email"];
        echo "Odeslaný e-mail: <br>" . htmlspecialchars($email, ENT_QUOTES);
        if (strlen($email) < 2) {
            echo "kratky email";
        } else {
            header("Location: ../head.html");
            die();
        }
    }
?>
<form method="post" action="form__ukol.php">
    <fieldset>
        <legend>Table Reservation</legend>
            <span>Full Name</span>
            <input type="text" name="email" value="<?php echo htmlspecialchars($email, ENT_QUOTES); ?>">
            <input type="text" name="password">
            <input type="submit" name="name">
    </fieldset>
</form>
