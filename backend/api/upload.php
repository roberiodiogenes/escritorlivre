<?php
// ================================================================
// ROBÉRIO DIÓGENES — api/upload.php
// POST /api/upload/imagem → salva capa de livro/post
// POST /api/upload/pdf    → salva capítulo em PDF
// ================================================================
require_once __DIR__ . '/../middleware/resposta.php';
require_once __DIR__ . '/../config/config.php';

class UploadAPI {
    public function __construct(
        private string $acao,
        private string $metodo,
        private array  $admin
    ) {}

    public function handle(): void {
        if ($this->metodo !== 'POST') {
            resposta_erro('POST esperado', 405);
        }

        match ($this->acao) {
            'imagem' => $this->imagem(),
            'pdf'    => $this->pdf(),
            default  => resposta_erro('Tipo de upload inválido', 404)
        };
    }

    private function imagem(): void {
        if (empty($_FILES['arquivo'])) {
            resposta_erro('Arquivo não enviado.', 400);
        }

        $arquivo = $_FILES['arquivo'];
        $tipos   = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

        if (!in_array($arquivo['type'], $tipos)) {
            resposta_erro('Formato inválido. Use JPG, PNG ou WebP.');
        }

        if ($arquivo['size'] > UPLOAD_MAX_IMG) {
            resposta_erro('Imagem muito grande. Máximo: 5 MB.');
        }

        $ext      = pathinfo($arquivo['name'], PATHINFO_EXTENSION);
        $nome     = uniqid('img_', true) . '.' . strtolower($ext);
        $destino  = UPLOAD_DIR . 'imagens/' . $nome;

        // Cria pasta se não existir
        if (!is_dir(UPLOAD_DIR . 'imagens/')) {
            mkdir(UPLOAD_DIR . 'imagens/', 0755, true);
        }

        if (!move_uploaded_file($arquivo['tmp_name'], $destino)) {
            resposta_erro('Falha ao salvar arquivo.', 500);
        }

        $url = UPLOAD_URL . 'imagens/' . $nome;
        resposta_ok(['url' => $url, 'nome' => $nome]);
    }

    private function pdf(): void {
        if (empty($_FILES['arquivo'])) {
            resposta_erro('Arquivo não enviado.', 400);
        }

        $arquivo = $_FILES['arquivo'];

        if ($arquivo['type'] !== 'application/pdf') {
            resposta_erro('Apenas arquivos PDF são aceitos.');
        }

        if ($arquivo['size'] > UPLOAD_MAX_PDF) {
            resposta_erro('PDF muito grande. Máximo: 20 MB.');
        }

        $nome    = uniqid('cap_', true) . '.pdf';
        $destino = UPLOAD_DIR . 'capitulos/' . $nome;

        if (!is_dir(UPLOAD_DIR . 'capitulos/')) {
            mkdir(UPLOAD_DIR . 'capitulos/', 0755, true);
        }

        if (!move_uploaded_file($arquivo['tmp_name'], $destino)) {
            resposta_erro('Falha ao salvar arquivo.', 500);
        }

        // Não retornamos URL pública do PDF — o download é feito via endpoint assinado
        $url = 'capitulos/' . $nome;
        resposta_ok(['url' => $url, 'nome' => $nome]);
    }
}
