<?php
// ================================================================
// ROBÉRIO DIÓGENES — middleware/cors.php
// Controle de origens permitidas
// ================================================================

function cors_headers(): void {
    $origem = $_SERVER['HTTP_ORIGIN'] ?? '';

    if (in_array($origem, CORS_ORIGENS, true) || AMBIENTE === 'desenvolvimento') {
        header('Access-Control-Allow-Origin: ' . ($origem ?: '*'));
    }

    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
}
