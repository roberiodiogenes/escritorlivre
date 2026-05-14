<?php
// ================================================================
// ROBÉRIO DIÓGENES — config/banco.php
// Conexão com o banco de dados (PDO)
// ================================================================

require_once __DIR__ . '/config.php';

class Banco {
    private static ?PDO $instancia = null;

    // Retorna (ou cria) a conexão única com o banco
    public static function conexao(): PDO {
        if (self::$instancia === null) {
            $dsn = sprintf(
                'mysql:host=%s;dbname=%s;charset=%s',
                DB_HOST, DB_NOME, DB_CHARSET
            );
            try {
                self::$instancia = new PDO($dsn, DB_USUARIO, DB_SENHA, [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
                ]);
            } catch (PDOException $e) {
                // Em produção não expomos detalhes do erro
                if (AMBIENTE === 'desenvolvimento') {
                    die(json_encode(['erro' => 'Banco de dados: ' . $e->getMessage()]));
                }
                die(json_encode(['erro' => 'Erro interno do servidor. Tente novamente.']));
            }
        }
        return self::$instancia;
    }

    // Atalho para executar queries preparadas com segurança
    public static function query(string $sql, array $params = []): PDOStatement {
        $stmt = self::conexao()->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    // Retorna todos os resultados de uma query
    public static function todos(string $sql, array $params = []): array {
        return self::query($sql, $params)->fetchAll();
    }

    // Retorna apenas o primeiro resultado
    public static function um(string $sql, array $params = []): ?array {
        $resultado = self::query($sql, $params)->fetch();
        return $resultado ?: null;
    }

    // Insere e retorna o ID gerado
    public static function inserir(string $sql, array $params = []): int {
        self::query($sql, $params);
        return (int) self::conexao()->lastInsertId();
    }
}
