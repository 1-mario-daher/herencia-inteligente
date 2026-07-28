<?php
/*
  Receptor del diagnóstico de herencia.
  Recibe el lead por POST (JSON), lo guarda en un CSV y te avisa por correo.
  Vive en: www.life-experts.consulting/diagnostico_herencia/guardar.php
*/

// ---- CONFIG ----
$AVISO_A   = 'daher@life-experts.consulting';        // a dónde te llega el aviso
$DESDE     = 'diagnostico@life-experts.consulting';   // remitente (debe existir en tu cPanel)
$CSV       = __DIR__ . '/leads.csv';                  // base de datos simple
// ----------------

header('Content-Type: application/json; charset=utf-8');

// solo POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405); echo json_encode(['ok'=>false]); exit;
}

$raw = file_get_contents('php://input');
$d = json_decode($raw, true);
if (!$d || empty($d['correo'])) {
  http_response_code(400); echo json_encode(['ok'=>false,'error'=>'datos incompletos']); exit;
}

// sanitizar / normalizar
function num($v){ return (int) preg_replace('/[^\d\-]/','', (string)($v ?? '0')); }
$correo     = filter_var(trim($d['correo']), FILTER_SANITIZE_EMAIL);
$patrimonio = num($d['patrimonio'] ?? 0);
$liquidez   = num($d['liquidez'] ?? 0);
$deudas     = num($d['deudas'] ?? 0);
$gasto      = num($d['gasto_mensual'] ?? 0);
$hueco      = num($d['hueco'] ?? 0);
$fecha      = date('Y-m-d H:i:s');
$ip         = $_SERVER['REMOTE_ADDR'] ?? '';

if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
  http_response_code(400); echo json_encode(['ok'=>false,'error'=>'correo inválido']); exit;
}

// ---- guardar en CSV ----
$nuevo = !file_exists($CSV);
$fh = fopen($CSV, 'a');
if ($nuevo) fputcsv($fh, ['fecha','correo','patrimonio','liquidez','deudas','gasto_mensual','hueco','ip']);
fputcsv($fh, [$fecha,$correo,$patrimonio,$liquidez,$deudas,$gasto,$hueco,$ip]);
fclose($fh);

// ---- avisarte por correo (con los números, para calificar de un vistazo) ----
$fmt = fn($n) => '$' . number_format($n, 0, '.', ',');
$califica = ($patrimonio >= 3000000 && $gasto >= 40000) ? 'SÍ — con capacidad de pago' : 'revisar';
$cuerpo =
  "Nuevo diagnóstico de herencia\n\n" .
  "Correo:        $correo\n" .
  "EL HUECO:      " . $fmt($hueco) . "\n\n" .
  "Patrimonio:    " . $fmt($patrimonio) . "\n" .
  "Liquidez:      " . $fmt($liquidez) . "\n" .
  "Deudas:        " . $fmt($deudas) . "\n" .
  "Gasto mensual: " . $fmt($gasto) . "\n\n" .
  "¿Calificado?:  $califica\n" .
  "Fecha:         $fecha\n";

$headers = "From: $DESDE\r\nReply-To: $correo\r\nContent-Type: text/plain; charset=utf-8\r\n";
@mail($AVISO_A, 'Lead herencia — hueco ' . $fmt($hueco), $cuerpo, $headers);

echo json_encode(['ok'=>true]);
