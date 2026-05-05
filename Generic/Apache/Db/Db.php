<?php

namespace Apache;


class Db extends \Pdo {
    public $_statementDir = '';
    public $_statements = [];
    public $_statementsPrepared = [];


    public function _getStatement($key) {
        $this->addSstatements([$key => '']);

        return $this->_statements[$key];
    }

    public function _getStatementPrepared($key) {
        if (!$this->_statementsPrepared[$key]) {
            $statement = $this->_getStatement($key);
            $this->_statementsPrepared[$key] = $this->prepare($statement);
        }

        return $this->_statementsPrepared[$key];
    }


    public function __construct(
        $dsn,
        $opts = [],
        $statementDir = '',
        $userName = '',
        $userPassword = '',
    ) {
        $opts[static::MYSQL_ATTR_LOCAL_INFILE] = true;
        parent::__construct($dsn, $userName, $userPassword, $opts);

        $this->_statementDir = $statementDir;
        $this->setAttribute(static::ATTR_DEFAULT_FETCH_MODE, static::FETCH_ASSOC);
        $this->setAttribute(static::ATTR_ERRMODE, static::ERRMODE_EXCEPTION);
        $this->setAttribute(static::ATTR_STRINGIFY_FETCHES, false);
    }

    public function addSstatements($statements) {
        foreach ($statements as $key => $statement) {
            if ($this->_statements[$key]) continue;

            $this->_statements[$key] = $statement ?: file_get_contents("$this->_statementDir/$key.sql");
        }
    }

    public function execute($key, $parameters = null) {
        $statementPrepared = $this->_getStatementPrepared($key);

        foreach ($parameters as $key => $value) {
            $statementPrepared->bindValue($key, ...is_array($value) ? $value : (is_int($value) ? [$value, static::PARAM_INT] : [$value]));
        }

        $statementPrepared->execute();

        return $statementPrepared;
    }

    public function executeRaw($key) {
        return $this->exec($this->_getStatement($key));
    }

    public function fetch($key, $parameters = null) {
        return $this->execute($key, $parameters)->fetchAll();
    }
}
