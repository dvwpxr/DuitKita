<?php

$uri = "mysql://avnadmin:AVNS_XgeRPfsi8B8s5Vd8VfQ@mysql-moneymanager-student-esaunggul.l.aivencloud.com:11781/defaultdb?ssl-mode=REQUIRED";

$fields = parse_url($uri);

// build the DSN including SSL settings
$conn = "mysql:";
$conn .= "host=" . $fields["host"];
$conn .= ";port=" . $fields["port"];;
$conn .= ";dbname=defaultdb";
$conn .= ";sslmode=verify-ca;sslrootcert=ca.pem";

try {
    $db = new PDO($conn, $fields["user"], $fields["pass"]);

    $stmt = $db->query("SELECT VERSION()");
    print($stmt->fetch()[0]);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
