<?php

session_start();

$path = $_SERVER['PATH_INFO'];
if (empty($path)) {
    header('Location: ' . $_SERVER['REQUEST_URI'] . '/');
    die();
}

$__vm = '';
preg_match('/^\/__vm\/(.*)$/', $path, $matches);
if (!empty($matches[1])) {
    $__vm = $matches[1];
}

if (!empty($_SESSION['appName'])) {
    $appName = $_SESSION['appName'];
}
else {
    $appName = substr(strrchr($path, '/'), 1); //get everything after last slash (/test => test)
}

$tplPath = "html/{$appName}.html";
$jsonPath = "php/app/{$appName}.json";
$appPath = "php/app/{$appName}.php";

if (!(preg_match('/^[a-zA-Z0-9_]+$/', $appName) && file_exists($tplPath) && file_exists($jsonPath) && file_exists($appPath))) {
    include "html/404.html";
    die();
}

$injectEliminateRequest = true;

include "php/session.php";
include $appPath;

$patchOutput = array();
$method = $_SERVER['REQUEST_METHOD'];
if (substr_count($_SERVER['HTTP_ACCEPT'], 'application/json')) {
    $accept = 'json';
}
else if (substr_count($_SERVER['HTTP_ACCEPT'], 'text/html')) {
    $accept = 'html';
}

if (empty($_SESSION['data'])) {
    restartSession();
}

if ($accept == 'html' && $method == 'GET') {
    restartSession();
    applicationLogic();
    include $tplPath;
}
else if ($accept == 'json' && $__vm != getProp('View-Model')) {
    header(':', true, 401);
    echo json_encode(array("error" => "wrong __vm param '{$__vm}' should be '" . getProp('View-Model') . "'"));
}
else if ($accept == 'json' && $method == 'GET') {
    applicationLogic();
    echo json_encode($_SESSION['data']);
}
else if ($accept == 'json' && $method == 'PATCH') {
    $post = file_get_contents('php://input');
    $patchInput = json_decode($post, true);
    if (!is_array($patchInput) || !array_key_exists(0, $patchInput)) {
        $patchInput = array($patchInput);
    }
    try {
        $sanitized = array();
        foreach ($patchInput as $key => $value) {
            if ($patchInput[$key]['replace'] === '/View-Model') {
                unset($patchInput[$key]);
            }
        }
        $_SESSION['data'] = @JsonPatch::patch($_SESSION['data'], $patchInput);
    }
    catch (Exception $e) {
        header(':', true, 404);
        $patchOutput = array(
            "error" => $e->getMessage()
        );
    }

    applicationLogic();
    echo json_encode($patchOutput);
}
else {
    include "html/404.html";
}