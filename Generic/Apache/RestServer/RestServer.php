<?php

namespace Apache;

require_once $_SERVER['DOCUMENT_ROOT'] . '/Packages/Generic/Apache/Db/Db.php';
require_once $_SERVER['DOCUMENT_ROOT'] . '/Packages/Generic/Apache/Json/Json.php';


class RestServer {
    static public $authRecordExpiration = PHP_INT_MAX;
    static public $authRecordsCountMax = 3;
    static public $errorTrace = false;
    static public $gzipLevel = 0;
    static public $requestMethod = '';
    static public $timeLimit = 60;
    static public $tokenLength = 32;


    public $_db = null;
    public $_db_client = null;
    public $_methodArgs = [];
    public $_methodName = '';
    public $_timeStamp = 0;
    public $_token = 0;

    public $_dbDescriptor = [
        'dsn' => 'mysql:',
        'statementDir' => '/Packages/Generic/Apache/RestServer/DbStatements',
        'userName' => '',
        'userPassword' => '',
    ];


    public function _createToken() {
        return bin2hex(random_bytes(static::$tokenLength / 2));
    }

    public function _db_addAuthRecord($clientId, $token) {
        $dbStatement = $this->_db->execute('addAuthRecord', ['token' => $token, 'client_id' => $clientId]);

        if (!$dbStatement->rowCount()) {
            throw new \Exception('uniqueness');
        }
    }

    public function _db_addClient($name, $passwordHash, $data = []) {
        $dbStatement = $this->_db->execute('addClient', [...$data, 'name' => $name, 'passwordHash' => $passwordHash]);

        if (!$dbStatement->rowCount()) {
            throw new \Exception('uniqueness');
        }
    }

    public function _db_getAuthRecordsCount($clientId) {
        return $this->_db->fetch('getAuthRecordsCount', ['client_id' => $clientId])[0]['count'];
    }

    public function _db_getClient($name = '', $token = '') {
        return $this->_db->fetch('getClient', ['expiration' => static::$authRecordExpiration, 'name' => $name, 'token' => $token])[0];
    }

    public function _db_getClientByName($name) {
        return $this->_db->fetch('getClientByName', ['name' => $name])[0];
    }

    public function _db_getClientByToken($token) {
        return $this->_db->fetch('getClientByToken', ['expiration' => static::$authRecordExpiration, 'token' => $token])[0];
    }

    public function _db_removeAuthRecord($clientId = '', $token = '') {
        return $this->_db->execute('removeAuthRecord', ['client_id' => $clientId, 'token' => $token]);
    }

    public function _db_removeAuthRecordsExessive($clientId, $count = 1) {
        return $this->_db->execute('removeAuthRecordsExessive', ['client_id' => $clientId, 'count' => $count]);
    }

    public function _db_removeAuthRecordsExpired($clientId) {
        return $this->_db->execute('removeAuthRecordsExpired', ['client_id' => $clientId, 'expiration' => static::$authRecordExpiration]);
    }

    public function _execute() {
        $result = null;

        try {
            $this->_parseRequest();
            $result = ['result' => $this->{$this->_methodName}(...$this->_methodArgs)];
        }
        catch (\Error $error) {
            $result = ['error' => $error->getMessage()];

            if (static::$errorTrace) {
                $result['errorTrace'] = $error->getTraceAsString();
            }
        }
        catch (\Exception $exception) {
            $result = ['exception' => $exception->getMessage()];

            if (static::$errorTrace) {
                $result['errorTrace'] = $exception->getTraceAsString();
            }
        }

        $result = Json::stringify($result);

        if (static::$gzipLevel) {
            $result = gzEncode($result, static::$gzipLevel);
            header('content-encoding: gzip');
        }

        echo $result;
    }

    public function _init() {}

    public function _parseRequest() {
        if (static::$requestMethod && $_SERVER['REQUEST_METHOD'] != static::$requestMethod) {
            throw new \Exception('requestMethod');
        }

        if ($_SERVER['REQUEST_METHOD'] == 'POST') {
            $requestData = Json::parse(file_get_contents('php://input'));
            $this->_methodArgs = $requestData['args'] ?? [];
            $this->_methodName = $requestData['method'] ?? '';
            $this->_token = $requestData['token'] ?? '';
        }
        else {
            $this->_methodArgs = Json::parse($_GET['args']) ?? $_GET['args'] ?? [];
            $this->_methodName = $_GET['method'] ?? '';
            $this->_token = $_GET['token'] ?? '';
        }

        if (!$this->_methodName || str_starts_with($this->_methodName, '_')) {
            throw new \Exception('method');
        }
    }

    public function _timeLimit_check() {
        return microTime(true) - $this->_timeStamp <= static::$timeLimit;
    }

    public function _verify() {
        if ($this->_token) {
            $this->_db_client = $this->_db_getClientByToken($this->_token);
        }

        if ($this->_db_client) return;

        throw new \Exception('verification');
    }


    public function __construct() {
        $this->_db = new Db(
            dsn: $this->_dbDescriptor['dsn'],
            statementDir: "{$_SERVER['DOCUMENT_ROOT']}/{$this->_dbDescriptor['statementDir']}",
            userName: $this->_dbDescriptor['userName'],
            userPassword: $this->_dbDescriptor['userPassword'],
        );
        $this->_timeStamp = microTime(true);
        $this->_init();
        $this->_execute();
    }

    public function logIn($name, $password) {
        $client = $this->_db_getClientByName($name);

        if (!$client || !password_verify($password, $client['passwordHash'])) {
            throw new \Exception('authorization');
        }

        $this->_db_removeAuthRecordsExpired($client['id']);
        $authRecordsExcessiveCount = $this->_db_getAuthRecordsCount($client['id']) - static::$authRecordsCountMax + 1;

        if ($authRecordsExcessiveCount > 0) {
            $this->_db_removeAuthRecordsExessive($client['id'], $authRecordsExcessiveCount);
        }

        $client['token'] = $this->_createToken();
        $this->_db_client = $client;
        $this->_db_addAuthRecord($client['id'], $client['token']);

        return $client['token'];
    }

    public function logOut($all = false) {
        if (!$this->ping()) return;

        $all ? $this->_db_removeAuthRecord(clientId: $this->_db_client['id']) : $this->_db_removeAuthRecord(token: $this->_db_client['token']);
    }

    public function ping() {
        try {
            $this->_verify();

            return true;
        }
        catch (\Exception) {
            return false;
        }
    }

    public function register($name, $password, $data = []) {
        $this->_db_addClient($name, password_hash($password, null), $data);

        return $this->logIn($name, $password);
    }
}
