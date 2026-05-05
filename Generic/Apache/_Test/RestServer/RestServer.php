<?php

require_once $_SERVER['DOCUMENT_ROOT'] . '/Packages/Generic/Apache/RestServer/RestServer.php';


class RestServer extends \Apache\RestServer {
    // static public $authRecordExpiration = 3;
    // static public $errorTrace = true;
    // static public $gzipLevel = 1;

    public $_dbDescriptor = [
        // 'dsn' => 'sqlite:/Files/Web//Packages/Generic/Apache/_Test/RestServer/RestServer.sqlite',
        'dsn' => 'mysql:dbname=test',
        // 'statementDir' => '/Packages/Generic/Apache/_Test/RestServer/DbStatements',
        'statementDir' => '/Packages/Generic/Apache/RestServer/DbStatements',
        'userName' => 'root',
    ];


    public function db_init() {
        $this->_db->executeRaw('init');
    }

    public function f(...$a) {
        $this->_verify();

        return [
            'a' => $a,
            'userName' => $this->_db_client['name'],
        ];
    }
}


new RestServer();
