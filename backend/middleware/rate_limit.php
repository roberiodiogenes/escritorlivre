<?php
// ================================================================
// ROBÉRIO DIÓGENES — middleware/rate_limit.php
// Proteção contra spam e abuso sem Redis (usa banco MySQL)
// ================================================================

require_once __DIR__ . '/../config/banco.php';
require_once __DIR__ . '/../middleware/resposta.php';

function rate_limit(string $acao, int $maximo, int $janela): void {
    $ip  = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    $key = hash('sha256', $acao . $ip);

    // Tenta criar tabela de rate limit se não existir
    // (executado na primeira requisição)
    static $tabelaCriada = false;
    if (!$tabelaCriada) {
        Banco::query("
            CREATE TABLE IF NOT EXISTS rate_limits (
                chave      VARCHAR(64)  NOT NULL,
                contador   SMALLINT     NOT NULL DEFAULT 1,
                janela_fim DATETIME     NOT NULL,
                PRIMARY KEY (chave)
            ) ENGINE=InnoDB
        ");
        $tabelaCriada = true;
    }

    $agora  = date('Y-m-d H:i:s');
    $limite = date('Y-m-d H:i:s', time() + $janela);

    // Remove entradas expiradas
    Banco::query("DELETE FROM rate_limits WHERE janela_fim < ?", [$agora]);

    // Lê contador atual
    $registro = Banco::um(
        "SELECT contador, janela_fim FROM rate_limits WHERE chave = ?",
        [$key]
    );

    if (!$registro) {
        // Primeira requisição nesta janela
        Banco::query(
            "INSERT INTO rate_limits (chave, contador, janela_fim) VALUES (?, 1, ?)",
            [$key, $limite]
        );
        return;
    }

    if ($registro['contador'] >= $maximo) {
        resposta_erro(
            "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
            429
        );
    }

    Banco::query(
        "UPDATE rate_limits SET contador = contador + 1 WHERE chave = ?",
        [$key]
    );
}
